# Менеджер задач с авторизацией


Простое веб-приложение для управления задачами с системой аутентификации пользователей.

## 📌 Возможности

- ✅ Регистрация и авторизация пользователей
- ✅ Создание, редактирование и удаление задач
- ✅ Категории задач (Новые, В работе, Завершенные)
- ✅ Установка сроков выполнения
- 📱 Адаптивный интерфейс

## 🛠 Технологии

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express
- **База данных**: JSON-файлы (users.json, tasks.json)
- **Аутентификация**: JWT-токены
- **Дополнительно**: bcryptjs для хеширования паролей

## 🚀 Установка и запуск

1. Клонируйте репозиторий:
```git clone https://github.com/ваш-username/task-manager.git```
```cd task-manager```
Установите зависимости:

```npm install```
Запустите сервер:

```node server.js```
Откройте в браузере:

```http://localhost:3000```
📂 Структура проекта
```task-manager/
├── public/            # Фронтенд
│   ├── css/           # Стили
│   ├── js/            # Скрипты
│   └── *.html         # HTML-страницы
├── server.js          # Серверный код
├── users.json         # База данных пользователей
├── tasks.json         # База данных задач
├── package.json       # Зависимости
└── README.md          # Этот файл


