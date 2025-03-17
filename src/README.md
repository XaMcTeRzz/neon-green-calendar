# Мультимесенджер Бот для Задач

Цей проект містить реалізацію бота для відстеження та звітування про задачі через різні месенджери, включаючи Telegram, Viber та WhatsApp.

## Можливості

- 📱 Підтримка кількох месенджерів (Telegram, Viber, WhatsApp)
- 📊 Щоденні звіти про виконані та невиконані задачі
- ⏰ Налаштування часу відправки звітів
- 🔐 Безпечне зберігання токенів та конфігурацій

## Структура проекту

- `telegram_bot_api.py` - реалізація Telegram бота через прямі HTTP-запити до API
- `multi_messenger.py` - універсальна реалізація бота для різних месенджерів
- `config.json` - файл для зберігання налаштувань Telegram бота
- `messenger_config.json` - файл для зберігання налаштувань мультимесенджер бота
- `tasks.json` - файл для зберігання задач

## Вимоги

- Python 3.7+
- `requests` - для HTTP запитів
- `schedule` - для планування задач

## Встановлення

1. Клонуйте репозиторій:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Встановіть залежності:
```bash
pip install requests schedule
```

## Використання

### Telegram бот

Для запуску Telegram бота через прямі API-запити:

```bash
python src/telegram_bot_api.py
```

Основні команди:
- `/start` - Початок роботи з ботом
- `/settings` - Налаштування бота (токен)
- `/report` - Отримати звіт за поточний день

### Мультимесенджер бот

Для запуску бота з підтримкою кількох месенджерів:

```bash
python src/multi_messenger.py
```

## Налаштування месенджерів

### Telegram

1. Створіть бота через [@BotFather](https://t.me/botfather)
2. Отримайте токен бота
3. Використовуйте команду `/settings` в чаті з ботом для введення токена

### Viber

1. Створіть Viber бота на [Viber Developer Portal](https://developers.viber.com/)
2. Отримайте токен бота
3. Налаштуйте webhook URL для отримання оновлень
4. Додайте налаштування у файл `messenger_config.json`:
   ```json
   {
     "viber": {
       "token": "ваш_токен",
       "webhook_url": "ваш_webhook_url",
       "sender": {
         "name": "Task Bot",
         "avatar": "url_до_аватара"
       }
     }
   }
   ```

### WhatsApp

1. Створіть акаунт розробника в [Meta for Developers](https://developers.facebook.com/)
2. Налаштуйте WhatsApp Business API
3. Отримайте токен та ID телефону
4. Додайте налаштування у файл `messenger_config.json`:
   ```json
   {
     "whatsapp": {
       "token": "ваш_токен",
       "phone_number_id": "ваш_phone_number_id"
     }
   }
   ```

## API Телеграм бота

Бот використовує прямі HTTP-запити до Telegram Bot API без додаткових бібліотек. Основні методи API, які використовуються:

- `getUpdates` - отримання оновлень
- `sendMessage` - відправка повідомлень
- `setWebhook` - встановлення webhook (опціонально)

Приклад HTTP-запиту для відправки повідомлення:
```
POST https://api.telegram.org/bot<TOKEN>/sendMessage
{
  "chat_id": 123456789,
  "text": "Привіт! Це тестове повідомлення"
}
```

## Структура задач

Задачі зберігаються у файлі `tasks.json` у форматі:
```json
{
  "tasks": [
    {
      "name": "Задача 1",
      "completed": true
    },
    {
      "name": "Задача 2",
      "completed": false
    }
  ]
}
```

## Формат звіту

Щоденний звіт має наступний формат:
```
📅 Звіт за день (17.03.2023):

✅ Виконані задачі:
- Задача 1

❌ Невиконані задачі:
- Задача 2
```

## Обробка помилок

Бот включає базову обробку помилок:
- Логування помилок у консоль
- Повторні спроби підключення при втраті зв'язку
- Перевірка наявності токена перед виконанням запитів

## Додавання нових месенджерів

Для додавання підтримки нового месенджера:

1. Створіть новий клас, що успадковується від `MessengerAPI`
2. Реалізуйте абстрактні методи:
   - `initialize(self, config)`
   - `send_message(self, recipient_id, text, **kwargs)`
   - `process_update(self, update_data)`
   - `start_polling(self)`
3. Додайте екземпляр класу в `MultiMessengerBot.__init__`

## Ліцензія

MIT 