# Telegram Task Bot

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/username/telegram-task-bot/python-test.yml?branch=main)
![License](https://img.shields.io/badge/license-MIT-green)

Telegram бот для керування задачами з інтеграцією Google Calendar. Бот підтримує щоденну звітність про виконані та невиконані задачі, а також дозволяє синхронізувати події з Google Calendar.

## Функціональність

- 📋 Керування задачами (додавання, редагування, видалення)
- 📅 Інтеграція з Google Calendar
- 📊 Щоденні звіти про статус задач
- 🌐 Підтримка декількох месенджерів (Telegram, Viber, WhatsApp)
- 🔄 Webhook-сервер для обробки вхідних повідомлень
- 🔒 Безпечне зберігання конфіденційних даних

## Структура проекту

```
telegram-task-bot/
├── .github/
│   └── workflows/
│       └── python-test.yml    # GitHub Actions для тестування
├── src/
│   ├── telegram_bot_api.py    # Базова реалізація Telegram API
│   ├── telegram_bot_extended.py # Розширена версія бота з керуванням задачами
│   ├── task_manager.py        # Клас для керування задачами
│   ├── google_calendar_integration.py # Інтеграція з Google Calendar
│   ├── multi_messenger.py     # Підтримка декількох месенджерів
│   ├── webhook_server.py      # Веб-сервер для webhook
│   └── lib/                   # Допоміжні модулі
├── .gitignore                 # Файли, які слід ігнорувати в Git
├── requirements.txt           # Залежності Python
└── README.md                  # Цей файл
```

## Встановлення

1. Клонуйте репозиторій:
```bash
git clone https://github.com/username/telegram-task-bot.git
cd telegram-task-bot
```

2. Створіть віртуальне середовище та встановіть залежності:
```bash
python -m venv venv
source venv/bin/activate  # На Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Налаштуйте конфігурацію:
   - Створіть файл `config.json` зі своїми токенами та налаштуваннями
   - Для інтеграції з Google Calendar, отримайте `credentials.json` з [Google Cloud Console](https://console.cloud.google.com/)

## Використання

### Запуск бота

```bash
python src/telegram_bot_extended.py
```

### Запуск webhook-сервера

```bash
python src/webhook_server.py
```

### Налаштування Telegram бота

1. Створіть нового бота через [@BotFather](https://t.me/BotFather)
2. Отримайте токен бота та додайте його в `config.json`
3. Встановіть команди для бота через BotFather:
   ```
   start - Почати роботу з ботом
   help - Отримати довідку
   settings - Налаштування бота
   add_task - Додати нову задачу
   list_tasks - Показати список задач
   sync_calendar - Синхронізувати з Google Calendar
   report - Отримати звіт по задачам
   ```

## API Документація

Детальна документація API доступна у файлі [API_DOCS.md](src/API_DOCS.md).

## Розгортання

Інструкції з розгортання бота на різних платформах доступні у файлі [GITHUB_SETUP.md](GITHUB_SETUP.md).

## Ліцензія

Цей проект поширюється під ліцензією MIT. Див. файл [LICENSE](LICENSE) для отримання додаткової інформації.

## Автори

Бот розроблено за допомогою Claude 3.7 Sonnet.

## Зробити внесок

Внески вітаються! Будь ласка, відкрийте issue або створіть pull request, якщо ви хочете покращити проект.
