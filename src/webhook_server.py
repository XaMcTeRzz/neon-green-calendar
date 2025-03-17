#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import logging
from flask import Flask, request, jsonify
from src.multi_messenger import MultiMessengerBot, TelegramAPI, ViberAPI, WhatsAppAPI

# Налаштування логування
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Ініціалізація Flask додатку
app = Flask(__name__)

# Ініціалізація бота
bot = MultiMessengerBot()

@app.route('/')
def index():
    """Головна сторінка"""
    return 'Бот для звітування про задачі активний!'

@app.route('/webhook/telegram', methods=['POST'])
def telegram_webhook():
    """Обробник webhook для Telegram"""
    data = request.json
    logger.info(f"Отримано оновлення від Telegram: {data}")
    
    telegram = bot.messengers.get('telegram')
    if not telegram:
        return jsonify({'status': 'error', 'message': 'Telegram не налаштовано'})
    
    # Обробка повідомлення
    if 'message' in data:
        message_data = telegram.process_update(data)
        if message_data:
            bot.handle_message(message_data)
    
    return jsonify({'status': 'ok'})

@app.route('/webhook/viber', methods=['POST'])
def viber_webhook():
    """Обробник webhook для Viber"""
    data = request.json
    logger.info(f"Отримано оновлення від Viber: {data}")
    
    viber = bot.messengers.get('viber')
    if not viber:
        return jsonify({'status': 'error', 'message': 'Viber не налаштовано'})
    
    # Підтвердження webhook
    if data.get('event') == 'webhook':
        logger.info("Viber webhook успішно встановлено")
        return jsonify({'status': 0, 'status_message': 'ok', 'event': 'webhook'})
    
    # Обробка повідомлення
    message_data = viber.process_update(data)
    if message_data:
        bot.handle_message(message_data)
    
    return jsonify({'status': 0, 'status_message': 'ok'})

@app.route('/webhook/whatsapp', methods=['POST'])
def whatsapp_webhook():
    """Обробник webhook для WhatsApp"""
    data = request.json
    logger.info(f"Отримано оновлення від WhatsApp: {data}")
    
    whatsapp = bot.messengers.get('whatsapp')
    if not whatsapp:
        return jsonify({'status': 'error', 'message': 'WhatsApp не налаштовано'})
    
    # Перевірка на challenge верифікацію
    if request.args.get('hub.mode') == 'subscribe' and request.args.get('hub.challenge'):
        challenge = request.args.get('hub.challenge')
        logger.info(f"Отримано WhatsApp challenge: {challenge}")
        return challenge
    
    # Обробка повідомлення
    message_data = whatsapp.process_update(data)
    if message_data:
        bot.handle_message(message_data)
    
    return jsonify({'status': 'ok'})

