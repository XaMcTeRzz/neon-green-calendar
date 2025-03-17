# Документація по API месенджерів

## Telegram Bot API

Офіційна документація: [Telegram Bot API](https://core.telegram.org/bots/api)

### Основні методи, які використовуються в проекті:

#### getUpdates

Отримує оновлення (повідомлення, команди тощо) від користувачів.

```
GET https://api.telegram.org/bot<TOKEN>/getUpdates
```

Параметри:
- `offset` (Integer, опціонально): Ідентифікатор першого оновлення, яке потрібно отримати. Зазвичай встановлюється як (last_update_id + 1).
- `limit` (Integer, опціонально): Максимальна кількість оновлень, які потрібно отримати. Від 1 до 100.
- `timeout` (Integer, опціонально): Час очікування в секундах для long polling.
- `allowed_updates` (Array of String, опціонально): Типи оновлень, які потрібно отримувати.

Приклад відповіді:
```json
{
  "ok": true,
  "result": [
    {
      "update_id": 123456789,
      "message": {
        "message_id": 123,
        "from": {
          "id": 123456789,
          "is_bot": false,
          "first_name": "John",
          "last_name": "Doe",
          "username": "johndoe",
          "language_code": "uk"
        },
        "chat": {
          "id": 123456789,
          "first_name": "John",
          "last_name": "Doe",
          "username": "johndoe",
          "type": "private"
        },
        "date": 1617345678,
        "text": "/start"
      }
    }
  ]
}
```

#### sendMessage

Відправляє текстове повідомлення користувачу.

```
POST https://api.telegram.org/bot<TOKEN>/sendMessage
```

Параметри:
- `chat_id` (Integer or String): ID чату або username.
- `text` (String): Текст повідомлення.
- `parse_mode` (String, опціонально): Режим форматування тексту (Markdown, HTML).
- `disable_web_page_preview` (Boolean, опціонально): Вимкнути попередній перегляд посилань.
- `disable_notification` (Boolean, опціонально): Відправити без звуку.
- `reply_to_message_id` (Integer, опціонально): ID повідомлення, на яке відповідати.
- `reply_markup` (InlineKeyboardMarkup, ReplyKeyboardMarkup, ReplyKeyboardRemove, ForceReply, опціонально): Додаткова клавіатура.

Приклад запиту:
```json
{
  "chat_id": 123456789,
  "text": "Привіт! Це тестове повідомлення",
  "parse_mode": "HTML"
}
```

#### setWebhook

Встановлює URL для вебхука.

```
POST https://api.telegram.org/bot<TOKEN>/setWebhook
```

Параметри:
- `url` (String): URL-адреса вебхука.
- `certificate` (InputFile, опціонально): Публічний ключ сертифіката.
- `max_connections` (Integer, опціонально): Максимальна кількість одночасних підключень. 1-100.
- `allowed_updates` (Array of String, опціонально): Типи оновлень, які потрібно отримувати.

#### deleteWebhook

Видаляє вебхук.

```
POST https://api.telegram.org/bot<TOKEN>/deleteWebhook
```

## Viber REST API

Офіційна документація: [Viber REST API](https://developers.viber.com/docs/api/rest-bot-api/)

### Основні методи:

#### set_webhook

Встановлює URL для вебхука.

```
POST https://chatapi.viber.com/pa/set_webhook
```

Заголовки:
- `X-Viber-Auth-Token`: Токен доступу до API Viber.

Тіло запиту:
```json
{
  "url": "https://your-webhook-url.com",
  "event_types": ["message", "subscribed", "unsubscribed", "conversation_started"],
  "send_name": true,
  "send_photo": true
}
```

#### send_message

Відправляє повідомлення користувачу.

```
POST https://chatapi.viber.com/pa/send_message
```

Заголовки:
- `X-Viber-Auth-Token`: Токен доступу до API Viber.

Тіло запиту для текстового повідомлення:
```json
{
  "receiver": "01234567890A=",
  "type": "text",
  "sender": {
    "name": "Task Bot",
    "avatar": "http://avatar.example.com"
  },
  "text": "Привіт! Це тестове повідомлення"
}
```

## WhatsApp Business API (Meta Cloud API)

Офіційна документація: [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/cloud-api/overview)

### Основні методи:

#### Відправка повідомлення

```
POST https://graph.facebook.com/v17.0/{phone-number-id}/messages
```

Заголовки:
- `Authorization`: `Bearer YOUR_ACCESS_TOKEN`
- `Content-Type`: `application/json`

Тіло запиту для текстового повідомлення:
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "{recipient-phone-number}",
  "type": "text",
  "text": {
    "body": "Привіт! Це тестове повідомлення"
  }
}
```

#### Отримання повідомлень

WhatsApp використовує вебхуки для надсилання оновлень. Необхідно налаштувати webhook URL у [Meta for Developers Dashboard](https://developers.facebook.com/).

Формат даних, які надсилає WhatsApp на ваш вебхук:
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "PHONE_NUMBER",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "contacts": [
              {
                "profile": {
                  "name": "NAME"
                },
                "wa_id": "WHATSAPP_ID"
              }
            ],
            "messages": [
              {
                "from": "WHATSAPP_ID",
                "id": "MESSAGE_ID",
                "timestamp": "TIMESTAMP",
                "type": "text",
                "text": {
                  "body": "MESSAGE_BODY"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

## Порівняльна таблиця можливостей API месенджерів

| Функція | Telegram | Viber | WhatsApp |
|---------|----------|-------|----------|
| Формат обміну даними | JSON | JSON | JSON |
| Отримання оновлень | Long Polling або Webhook | Тільки Webhook | Тільки Webhook |
| Текстові повідомлення | ✅ | ✅ | ✅ |
| Форматування тексту | HTML, Markdown | Обмежене | Обмежене |
| Кнопки | Вбудовані, Inline | Keyboard | Список кнопок |
| Зображення | ✅ | ✅ | ✅ |
| Документи | ✅ | ✅ | ✅ |
| Геолокація | ✅ | ✅ | ✅ |
| Стікери | ✅ | ✅ | ❌ |
| Аудіо | ✅ | ✅ | ✅ |
| Відео | ✅ | ✅ | ✅ |
| Групові чати | ✅ | ✅ | ✅ |
| Бот команди | `/command` | Немає стандарту | Немає стандарту |

## Особливості інтеграції з кожним месенджером

### Telegram

**Переваги:**
- Найбільш гнучкий та документований API
- Підтримка Long Polling (не потрібен публічний сервер)
- Розширені можливості форматування та інтерактивних елементів

**Особливості реалізації:**
- Використовуйте `offset` при запитах до `getUpdates` для уникнення повторного отримання повідомлень
- Встановіть таймаут для long polling (рекомендовано 30 секунд)
- Використовуйте `reply_markup` для додавання кнопок

### Viber

**Переваги:**
- Більша популярність у деяких регіонах
- Підтримка розширеного API для бізнесу

**Особливості реалізації:**
- Потрібен публічний HTTPS сервер для отримання повідомлень
- Валідація вебхуків через `webhook_verification`
- Більш складний процес підтвердження автентичності запитів

### WhatsApp

**Переваги:**
- Найбільша база користувачів
- Інтеграція з Meta Business ecosystem

**Особливості реалізації:**
- Потрібен публічний HTTPS сервер для отримання повідомлень
- Більш складний процес налаштування і верифікації
- Часті зміни в API та вимогах
- Потрібна верифікація бізнес-акаунту

## Приклад коду обробки вебхуків для всіх месенджерів

Для обробки вебхуків можна використовувати Flask або інший веб-фреймворк:

```python
from flask import Flask, request, jsonify
import json

app = Flask(__name__)

# Telegram webhook
@app.route('/webhook/telegram', methods=['POST'])
def telegram_webhook():
    data = request.json
    # Обробка повідомлення від Telegram
    if 'message' in data:
        message = data['message']
        chat_id = message.get('chat', {}).get('id')
        text = message.get('text', '')
        # Додаткова обробка...
    return jsonify({'status': 'ok'})

# Viber webhook
@app.route('/webhook/viber', methods=['POST'])
def viber_webhook():
    data = request.json
    # Обробка повідомлення від Viber
    if data.get('event') == 'message':
        message = data.get('message', {})
        user_id = data.get('sender', {}).get('id')
        text = message.get('text', '')
        # Додаткова обробка...
    return jsonify({'status': 0})

# WhatsApp webhook
@app.route('/webhook/whatsapp', methods=['POST'])
def whatsapp_webhook():
    data = request.json
    # Обробка повідомлення від WhatsApp
    if data.get('object') == 'whatsapp_business_account':
        try:
            entry = data.get('entry', [])[0]
            changes = entry.get('changes', [])[0]
            value = changes.get('value', {})
            
            if 'messages' in value:
                message = value['messages'][0]
                
                if message.get('type') == 'text':
                    text = message.get('text', {}).get('body', '')
                    user_id = message.get('from')
                    # Додаткова обробка...
        except (IndexError, KeyError) as e:
            print(f"Помилка обробки оновлення WhatsApp: {e}")
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
``` 