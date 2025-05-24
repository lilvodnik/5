document.addEventListener('DOMContentLoaded', () => {
    // Элементы DOM
    const authBtn = document.getElementById('auth-btn');
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');
    const filterSelect = document.getElementById('filter-category');
    let currentTasks = [];

    // Проверка авторизации
    const token = localStorage.getItem('token');
    updateAuthButton(token);

    // Загрузка задач при загрузке страницы
    loadTasks();

    // Обработчик формы добавления задачи
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addTask();
    });

    // Обработчик фильтрации задач
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            renderTasks(filterTasks(currentTasks, filterSelect.value));
        });
    }

    // Функция обновления кнопки авторизации
    function updateAuthButton(token) {
        if (token) {
            fetch('/api/user', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => {
                if (response.ok) {
                    return response.json().then(data => {
                        authBtn.textContent = data.username;
                        authBtn.onclick = () => window.location.href = '/profile.html';
                    });
                }
                throw new Error('Not authorized');
            })
            .catch(() => {
                localStorage.removeItem('token');
                authBtn.textContent = 'Вход';
                authBtn.onclick = () => window.location.href = '/auth.html';
            });
        } else {
            authBtn.onclick = () => window.location.href = '/auth.html';
        }
    }

    // Функция загрузки задач
    async function loadTasks() {
        try {
            const response = await fetch('/api/tasks', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (!response.ok) throw new Error('Ошибка загрузки задач');
            
            currentTasks = await response.json();
            renderTasks(currentTasks);
        } catch (error) {
            console.error('Ошибка загрузки задач:', error);
            showMessage('Не удалось загрузить задачи', 'error');
        }
    }

    // Функция добавления задачи
    async function addTask() {
        const titleInput = document.getElementById('task-title');
        const deadlineInput = document.getElementById('task-deadline');
        const categorySelect = document.getElementById('task-category');
        
        const title = titleInput.value.trim();
        const deadline = deadlineInput.value;
        const category = categorySelect.value;

        if (!title) {
            showMessage('Введите название задачи', 'error');
            return;
        }

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ 
                    title,
                    deadline: deadline || null,
                    category: category || 'new'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка сервера');
            }

            const newTask = await response.json();
            showMessage('Задача добавлена!', 'success');
            titleInput.value = '';
            deadlineInput.value = '';
            loadTasks();
        } catch (error) {
            console.error('Ошибка добавления задачи:', error);
            showMessage(error.message || 'Не удалось добавить задачу', 'error');
        }
    }

    // Функция отображения задач
    function renderTasks(tasks) {
        taskList.innerHTML = '';
        
        if (!tasks || tasks.length === 0) {
            taskList.innerHTML = '<li class="empty">Нет задач. Добавьте первую!</li>';
            return;
        }

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task ${task.category}`;
            li.innerHTML = `
                <div class="task-content">
                    <h3>${task.title}</h3>
                    <div class="task-meta">
                        <span class="category ${task.category}">${getCategoryName(task.category)}</span>
                        ${task.deadline ? `<span class="deadline">${new Date(task.deadline).toLocaleString()}</span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <select class="status-select" onchange="updateTaskStatus(${task.id}, this.value)">
                        <option value="new" ${task.category === 'new' ? 'selected' : ''}>Новая</option>
                        <option value="in-progress" ${task.category === 'in-progress' ? 'selected' : ''}>В работе</option>
                        <option value="completed" ${task.category === 'completed' ? 'selected' : ''}>Завершена</option>
                    </select>
                    <button class="delete-btn" onclick="deleteTask(${task.id})">Удалить</button>
                </div>
            `;
            taskList.appendChild(li);
        });
    }

    // Функция фильтрации задач
    function filterTasks(tasks, filter) {
        if (filter === 'all') return tasks;
        return tasks.filter(task => task.category === filter);
    }

    // Функция обновления статуса задачи
    window.updateTaskStatus = async function(taskId, newStatus) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('Ошибка обновления');
            
            showMessage('Статус обновлен', 'success');
            loadTasks();
        } catch (error) {
            console.error('Ошибка:', error);
            showMessage('Не удалось обновить статус', 'error');
        }
    };

    // Функция удаления задачи
    window.deleteTask = async function(taskId) {
        if (!confirm('Удалить эту задачу?')) return;

        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            if (!response.ok) throw new Error('Ошибка удаления');
            
            showMessage('Задача удалена', 'success');
            loadTasks();
        } catch (error) {
            console.error('Ошибка:', error);
            showMessage('Не удалось удалить задачу', 'error');
        }
    };

    // Вспомогательные функции
    function getCategoryName(category) {
        const names = {
            'new': 'Новая',
            'in-progress': 'В работе',
            'completed': 'Завершена',
            'overdue': 'Просроченная'
        };
        return names[category] || category;
    }

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
});