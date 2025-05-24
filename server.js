const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Конфигурация
const SECRET_KEY = 'your-very-secure-key-123';
const USERS_FILE = path.join(__dirname, 'users.json');
const TASKS_FILE = path.join(__dirname, 'tasks.json');

// Инициализация файлов
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
if (!fs.existsSync(TASKS_FILE)) fs.writeFileSync(TASKS_FILE, '[]');

// Функция для проверки JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log('Гостевой доступ. Токен не предоставлен');
    req.user = { username: 'guest_' + Date.now() };
    return next();
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.log('Неверный токен:', err);
      return res.sendStatus(403);
    }
    console.log('Авторизованный пользователь:', user.username);
    req.user = user;
    next();
  });
}

// Регистрация
app.post('/api/tasks', authenticateToken, (req, res) => {
  try {
    const { title, deadline, category } = req.body;
    
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Некорректное название задачи' });
    }

    const tasksData = JSON.parse(fs.readFileSync(TASKS_FILE));
    const userTasks = tasksData[req.user.username] || [];
    
    const newTask = {
      id: Date.now(),
      title: title.trim(),
      deadline: deadline || null,
      category: category || 'new',
      createdAt: new Date().toISOString()
    };

    userTasks.push(newTask);
    tasksData[req.user.username] = userTasks;
    
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasksData, null, 2));
    console.log('Задача сохранена:', newTask); // Логирование
    
    res.status(201).json(newTask);
  } catch (err) {
    console.error('Ошибка при добавлении задачи:', err);
    res.status(500).json({ error: 'Ошибка сервера при сохранении задачи' });
  }
});

// Вход
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(USERS_FILE));
    const user = users.find(u => u.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение информации о пользователе
app.get('/api/user', authenticateToken, (req, res) => {
  res.json({ username: req.user.username });
});

// Получение задач пользователя
app.get('/api/tasks', authenticateToken, (req, res) => {
  try {
    const tasksData = JSON.parse(fs.readFileSync(TASKS_FILE));
    const userTasks = tasksData[req.user.username] || [];
    
    // Проверка дедлайнов
    const now = new Date();
    const updatedTasks = userTasks.map(task => {
      if (!task.deadline || task.category === 'completed') return task;
      
      const deadline = new Date(task.deadline);
      if (deadline < now && task.category !== 'completed') {
        return { ...task, category: 'overdue' };
      }
      return task;
    });
    
    res.json(updatedTasks);
  } catch (err) {
    console.error('Error getting tasks:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Добавление задачи
app.post('/api/tasks', authenticateToken, (req, res) => {
  try {
    const { title, deadline, category } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const tasksData = JSON.parse(fs.readFileSync(TASKS_FILE));
    const userTasks = tasksData[req.user.username] || [];
    
    const newTask = {
      id: Date.now(),
      title,
      deadline: deadline || null,
      category: category || 'new',
      createdAt: new Date().toISOString()
    };

    userTasks.push(newTask);
    tasksData[req.user.username] = userTasks;
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasksData, null, 2));

    res.status(201).json(newTask);
  } catch (err) {
    console.error('Error adding task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновление задачи
app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { status } = req.body;
    
    const tasksData = JSON.parse(fs.readFileSync(TASKS_FILE));
    const userTasks = tasksData[req.user.username] || [];
    
    const taskIndex = userTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    userTasks[taskIndex].category = status;
    tasksData[req.user.username] = userTasks;
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasksData, null, 2));
    
    res.json(userTasks[taskIndex]);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Удаление задачи
app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    const tasksData = JSON.parse(fs.readFileSync(TASKS_FILE));
    const userTasks = tasksData[req.user.username] || [];
    
    const taskIndex = userTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    userTasks.splice(taskIndex, 1);
    tasksData[req.user.username] = userTasks;
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasksData, null, 2));
    
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});