#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import time
import logging
import requests
import schedule
from datetime import datetime
from threading import Thread
from abc import ABC, abstractmethod

# Налаштування логування
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Файли для зберігання налаштувань та задач
CONFIG_FILE = 'messenger_config.json'
TASKS_FILE = 'tasks.json'


class MessengerAPI(ABC):
    """Абстрактний клас для роботи з різними API месенджерів"""
    
    def __init__(self):
        self.config = {}
        self.name = "Unknown"
    
    @abstractmethod
    def initialize(self, config):
        """Ініціалізація месенджера з конфігурацією"""
        pass
    
    @abstractmethod
    def send_message(self, recipient_id, text, **kwargs):
        """
        Відправка повідомлення
        
        :param recipient_id: ID отримувача
        :param text: Текст повідомлення
        :param kwargs: Додаткові параметри
        """
        pass
    
    @abstractmethod
    def process_update(self, update_data):
        """
        Обробка оновлення від месенджера
        
        :param update_data: Дані оновлення
        """
        pass
    
    @abstractmethod
    def start_polling(self):
        """Початок опитування API месенджера"""
        pass


class TelegramAPI(MessengerAPI):
    """Клас для роботи з Telegram Bot API"""
    
    def __init__(self):
        super().__init__()
        self.name = "Telegram"
        self.token = None
        self.chat_id = None
        self.webhook_url = None
        self.user_states = {}
        self.last_update_id = 0
        self.api_url = 'https://api.telegram.org/bot{token}/{method}'
    
    def initialize(self, config):
        """
        Ініціалізація Telegram API з конфігурацією
        
        :param config: Словник з конфігурацією
        """
        self.config = config
        self.token = config.get('token')
        self.chat_id = config.get('chat_id')
        self.webhook_url = config.get('webhook_url')
        
        if not self.token:
            logger.warning("Telegram токен не вказано")
            return False
        
        return True
    
    def api_request(self, method, data=None, files=None):
        """
        Виконання запиту до Telegram API
        
        :param method: Метод API
        :param data: Дані для запиту
        :param files: Файли для відправки
        :return: Дані відповіді або None у разі помилки
        """
        if not self.token:
            logger.error("Запит не виконано: токен не налаштовано")
            return None
        
        url = self.api_url.format(token=self.token, method=method)
        
        try:
            if files:
                response = requests.post(url, data=data, files=files, timeout=30)
            else:
                response = requests.post(url, json=data, timeout=30)
            
            response.raise_for_status()
            result = response.json()
            
            if not result.get('ok'):
                logger.error(f"API помилка: {result.get('description')}")
                return None
            
            return result.get('result')
        except requests.RequestException as e:
            logger.error(f"Помилка запиту: {e}")
            return None
    
    def get_updates(self, offset=0, timeout=30):
        """
        Отримання оновлень від Telegram API
        
        :param offset: ID останнього отриманого оновлення + 1
        :param timeout: Час очікування в секундах
        :return: Список оновлень
        """
        data = {
            'offset': offset,
            'timeout': timeout,
            'allowed_updates': ['message', 'callback_query']
        }
        return self.api_request('getUpdates', data)
    
    def send_message(self, chat_id, text, **kwargs):
        """
        Відправка повідомлення через Telegram
        
        :param chat_id: ID чату
        :param text: Текст повідомлення
        :param kwargs: Додаткові параметри (parse_mode, reply_markup)
        :return: Відправлене повідомлення
        """
        data = {
            'chat_id': chat_id,
            'text': text
        }
        
        # Додавання додаткових параметрів
        for key, value in kwargs.items():
            if key in ['parse_mode', 'reply_markup']:
                data[key] = value
        
        return self.api_request('sendMessage', data)
    
    def process_update(self, update_data):
        """
        Обробка оновлення від Telegram
        
        :param update_data: Дані оновлення
        :return: Словник з даними повідомлення або None
        """
        if 'message' in update_data:
            message = update_data['message']
            
            # Базові дані з повідомлення
            text = message.get('text', '')
            chat_id = message.get('chat', {}).get('id')
            user_id = message.get('from', {}).get('id')
            
            return {
                'messenger': 'telegram',
                'text': text,
                'user_id': user_id,
                'chat_id': chat_id,
                'raw_data': message,
                'is_command': text.startswith('/')
            }
        
        return None
    
    def start_polling(self):
        """Початок опитування Telegram API"""
        logger.info("Початок опитування Telegram API")
        
        while True:
            try:
                updates = self.get_updates(offset=self.last_update_id + 1)
                
                if updates:
                    for update in updates:
                        update_id = update.get('update_id')
                        if update_id > self.last_update_id:
                            self.last_update_id = update_id
                        
                        # Обробка повідомлення через callback
                        if self.message_handler:
                            message_data = self.process_update(update)
                            if message_data:
                                self.message_handler(message_data)
            
            except Exception as e:
                logger.error(f"Помилка під час опитування Telegram: {e}")
            
            time.sleep(1)


