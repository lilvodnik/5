document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/auth.html';
    return;
  }

  // Загрузка информации о пользователе
  fetch('/api/user', {
    headers: { 'Authorization': token }
  })
  .then(response => {
    if (!response.ok) throw new Error('Not authorized');
    return response.json();
  })
  .then(data => {
    document.getElementById('profile-username').textContent = data.username;
  })
  .catch(() => {
    localStorage.removeItem('token');
    window.location.href = '/auth.html';
  });

  // Кнопка перехода к задачам
  document.getElementById('tasks-btn').addEventListener('click', () => {
    window.location.href = '/';
  });

  // Кнопка выхода
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  });
});