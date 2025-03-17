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

# Налаштування логування
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Файли для зберігання налаштувань та задач
CONFIG_FILE = 'config.json'
TASKS_FILE = 'tasks.json'

# URL шаблони для API Telegram
API_URL = 'https://api.telegram.org/bot{token}/{method}'

# Стани розмови
STATE_NONE = 0
STATE_WAITING_TOKEN = 1

# Словник для зберігання станів користувачів
user_states = {}

class TelegramBotAPI:
    """Клас для роботи з Telegram Bot API через прямі HTTP запити"""
    
    def __init__(self, fallback_token=None):
        """
        Ініціалізація бота з додатковим резервним токеном
        
        :param fallback_token: Резервний токен, якщо в конфігурації відсутній
        """
        self.config = self.load_config()
        self.token = self.config.get('token') or fallback_token
        self.chat_id = self.config.get('chat_id')
        self.webhook_url = self.config.get('webhook_url')
        self.user_states = {}
        self.last_update_id = 0
        
        # Перевірка наявності токена
        if not self.token:
            logger.warning("Токен не вказано. Використовуйте команду /settings для налаштування")
    
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
    
    def save_tasks(self, tasks_data):
        """Збереження задач у файл"""
        try:
            with open(TASKS_FILE, 'w', encoding='utf-8') as f:
                json.dump(tasks_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Помилка збереження задач: {e}")
    
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
        
        url = API_URL.format(token=self.token, method=method)
        
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
    
    def set_webhook(self, url):
        """
        Встановлення вебхука для отримання оновлень
        
        :param url: URL вебхука
        :return: Результат операції
        """
        data = {'url': url}
        result = self.api_request('setWebhook', data)
        if result:
            self.webhook_url = url
            self.config['webhook_url'] = url
            self.save_config()
        return result
    
    def delete_webhook(self):
        """
        Видалення вебхука
        
        :return: Результат операції
        """
        result = self.api_request('deleteWebhook')
        if result:
            self.webhook_url = None
            self.config.pop('webhook_url', None)
            self.save_config()
        return result
    
    def get_webhook_info(self):
        """
        Отримання інформації про вебхук
        
        :return: Інформація про вебхук
        """
        return self.api_request('getWebhookInfo')
    
    def send_message(self, chat_id, text, parse_mode=None, reply_markup=None):
        """
        Відправка повідомлення користувачу
        
        :param chat_id: ID чату
        :param text: Текст повідомлення
        :param parse_mode: Режим форматування (HTML, Markdown)
        :param reply_markup: Розмітка клавіатури
        :return: Відправлене повідомлення
        """
        data = {
            'chat_id': chat_id,
            'text': text
        }
        
        if parse_mode:
            data['parse_mode'] = parse_mode
        
        if reply_markup:
            data['reply_markup'] = reply_markup
        
        return self.api_request('sendMessage', data)
    
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
    
    def send_report(self):
        """
        Надсилання звіту в чат
        
        :return: Результат відправки
        """
        if not self.chat_id:
            logger.warning("Неможливо надіслати звіт: chat_id не вказано")
            return None
        
        report = self.get_daily_report()
        return self.send_message(self.chat_id, report)
    
    def handle_message(self, message):
        """
        Обробка вхідного повідомлення
        
        :param message: Об'єкт повідомлення
        """
        # Отримання основних даних повідомлення
        chat_id = message.get('chat', {}).get('id')
        user_id = message.get('from', {}).get('id')
        text = message.get('text', '')
        
        # Якщо chat_id ще не збережено, зберігаємо
        if not self.chat_id and chat_id:
            self.chat_id = chat_id
            self.config['chat_id'] = chat_id
            self.save_config()
            logger.info(f"Збережено chat_id: {chat_id}")
        
        # Перевірка стану користувача
        user_state = self.user_states.get(user_id, STATE_NONE)
        
        # Обробка стану очікування токена
        if user_state == STATE_WAITING_TOKEN:
            self.token = text.strip()
            self.config['token'] = self.token
            self.save_config()
            self.send_message(chat_id, "✅ Токен успішно збережено!")
            self.user_states[user_id] = STATE_NONE
            return
        
        # Обробка команд
        if text.startswith('/'):
            command = text.split()[0].lower()
            
            if command == '/start':
                self.send_message(
                    chat_id,
                    "👋 Вітаю! Я ваш особистий бот для керування задачами.\n\n"
                    "🔹 Доступні команди:\n"
                    "/start - Показати це повідомлення\n"
                    "/settings - Налаштування бота\n"
                    "/report - Отримати звіт за сьогодні\n\n"
                    "⚙️ Для початку роботи налаштуйте токен через /settings"
                )
            
            elif command == '/settings':
                self.send_message(chat_id, "🔑 Будь ласка, введіть токен бота:")
                self.user_states[user_id] = STATE_WAITING_TOKEN
            
            elif command == '/report':
                if not self.token:
                    self.send_message(chat_id, "❌ Спочатку налаштуйте токен через /settings")
                    return
                
                report = self.get_daily_report()
                self.send_message(chat_id, report)
    
    def process_updates(self):
        """
        Обробка оновлень від Telegram API
        
        :return: True, якщо обробка пройшла успішно
        """
        updates = self.get_updates(offset=self.last_update_id + 1)
        if not updates:
            return False
        
        for update in updates:
            update_id = update.get('update_id')
            if update_id > self.last_update_id:
                self.last_update_id = update_id
            
            if 'message' in update:
                self.handle_message(update['message'])
        
        return True
    
    def polling(self, interval=1):
        """
        Циклічне опитування API на наявність оновлень
        
        :param interval: Інтервал між запитами в секундах
        """
        logger.info("Початок циклічного опитування")
        while True:
            try:
                self.process_updates()
            except Exception as e:
                logger.error(f"Помилка під час опитування: {e}")
            
            time.sleep(interval)
    
    def run_scheduler(self):
        """Запуск планувальника для щоденних звітів"""
        # Заплановано звіт щодня о 20:00
        schedule.every().day.at("20:00").do(self.send_report)
        
        logger.info("Запущено планувальник")
        while True:
            schedule.run_pending()
            time.sleep(60)  # Перевірка кожну хвилину


# Функція для додавання задачі (допоміжна для тестування)
def add_task(name, completed=False):
    """
    Додавання нової задачі
    
    :param name: Назва задачі
    :param completed: Статус виконання
    """
    try:
        if os.path.exists(TASKS_FILE):
            with open(TASKS_FILE, 'r', encoding='utf-8') as f:
                tasks_data = json.load(f)
        else:
            tasks_data = {"tasks": []}
        
        tasks_data['tasks'].append({
            'name': name,
            'completed': completed
        })
        
        with open(TASKS_FILE, 'w', encoding='utf-8') as f:
            json.dump(tasks_data, f, ensure_ascii=False, indent=2)
        
        return True
    except Exception as e:
        logger.error(f"Помилка додавання задачі: {e}")
        return False


def main():
    """Основна функція запуску бота"""
    # Ініціалізація бота
    bot = TelegramBotAPI()
    
    # Якщо токен не налаштовано
    if not bot.token:
        logger.warning("Токен не налаштовано. Бот буде використовувати резервний токен, "
                     "якщо його надано, або чекати на налаштування через повідомлення.")
    
    # Створення тестових задач, якщо файл не існує
    if not os.path.exists(TASKS_FILE):
        logger.info("Створення тестових задач")
        add_task("Задача 1", completed=True)
        add_task("Задача 2", completed=True)
        add_task("Задача 3", completed=False)
    
    # Запуск планувальника у окремому потоці
    scheduler_thread = Thread(target=bot.run_scheduler)
    scheduler_thread.daemon = True
    scheduler_thread.start()
    
    try:
        # Запуск циклічного опитування
        bot.polling()
    except KeyboardInterrupt:
        logger.info("Бот зупинено користувачем")
    except Exception as e:
        logger.error(f"Критична помилка: {e}")


if __name__ == "__main__":
    main() 