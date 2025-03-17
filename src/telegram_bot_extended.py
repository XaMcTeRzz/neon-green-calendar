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
from src.task_manager import TaskManager
from src.google_calendar_integration import GoogleCalendarIntegration

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
STATE_WAITING_TASK_NAME = 2
STATE_WAITING_TASK_DUE_DATE = 3
STATE_WAITING_TASK_PRIORITY = 4
STATE_WAITING_TASK_CATEGORY = 5

class TelegramBotExtended:
    """Розширений клас для роботи з Telegram Bot API через прямі HTTP запити"""
    
    def __init__(self, fallback_token=None):
        """
        Ініціалізація бота з додатковим резервним токеном
        
        :param fallback_token: Резервний токен, якщо в конфігурації відсутній
        """
        self.config = self.load_config()
        self.token = self.config.get('token') or fallback_token
        self.chat_id = self.config.get('chat_id')
        self.user_states = {}
        self.last_update_id = 0
        self.task_manager = TaskManager()
        self.temp_task_data = {}  # Для тимчасового зберігання даних при створенні задачі
        
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
    
    def get_keyboard_markup(self, buttons, one_time=False):
        """
        Створення розмітки клавіатури
        
        :param buttons: Список кнопок (список списків)
        :param one_time: Чи потрібно приховувати клавіатуру після використання
        :return: Об'єкт розмітки клавіатури
        """
        return {
            'keyboard': buttons,
            'resize_keyboard': True,
            'one_time_keyboard': one_time
        }
    
    def get_inline_keyboard_markup(self, buttons):
        """
        Створення розмітки inline клавіатури
        
        :param buttons: Список кнопок (список списків)
        :return: Об'єкт розмітки inline клавіатури
        """
        return {
            'inline_keyboard': buttons
        }
    
    def get_daily_report(self):
        """
        Формування щоденного звіту з задач
        
        :return: Текст звіту
        """
        tasks = self.task_manager.get_all_tasks()
        
        today = datetime.now().strftime('%d.%m.%Y')
        report = f"📅 Звіт за день ({today}):\n\n"
        
        if not tasks:
            return report + "За сьогодні задач не було"
        
        completed_tasks = self.task_manager.get_completed_tasks()
        pending_tasks = self.task_manager.get_pending_tasks()
        
        if completed_tasks:
            report += "✅ Виконані задачі:\n"
            for task in completed_tasks:
                report += f"- {task.get('name')}\n"
        
        if pending_tasks:
            if completed_tasks:
                report += "\n"
            report += "❌ Невиконані задачі:\n"
            for task in pending_tasks:
                report += f"- {task.get('name')}\n"
        
        stats = self.task_manager.get_stats()
        report += f"\n📊 Статистика: {stats['completed']}/{stats['total']} виконано ({stats['completion_rate']}%)"
        
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
    
    def show_task_list(self, chat_id, filter_type=None):
        """
        Відображення списку задач
        
        :param chat_id: ID чату
        :param filter_type: Тип фільтра (completed, pending, all)
        :return: Результат відправки
        """
        if filter_type == 'completed':
            tasks = self.task_manager.get_completed_tasks()
            title = "✅ Виконані задачі:"
        elif filter_type == 'pending':
            tasks = self.task_manager.get_pending_tasks()
            title = "❌ Невиконані задачі:"
        else:
            tasks = self.task_manager.get_all_tasks()
            title = "📋 Всі задачі:"
        
        if not tasks:
            return self.send_message(chat_id, "Задач не знайдено")
        
        message = title + "\n\n"
        
        for i, task in enumerate(tasks):
            status = "✅" if task.get('completed') else "❌"
            due_date = f" (до {task.get('due_date')})" if task.get('due_date') else ""
            priority = ""
            if task.get('priority') == 'high':
                priority = " 🔴"
            elif task.get('priority') == 'medium':
                priority = " 🟡"
            elif task.get('priority') == 'low':
                priority = " 🟢"
            
            message += f"{i+1}. {status} {task.get('name')}{due_date}{priority}\n"
        
        # Додавання inline кнопок для дій з задачами
        buttons = []
        
        # Кнопки для фільтрації
        filter_row = []
        if filter_type != 'all':
            filter_row.append({'text': '📋 Всі', 'callback_data': 'filter_all'})
        if filter_type != 'completed':
            filter_row.append({'text': '✅ Виконані', 'callback_data': 'filter_completed'})
        if filter_type != 'pending':
            filter_row.append({'text': '❌ Невиконані', 'callback_data': 'filter_pending'})
        
        if filter_row:
            buttons.append(filter_row)
        
        # Кнопки для дій з конкретними задачами
        for i in range(min(5, len(tasks))):
            task_row = []
            task_row.append({
                'text': f"✅ Задача {i+1}",
                'callback_data': f"complete_{i}"
            })
            task_row.append({
                'text': f"❌ Задача {i+1}",
                'callback_data': f"uncomplete_{i}"
            })
            task_row.append({
                'text': f"🗑️ Задача {i+1}",
                'callback_data': f"delete_{i}"
            })
            buttons.append(task_row)
        
        # Кнопка для додавання нової задачі
        buttons.append([{'text': '➕ Додати задачу', 'callback_data': 'add_task'}])
        
        keyboard = self.get_inline_keyboard_markup(buttons)
        
        return self.send_message(chat_id, message, reply_markup=keyboard)
    
    def start_adding_task(self, chat_id, user_id):
        """
        Початок процесу додавання нової задачі
        
        :param chat_id: ID чату
        :param user_id: ID користувача
        :return: Результат відправки
        """
        self.user_states[user_id] = STATE_WAITING_TASK_NAME
        self.temp_task_data[user_id] = {}
        
        return self.send_message(
            chat_id,
            "Додавання нової задачі\n\nВведіть назву задачі:"
        )
    
    def sync_with_google_calendar(self, chat_id):
        """
        Синхронізація задач з Google Calendar
        
        :param chat_id: ID чату
        :return: Результат відправки
        """
        calendar_integration = GoogleCalendarIntegration()
        
        self.send_message(chat_id, "🔄 Починаю синхронізацію з Google Calendar...")
        
        try:
            if not calendar_integration.authenticate():
                return self.send_message(
                    chat_id,
                    "❌ Помилка аутентифікації в Google Calendar.\n\n"
                    "Перевірте наявність файлу credentials.json в директорії проекту."
                )
            
            added_count = calendar_integration.sync_calendar_to_tasks()
            
            if added_count >= 0:
                return self.send_message(
                    chat_id,
                    f"✅ Синхронізацію завершено успішно!\n\n"
                    f"Додано/оновлено {added_count} задач з Google Calendar"
                )
            else:
                return self.send_message(
                    chat_id,
                    "❌ Помилка при синхронізації з Google Calendar"
                )
        except Exception as e:
            logger.error(f"Помилка при синхронізації з Google Calendar: {e}")
            return self.send_message(
                chat_id,
                f"❌ Помилка при синхронізації: {str(e)}"
            )
    
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
        
        # Обробка стану очікування назви задачі
        elif user_state == STATE_WAITING_TASK_NAME:
            if not text:
                self.send_message(chat_id, "❌ Назва задачі не може бути пустою. Спробуйте ще раз:")
                return
            
            self.temp_task_data[user_id]['name'] = text
            self.user_states[user_id] = STATE_WAITING_TASK_DUE_DATE
            
            # Створення клавіатури для пропуску деяких полів
            keyboard = self.get_keyboard_markup([["Пропустити (немає терміну)"]], one_time=True)
            
            self.send_message(
                chat_id,
                "Введіть термін виконання задачі у форматі ДД.ММ.РРРР або натисніть 'Пропустити':",
                reply_markup=keyboard
            )
            return
        
        # Обробка стану очікування терміну задачі
        elif user_state == STATE_WAITING_TASK_DUE_DATE:
            if text == "Пропустити (немає терміну)":
                self.temp_task_data[user_id]['due_date'] = None
            else:
                # Перевірка формату дати
                try:
                    datetime.strptime(text, '%d.%m.%Y')
                    self.temp_task_data[user_id]['due_date'] = text
                except ValueError:
                    self.send_message(
                        chat_id,
                        "❌ Неправильний формат дати. Використовуйте формат ДД.ММ.РРРР або натисніть 'Пропустити':"
                    )
                    return
            
            self.user_states[user_id] = STATE_WAITING_TASK_PRIORITY
            
            # Клавіатура для вибору пріоритету
            keyboard = self.get_keyboard_markup([
                ["Високий 🔴", "Середній 🟡", "Низький 🟢"],
                ["Пропустити (без пріоритету)"]
            ], one_time=True)
            
            self.send_message(
                chat_id,
                "Виберіть пріоритет задачі:",
                reply_markup=keyboard
            )
            return
        
        # Обробка стану очікування пріоритету задачі
        elif user_state == STATE_WAITING_TASK_PRIORITY:
            if text == "Високий 🔴":
                self.temp_task_data[user_id]['priority'] = "high"
            elif text == "Середній 🟡":
                self.temp_task_data[user_id]['priority'] = "medium"
            elif text == "Низький 🟢":
                self.temp_task_data[user_id]['priority'] = "low"
            elif text == "Пропустити (без пріоритету)":
                self.temp_task_data[user_id]['priority'] = None
            else:
                self.send_message(
                    chat_id,
                    "❌ Невідомий пріоритет. Виберіть зі списку або натисніть 'Пропустити':"
                )
                return
            
            self.user_states[user_id] = STATE_WAITING_TASK_CATEGORY
            
            # Клавіатура для вибору категорії
            keyboard = self.get_keyboard_markup([
                ["Робота", "Особисте"],
                ["Навчання", "Покупки"],
                ["Пропустити (без категорії)"]
            ], one_time=True)
            
            self.send_message(
                chat_id,
                "Виберіть категорію задачі або введіть свою:",
                reply_markup=keyboard
            )
            return
        
        # Обробка стану очікування категорії задачі
        elif user_state == STATE_WAITING_TASK_CATEGORY:
            if text == "Пропустити (без категорії)":
                self.temp_task_data[user_id]['category'] = None
            else:
                self.temp_task_data[user_id]['category'] = text
            
            # Додавання задачі
            task_data = self.temp_task_data[user_id]
            if self.task_manager.add_task(
                name=task_data.get('name'),
                due_date=task_data.get('due_date'),
                priority=task_data.get('priority'),
                category=task_data.get('category')
            ):
                self.send_message(chat_id, f"✅ Задачу '{task_data.get('name')}' успішно додано!")
            else:
                self.send_message(chat_id, f"❌ Помилка при додаванні задачі. Можливо, задача з такою назвою вже існує.")
            
            # Очищення тимчасових даних
            del self.temp_task_data[user_id]
            self.user_states[user_id] = STATE_NONE
            return
        
        # Обробка команд
        if text.startswith('/'):
            command = text.split()[0].lower()
            
            if command == '/start':
                # Створення меню головних команд
                keyboard = self.get_keyboard_markup([
                    ["/tasks", "/report"],
                    ["/add_task", "/sync_calendar"],
                    ["/settings"]
                ])
                
                self.send_message(
                    chat_id,
                    "👋 Вітаю! Я ваш особистий бот для керування задачами.\n\n"
                    "🔹 Доступні команди:\n"
                    "/tasks - Показати список задач\n"
                    "/add_task - Додати нову задачу\n"
                    "/report - Отримати звіт за сьогодні\n"
                    "/sync_calendar - Синхронізувати з Google Calendar\n"
                    "/settings - Налаштування бота\n\n"
                    "⚙️ Для початку роботи налаштуйте токен через /settings",
                    reply_markup=keyboard
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
            
            elif command == '/tasks':
                if not self.token:
                    self.send_message(chat_id, "❌ Спочатку налаштуйте токен через /settings")
                    return
                
                # Додаткові параметри команди
                parts = text.split()
                filter_type = 'all'
                
                if len(parts) > 1:
                    param = parts[1].lower()
                    if param in ['completed', 'done', 'виконані']:
                        filter_type = 'completed'
                    elif param in ['pending', 'todo', 'невиконані']:
                        filter_type = 'pending'
                
                self.show_task_list(chat_id, filter_type)
            
            elif command == '/add_task':
                if not self.token:
                    self.send_message(chat_id, "❌ Спочатку налаштуйте токен через /settings")
                    return
                
                self.start_adding_task(chat_id, user_id)
            
            elif command == '/sync_calendar':
                if not self.token:
                    self.send_message(chat_id, "❌ Спочатку налаштуйте токен через /settings")
                    return
                
                self.sync_with_google_calendar(chat_id)
    
    def handle_callback_query(self, callback_query):
        """
        Обробка callback query від inline кнопок
        
        :param callback_query: Об'єкт callback query
        """
        query_id = callback_query.get('id')
        chat_id = callback_query.get('message', {}).get('chat', {}).get('id')
        user_id = callback_query.get('from', {}).get('id')
        data = callback_query.get('data', '')
        
        # Відповідь на callback query
        self.api_request('answerCallbackQuery', {'callback_query_id': query_id})
        
        # Обробка фільтрації задач
        if data.startswith('filter_'):
            filter_type = data.split('_')[1]
            self.show_task_list(chat_id, filter_type)
        
        # Обробка позначення задачі як виконаної
        elif data.startswith('complete_'):
            task_id = int(data.split('_')[1])
            if self.task_manager.mark_completed(task_id, True):
                self.send_message(chat_id, f"✅ Задачу #{task_id+1} позначено як виконану")
            else:
                self.send_message(chat_id, f"❌ Помилка при оновленні задачі #{task_id+1}")
        
        # Обробка позначення задачі як невиконаної
        elif data.startswith('uncomplete_'):
            task_id = int(data.split('_')[1])
            if self.task_manager.mark_completed(task_id, False):
                self.send_message(chat_id, f"❌ Задачу #{task_id+1} позначено як невиконану")
            else:
                self.send_message(chat_id, f"❌ Помилка при оновленні задачі #{task_id+1}")
        
        # Обробка видалення задачі
        elif data.startswith('delete_'):
            task_id = int(data.split('_')[1])
            if self.task_manager.delete_task(task_id):
                self.send_message(chat_id, f"🗑️ Задачу #{task_id+1} видалено")
            else:
                self.send_message(chat_id, f"❌ Помилка при видаленні задачі #{task_id+1}")
        
        # Обробка додавання нової задачі
        elif data == 'add_task':
            self.start_adding_task(chat_id, user_id)
    
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
            elif 'callback_query' in update:
                self.handle_callback_query(update['callback_query'])
        
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


def main():
    """Основна функція запуску бота"""
    # Ініціалізація бота
    bot = TelegramBotExtended()
    
    # Якщо токен не налаштовано
    if not bot.token:
        logger.warning("Токен не налаштовано. Бот буде чекати на налаштування через повідомлення.")
    
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