@app.route('/setup', methods=['GET', 'POST'])
def setup():
    """Сторінка налаштування ботів"""
    if request.method == 'POST':
        # Обробка налаштування для різних месенджерів
        if 'telegram_token' in request.form:
            telegram_token = request.form.get('telegram_token')
            telegram_config = bot.config.get('telegram', {})
            telegram_config['token'] = telegram_token
            bot.config['telegram'] = telegram_config
            bot.save_config()
            
            # Оновлення бота
            telegram = bot.messengers.get('telegram')
            if telegram:
                telegram.initialize(telegram_config)
            
            # Встановлення webhook, якщо вказано URL
            webhook_url = request.form.get('telegram_webhook')
            if webhook_url:
                telegram_config['webhook_url'] = webhook_url
                bot.config['telegram'] = telegram_config
                bot.save_config()
                
                if telegram:
                    telegram.set_webhook(webhook_url)
            
            return jsonify({'status': 'ok', 'message': 'Налаштування Telegram збережено'})
        
        elif 'viber_token' in request.form:
            viber_token = request.form.get('viber_token')
            viber_webhook = request.form.get('viber_webhook')
            viber_sender_name = request.form.get('viber_sender_name', 'Task Bot')
            
            viber_config = bot.config.get('viber', {})
            viber_config['token'] = viber_token
            
            if viber_webhook:
                viber_config['webhook_url'] = viber_webhook
            
            viber_config['sender'] = {
                'name': viber_sender_name,
                'avatar': request.form.get('viber_avatar', '')
            }
            
            bot.config['viber'] = viber_config
            bot.save_config()
            
            # Оновлення бота
            viber = bot.messengers.get('viber')
            if viber:
                viber.initialize(viber_config)
            
            return jsonify({'status': 'ok', 'message': 'Налаштування Viber збережено'})
        
        elif 'whatsapp_token' in request.form:
            whatsapp_token = request.form.get('whatsapp_token')
            whatsapp_phone_id = request.form.get('whatsapp_phone_id')
            
            whatsapp_config = bot.config.get('whatsapp', {})
            whatsapp_config['token'] = whatsapp_token
            whatsapp_config['phone_number_id'] = whatsapp_phone_id
            
            bot.config['whatsapp'] = whatsapp_config
            bot.save_config()
            
            # Оновлення бота
            whatsapp = bot.messengers.get('whatsapp')
            if whatsapp:
                whatsapp.initialize(whatsapp_config)
            
            return jsonify({'status': 'ok', 'message': 'Налаштування WhatsApp збережено'})
        
        return jsonify({'status': 'error', 'message': 'Невідомий запит'})
    
    # Відображення форми налаштування
    return """
    <html>
    <head>
        <title>Налаштування бота</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            h1 { color: #333; }
            .container { max-width: 800px; margin: 0 auto; }
            .section { margin-bottom: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input[type="text"] { width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; }
            input[type="submit"] { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
            input[type="submit"]:hover { background-color: #45a049; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Налаштування бота для звітування про задачі</h1>
            
            <div class="section">
                <h2>Telegram</h2>
                <form id="telegram-form" action="/setup" method="post">
                    <label for="telegram_token">Токен бота:</label>
                    <input type="text" id="telegram_token" name="telegram_token" placeholder="Введіть токен Telegram бота">
                    
                    <label for="telegram_webhook">Webhook URL (опціонально):</label>
                    <input type="text" id="telegram_webhook" name="telegram_webhook" placeholder="https://yourdomain.com/webhook/telegram">
                    
                    <input type="submit" value="Зберегти">
                </form>
            </div>
            
            <div class="section">
                <h2>Viber</h2>
                <form id="viber-form" action="/setup" method="post">
                    <label for="viber_token">Токен бота:</label>
                    <input type="text" id="viber_token" name="viber_token" placeholder="Введіть токен Viber бота">
                    
                    <label for="viber_webhook">Webhook URL:</label>
                    <input type="text" id="viber_webhook" name="viber_webhook" placeholder="https://yourdomain.com/webhook/viber">
                    
                    <label for="viber_sender_name">Ім'я відправника:</label>
                    <input type="text" id="viber_sender_name" name="viber_sender_name" placeholder="Task Bot">
                    
                    <label for="viber_avatar">Аватар URL (опціонально):</label>
                    <input type="text" id="viber_avatar" name="viber_avatar" placeholder="https://example.com/avatar.jpg">
                    
                    <input type="submit" value="Зберегти">
                </form>
            </div>
            
            <div class="section">
                <h2>WhatsApp</h2>
                <form id="whatsapp-form" action="/setup" method="post">
                    <label for="whatsapp_token">Токен доступу:</label>
                    <input type="text" id="whatsapp_token" name="whatsapp_token" placeholder="Введіть токен WhatsApp">
                    
                    <label for="whatsapp_phone_id">ID телефону:</label>
                    <input type="text" id="whatsapp_phone_id" name="whatsapp_phone_id" placeholder="Введіть ID телефону">
                    
                    <input type="submit" value="Зберегти">
                </form>
            </div>
        </div>
        
        <script>
            // Додавання AJAX-відправки форм
            document.querySelectorAll('form').forEach(form => {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const formData = new FormData(this);
                    
                    fetch('/setup', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        alert(data.message);
                    })
                    .catch(error => {
                        alert('Помилка при збереженні налаштувань');
                        console.error('Error:', error);
                    });
                });
            });
        </script>
    </body>
    </html>
    """

if __name__ == '__main__':
    # Запуск Flask сервера
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 