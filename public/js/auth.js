document.addEventListener('DOMContentLoaded', () => {
  // Переключение между вкладками
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.add('hidden');
      });
      
      document.getElementById(`${tab.dataset.tab}-form`).classList.remove('hidden');
    });
  });

  // Вход
  document.getElementById('login-btn').addEventListener('click', async () => {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        window.location.href = '/profile.html';
      } else {
        showMessage(data.error || 'Ошибка входа', 'error');
      }
    } catch (error) {
      showMessage('Ошибка соединения с сервером', 'error');
      console.error('Login error:', error);
    }
  });

  // Регистрация (исправленная)
  document.getElementById('register-btn').addEventListener('click', async () => {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value.trim();

    if (!username || !password) {
      showMessage('Заполните все поля', 'error');
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (response.ok) {
        showMessage('Регистрация успешна! Теперь войдите.', 'success');
        document.querySelector('.tab[data-tab="login"]').click();
        document.getElementById('register-username').value = '';
        document.getElementById('register-password').value = '';
      } else {
        showMessage(data.error || 'Ошибка регистрации', 'error');
      }
    } catch (error) {
      showMessage('Ошибка соединения с сервером', 'error');
      console.error('Registration error:', error);
    }
  });

  function showMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = `auth-message ${type}`;
    msg.textContent = text;
    document.querySelector('.auth-container').prepend(msg);
    
    setTimeout(() => {
      msg.remove();
    }, 5000);
  }
});