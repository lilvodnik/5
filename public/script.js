let currentTasks = [];

// Загрузка задач
async function loadTasks() {
  try {
    const response = await fetch('/api/tasks');
    if (!response.ok) throw new Error('Ошибка загрузки задач');
    
    currentTasks = await response.json();
    renderTasks();
    checkDeadlineNotifications();
  } catch (error) {
    console.error('Ошибка:', error);
    showMessage('Не удалось загрузить задачи', 'error');
  }
}

// Отображение задач
function renderTasks() {
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = '';

  if (currentTasks.length === 0) {
    taskList.innerHTML = '<li class="empty">Нет задач. Добавьте первую!</li>';
    return;
  }

  currentTasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task ${task.status}`;
    li.dataset.id = task.id;
    
    const deadline = task.deadline ? new Date(task.deadline) : null;
    const deadlineText = deadline ? 
      `До: ${deadline.toLocaleString('ru-RU')}` : 
      'Без срока';
    
    li.innerHTML = `
      <div class="task-main">
        <span class="task-title">${task.title}</span>
        <span class="task-deadline ${task.status === 'overdue' ? 'overdue' : ''}">
          ${deadlineText}
          ${task.status === 'overdue' ? ' (ПРОСРОЧЕНО)' : ''}
        </span>
      </div>
      <div class="task-actions">
        <select class="status-select" onchange="updateTaskStatus(${task.id}, this.value)">
          <option value="new" ${task.status === 'new' ? 'selected' : ''}>Новая</option>
          <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>В работе</option>
          <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Завершена</option>
        </select>
        <button class="delete-btn" onclick="deleteTask(${task.id})">Удалить</button>
      </div>
    `;
    
    taskList.appendChild(li);
  });
}

// Добавление задачи
async function addTask() {
  const titleInput = document.getElementById('taskInput');
  const deadlineInput = document.getElementById('taskDeadline');
  const title = titleInput.value.trim();

  if (!title) {
    showMessage('Введите название задачи', 'error');
    return;
  }

  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        deadline: deadlineInput.value
      })
    });

    if (!response.ok) throw new Error('Ошибка сервера');

    showMessage('Задача добавлена!', 'success');
    titleInput.value = '';
    deadlineInput.value = '';
    loadTasks();
  } catch (error) {
    console.error('Ошибка:', error);
    showMessage('Не удалось добавить задачу', 'error');
  }
}

// Обновление статуса
async function updateTaskStatus(taskId, newStatus) {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) throw new Error('Ошибка обновления');
    
    showMessage('Статус обновлен', 'success');
    loadTasks();
  } catch (error) {
    console.error('Ошибка:', error);
    showMessage('Не удалось обновить статус', 'error');
  }
}

// Удаление задачи
async function deleteTask(taskId) {
  if (!confirm('Удалить эту задачу?')) return;

  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Ошибка удаления');
    
    showMessage('Задача удалена', 'success');
    loadTasks();
  } catch (error) {
    console.error('Ошибка:', error);
    showMessage('Не удалось удалить задачу', 'error');
  }
}

// Проверка дедлайнов для уведомлений
function checkDeadlineNotifications() {
  const now = new Date();
  const soonTasks = currentTasks.filter(task => {
    if (!task.deadline || task.status === 'completed') return false;
    
    const deadline = new Date(task.deadline);
    const timeDiff = deadline - now;
    const hoursDiff = timeDiff / (60 * 60 * 1000);
    
    return hoursDiff > 0 && hoursDiff <= 3; // Задачи в ближайшие 24 часа
  });

  if (soonTasks.length > 0) {
    const taskList = soonTasks.map(t => `• ${t.title} (${new Date(t.deadline).toLocaleString()})`).join('\n');
    showMessage(`Скоро дедлайн:\n${taskList}`, 'warning');
  }
}

// Показ сообщений
function showMessage(text, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = text;
  
  document.body.prepend(messageDiv);
  
  setTimeout(() => {
    messageDiv.style.opacity = '0';
    setTimeout(() => messageDiv.remove(), 300);
  }, 5000);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  
  document.getElementById('taskInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });
});

// Глобальные функции
window.addTask = addTask;
window.updateTaskStatus = updateTaskStatus;
window.deleteTask = deleteTask;