class ViberAPI(MessengerAPI):
    """Клас для роботи з Viber API"""
    
    def __init__(self):
        super().__init__()
        self.name = "Viber"
        self.token = None
        self.webhook_url = None
        self.sender = {}
        self.api_url = 'https://chatapi.viber.com/pa/{method}'
    
    def initialize(self, config):
        """
        Ініціалізація Viber API з конфігурацією
        
        :param config: Словник з конфігурацією
        """
        self.config = config
        self.token = config.get('token')
        self.webhook_url = config.get('webhook_url')
        self.sender = config.get('sender', {
            'name': 'Task Bot',
            'avatar': ''
        })
        
        if not self.token:
            logger.warning("Viber токен не вказано")
            return False
        
        # Встановлення webhook, якщо URL вказано
        if self.webhook_url:
            self.set_webhook(self.webhook_url)
        
        return True
    
    def api_request(self, method, data):
        """
        Виконання запиту до Viber API
        
        :param method: Метод API
        :param data: Дані для запиту
        :return: Дані відповіді або None у разі помилки
        """
        if not self.token:
            logger.error("Запит не виконано: токен не налаштовано")
            return None
        
        url = self.api_url.format(method=method)
        headers = {
            'X-Viber-Auth-Token': self.token,
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(url, json=data, headers=headers, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            if result.get('status') != 0:
                logger.error(f"Viber API помилка: {result.get('status_message')}")
                return None
            
            return result
        except requests.RequestException as e:
            logger.error(f"Помилка запиту до Viber: {e}")
            return None
    
    def set_webhook(self, url):
        """
        Встановлення вебхука для Viber
        
        :param url: URL вебхука
        :return: Результат операції
        """
        data = {
            'url': url,
            'event_types': ['message', 'subscribed', 'unsubscribed', 'conversation_started']
        }
        return self.api_request('set_webhook', data)
    
    def send_message(self, user_id, text, **kwargs):
        """
        Відправка повідомлення через Viber
        
        :param user_id: ID користувача Viber
        :param text: Текст повідомлення
        :param kwargs: Додаткові параметри
        :return: Результат операції
        """
        data = {
            'receiver': user_id,
            'type': 'text',
            'sender': self.sender,
            'text': text
        }
        
        return self.api_request('send_message', data)
    
    def process_update(self, update_data):
        """
        Обробка оновлення від Viber
        
        :param update_data: Дані оновлення
        :return: Словник з даними повідомлення або None
        """
        if update_data.get('event') == 'message':
            message = update_data.get('message', {})
            
            # Базові дані з повідомлення
            text = message.get('text', '')
            user_id = update_data.get('sender', {}).get('id')
            
            return {
                'messenger': 'viber',
                'text': text,
                'user_id': user_id,
                'chat_id': user_id,  # В Viber user_id і chat_id однакові
                'raw_data': update_data,
                'is_command': text.startswith('/')
            }
        
        return None
    
    def start_polling(self):
        """
        Початок опитування Viber API
        
        Примітка: Viber не підтримує polling, потрібен webhook
        """
        logger.warning("Viber не підтримує polling, потрібен webhook")


class WhatsAppAPI(MessengerAPI):
    """Клас для роботи з WhatsApp Business API через Meta Cloud API"""
    
    def __init__(self):
        super().__init__()
        self.name = "WhatsApp"
        self.token = None
        self.phone_number_id = None
        self.api_url = 'https://graph.facebook.com/v17.0/{phone_number_id}/messages'
    
    def initialize(self, config):
        """
        Ініціалізація WhatsApp API з конфігурацією
        
        :param config: Словник з конфігурацією
        """
        self.config = config
        self.token = config.get('token')
        self.phone_number_id = config.get('phone_number_id')
        
        if not self.token or not self.phone_number_id:
            logger.warning("WhatsApp токен або ID телефону не вказано")
            return False
        
        return True
    
    def send_message(self, recipient_id, text, **kwargs):
        """
        Відправка повідомлення через WhatsApp
        
        :param recipient_id: ID отримувача (номер телефону)
        :param text: Текст повідомлення
        :param kwargs: Додаткові параметри
        :return: Результат операції
        """
        if not self.token or not self.phone_number_id:
            logger.error("Запит не виконано: токен або ID телефону не налаштовано")
            return None
        
        url = self.api_url.format(phone_number_id=self.phone_number_id)
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'messaging_product': 'whatsapp',
            'recipient_type': 'individual',
            'to': recipient_id,
            'type': 'text',
            'text': {
                'body': text
            }
        }
        
        try:
            response = requests.post(url, json=data, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Помилка запиту до WhatsApp: {e}")
            return None
    
    def process_update(self, update_data):
        """
        Обробка оновлення від WhatsApp
        
        :param update_data: Дані оновлення
        :return: Словник з даними повідомлення або None
        """
        try:
            entry = update_data.get('entry', [])[0]
            changes = entry.get('changes', [])[0]
            value = changes.get('value', {})
            
            if 'messages' in value:
                message = value['messages'][0]
                
                if message.get('type') == 'text':
                    text = message.get('text', {}).get('body', '')
                    user_id = message.get('from')
                    
                    return {
                        'messenger': 'whatsapp',
                        'text': text,
                        'user_id': user_id,
                        'chat_id': user_id,
                        'raw_data': message,
                        'is_command': text.startswith('/')
                    }
        except (IndexError, KeyError) as e:
            logger.error(f"Помилка обробки оновлення WhatsApp: {e}")
        
        return None
    
    def start_polling(self):
        """
        Початок опитування WhatsApp API
        
        Примітка: WhatsApp не підтримує polling, потрібен webhook
        """
        logger.warning("WhatsApp не підтримує polling, потрібен webhook")


class MultiMessengerBot:
    """Клас для керування ботами в різних месенджерах"""
    
    def __init__(self):
        """Ініціалізація мультимесенджер бота"""
        self.messengers = {}
        self.user_states = {}  # {messenger_name: {user_id: state}}
        self.config = self.load_config()
        
        # Підтримувані месенджери
        self.add_messenger('telegram', TelegramAPI())
        self.add_messenger('viber', ViberAPI())
        self.add_messenger('whatsapp', WhatsAppAPI())
        
        # Ініціалізація месенджерів
        for name, messenger in self.messengers.items():
            if name in self.config:
                messenger.initialize(self.config[name])
                messenger.message_handler = self.handle_message
    
    def add_messenger(self, name, messenger_api):
        """
        Додавання нового месенджера
        
        :param name: Назва месенджера
        :param messenger_api: Екземпляр MessengerAPI
        """
        self.messengers[name] = messenger_api
        if name not in self.user_states:
            self.user_states[name] = {}
    
    def load_config(self):
        """Завантаження конфігурації з файлу"""
        try:
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return {}
        except Exception as e:
            logger.error(f"Помилка завантаження конфігурації: {e}")
            return {}
    
    def save_config(self):
        """Збереження конфігурації у файл"""
        try:
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Помилка збереження конфігурації: {e}")
    
    def load_tasks(self):
        """Завантаження задач з файлу"""
        try:
            if os.path.exists(TASKS_FILE):
                with open(TASKS_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return {"tasks": []}
        except Exception as e:
            logger.error(f"Помилка завантаження задач: {e}")
            return {"tasks": []}
    
    def get_daily_report(self):
        """
        Формування щоденного звіту з задач
        
        :return: Текст звіту
        """
        tasks_data = self.load_tasks()
        tasks = tasks_data.get('tasks', [])
        
        today = datetime.now().strftime('%d.%m.%Y')
        report = f"📅 Звіт за день ({today}):\n\n"
        
        if not tasks:
            return report + "За сьогодні задач не було"
        
        completed_tasks = [task['name'] for task in tasks if task.get('completed')]
        pending_tasks = [task['name'] for task in tasks if not task.get('completed')]
        
        if completed_tasks:
            report += "✅ Виконані задачі:\n"
            for task in completed_tasks:
                report += f"- {task}\n"
        
        if pending_tasks:
            if completed_tasks:
                report += "\n"
            report += "❌ Невиконані задачі:\n"
            for task in pending_tasks:
                report += f"- {task}\n"
        
        return report
    
    def handle_message(self, message_data):
        """
        Обробка вхідного повідомлення
        
        :param message_data: Дані повідомлення
        """
        messenger_name = message_data.get('messenger')
        messenger = self.messengers.get(messenger_name)
        
        if not messenger:
            return
        
        text = message_data.get('text', '')
        user_id = message_data.get('user_id')
        chat_id = message_data.get('chat_id')
        is_command = message_data.get('is_command', False)
        
        # Отримання стану користувача
        user_state = self.user_states.get(messenger_name, {}).get(user_id, 0)
        
        # Збереження chat_id, якщо потрібно
        messenger_config = self.config.get(messenger_name, {})
        if not messenger_config.get('chat_id'):
            messenger_config['chat_id'] = chat_id
            self.config[messenger_name] = messenger_config
            self.save_config()
        
        # Обробка стану очікування токена
        if user_state == 1:  # Стан очікування токена
            messenger_config['token'] = text.strip()
            self.config[messenger_name] = messenger_config
            self.save_config()
            
            # Повторна ініціалізація месенджера з новим токеном
            messenger.initialize(messenger_config)
            
            # Відправка підтвердження
            messenger.send_message(chat_id, "✅ Токен успішно збережено!")
            self.user_states[messenger_name][user_id] = 0
            return
        
        # Обробка команд
        if is_command:
            command = text.split()[0].lower()
            
            if command == '/start':
                messenger.send_message(
                    chat_id,
                    "👋 Вітаю! Я ваш особистий бот для керування задачами.\n\n"
                    "🔹 Доступні команди:\n"
                    "/start - Показати це повідомлення\n"
                    "/settings - Налаштування бота\n"
                    "/report - Отримати звіт за сьогодні\n\n"
                    "⚙️ Для початку роботи налаштуйте токен через /settings"
                )
            
            elif command == '/settings':
                messenger.send_message(chat_id, "🔑 Будь ласка, введіть токен бота:")
                if messenger_name not in self.user_states:
                    self.user_states[messenger_name] = {}
                self.user_states[messenger_name][user_id] = 1  # Стан очікування токена
            
            elif command == '/report':
                if not messenger_config.get('token'):
                    messenger.send_message(chat_id, "❌ Спочатку налаштуйте токен через /settings")
                    return
                
                report = self.get_daily_report()
                messenger.send_message(chat_id, report)
    
    def send_report_to_all(self):
        """Надсилання звіту всім активним месенджерам"""
        report = self.get_daily_report()
        
        for name, messenger in self.messengers.items():
            chat_id = self.config.get(name, {}).get('chat_id')
            if chat_id:
                try:
                    messenger.send_message(chat_id, report)
                    logger.info(f"Звіт надіслано у {name}")
                except Exception as e:
                    logger.error(f"Помилка надсилання звіту у {name}: {e}")
    
    def run_scheduler(self):
        """Запуск планувальника для щоденних звітів"""
        # Заплановано звіт щодня о 20:00
        schedule.every().day.at("20:00").do(self.send_report_to_all)
        
        logger.info("Запущено планувальник")
        while True:
            schedule.run_pending()
            time.sleep(60)  # Перевірка кожну хвилину
    
    def start_all(self):
        """Запуск усіх месенджерів в окремих потоках"""
        # Запуск планувальника
        scheduler_thread = Thread(target=self.run_scheduler)
        scheduler_thread.daemon = True
        scheduler_thread.start()
        
        # Запуск месенджерів, які підтримують polling
        for name, messenger in self.messengers.items():
            if hasattr(messenger, 'start_polling'):
                thread = Thread(target=messenger.start_polling)
                thread.daemon = True
                thread.start()
                logger.info(f"Запущено месенджер {name}")
        
        # Основний цикл
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Бот зупинено користувачем")


def main():
    """Основна функція запуску мультимесенджер бота"""
    # Створення тестових задач, якщо файл не існує
    if not os.path.exists(TASKS_FILE):
        logger.info("Створення тестових задач")
        try:
            tasks_data = {"tasks": [
                {"name": "Задача 1", "completed": True},
                {"name": "Задача 2", "completed": True},
                {"name": "Задача 3", "completed": False}
            ]}
            
            with open(TASKS_FILE, 'w', encoding='utf-8') as f:
                json.dump(tasks_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Помилка створення тестових задач: {e}")
    
    # Ініціалізація та запуск бота
    bot = MultiMessengerBot()
    bot.start_all()


if __name__ == "__main__":
    main() 