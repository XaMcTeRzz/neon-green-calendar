#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import pickle
import logging
from datetime import datetime, timedelta
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from src.task_manager import TaskManager

# Налаштування логування
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Необхідні права доступу
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

# Файли для зберігання даних аутентифікації
CREDENTIALS_FILE = 'credentials.json'
TOKEN_FILE = 'token.pickle'

class GoogleCalendarIntegration:
    """Клас для інтеграції з Google Calendar"""
    
    def __init__(self, credentials_file=CREDENTIALS_FILE, token_file=TOKEN_FILE):
        """
        Ініціалізація інтеграції з Google Calendar
        
        :param credentials_file: Шлях до файлу з даними облікових даних
        :param token_file: Шлях до файлу з токеном
        """
        self.credentials_file = credentials_file
        self.token_file = token_file
        self.service = None
        self.task_manager = TaskManager()
    
    def authenticate(self):
        """
        Аутентифікація в Google API
        
        :return: True, якщо аутентифікація успішна, False - інакше
        """
        creds = None
        
        # Спроба завантажити токен з файлу
        if os.path.exists(self.token_file):
            with open(self.token_file, 'rb') as token:
                creds = pickle.load(token)
        
        # Якщо токен відсутній або недійсний
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(self.credentials_file):
                    logger.error(f"Файл облікових даних не знайдено: {self.credentials_file}")
                    return False
                
                flow = InstalledAppFlow.from_client_secrets_file(self.credentials_file, SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Збереження токену для наступного використання
            with open(self.token_file, 'wb') as token:
                pickle.dump(creds, token)
        
        # Створення сервісу
        self.service = build('calendar', 'v3', credentials=creds)
        return True
    
    def get_calendars(self):
        """
        Отримання списку календарів
        
        :return: Список календарів або порожній список у разі помилки
        """
        if not self.service:
            if not self.authenticate():
                return []
        
        try:
            calendars_result = self.service.calendarList().list().execute()
            return calendars_result.get('items', [])
        except Exception as e:
            logger.error(f"Помилка отримання списку календарів: {e}")
            return []
    
    def get_events(self, calendar_id='primary', days=7, max_results=100):
        """
        Отримання подій з календаря
        
        :param calendar_id: ID календаря
        :param days: Кількість днів для отримання подій (від сьогодні)
        :param max_results: Максимальна кількість подій
        :return: Список подій або порожній список у разі помилки
        """
        if not self.service:
            if not self.authenticate():
                return []
        
        try:
            # Визначення часового діапазону
            now = datetime.utcnow()
            end_date = now + timedelta(days=days)
            
            # Форматування часу у форматі ISO
            now_iso = now.isoformat() + 'Z'
            end_date_iso = end_date.isoformat() + 'Z'
            
            # Отримання подій
            events_result = self.service.events().list(
                calendarId=calendar_id,
                timeMin=now_iso,
                timeMax=end_date_iso,
                maxResults=max_results,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            return events_result.get('items', [])
        except Exception as e:
            logger.error(f"Помилка отримання подій: {e}")
            return []
    
    def convert_events_to_tasks(self, events, category="Google Calendar"):
        """
        Конвертація подій календаря в задачі
        
        :param events: Список подій календаря
        :param category: Категорія для нових задач
        :return: Кількість доданих задач
        """
        added_count = 0
        
        for event in events:
            # Отримання основних даних події
            summary = event.get('summary', 'Без назви')
            start = event.get('start', {})
            end = event.get('end', {})
            status = event.get('status', '')
            
            # Визначення дати виконання
            due_date = None
            if 'date' in start:
                due_date = start['date']  # Цілоденна подія
            elif 'dateTime' in start:
                # Конвертація ISO дати в формат DD.MM.YYYY
                date_obj = datetime.fromisoformat(start['dateTime'].replace('Z', '+00:00'))
                due_date = date_obj.strftime('%d.%m.%Y')
            
            # Визначення статусу виконання
            completed = status == 'confirmed' and event.get('attendees') is not None and any(
                attendee.get('responseStatus') == 'accepted' for attendee in event.get('attendees', [])
            )
            
            # Визначення пріоритету (можна налаштувати за власними критеріями)
            priority = "medium"
            if event.get('colorId') == '1' or event.get('colorId') == '4':  # Червоний або помаранчевий
                priority = "high"
            elif event.get('colorId') == '2' or event.get('colorId') == '10':  # Зелений або блакитний
                priority = "low"
            
            # Додавання задачі
            # Використовуємо ім'я події як унікальний ідентифікатор
            task = self.task_manager.get_task_by_name(summary)
            
            if task:
                # Оновлення існуючої задачі
                for i, t in enumerate(self.task_manager.get_all_tasks()):
                    if t.get('name') == summary:
                        self.task_manager.update_task(
                            i,
                            completed=completed,
                            due_date=due_date,
                            priority=priority
                        )
                        break
            else:
                # Додавання нової задачі
                if self.task_manager.add_task(
                    name=summary,
                    completed=completed,
                    due_date=due_date,
                    priority=priority,
                    category=category
                ):
                    added_count += 1
        
        return added_count
    
    def sync_calendar_to_tasks(self, calendar_id='primary', days=7, category="Google Calendar"):
        """
        Синхронізація подій календаря з задачами
        
        :param calendar_id: ID календаря
        :param days: Кількість днів для отримання подій
        :param category: Категорія для нових задач
        :return: Кількість доданих задач або -1 у разі помилки
        """
        if not self.authenticate():
            logger.error("Не вдалося аутентифікуватися в Google Calendar")
            return -1
        
        events = self.get_events(calendar_id=calendar_id, days=days)
        if not events:
            logger.info("Не знайдено подій для синхронізації")
            return 0
        
        added_count = self.convert_events_to_tasks(events, category=category)
        logger.info(f"Синхронізовано {added_count} подій з Google Calendar")
        
        return added_count


# Тестова функція для демонстрації роботи
def main():
    """Демонстрація роботи з інтеграцією Google Calendar"""
    import sys
    
    # Перевірка наявності файлу облікових даних
    if not os.path.exists(CREDENTIALS_FILE):
        print(f"Помилка: Файл облікових даних не знайдено: {CREDENTIALS_FILE}")
        print("Будь ласка, завантажте файл облікових даних з Google Cloud Console.")
        print("Інструкції:")
        print("1. Перейдіть на https://console.cloud.google.com/")
        print("2. Створіть новий проект або виберіть існуючий")
        print("3. Увімкніть Google Calendar API")
        print("4. Створіть облікові дані OAuth 2.0")
        print("5. Завантажте файл з обліковими даними та перейменуйте його на 'credentials.json'")
        sys.exit(1)
    
    calendar_integration = GoogleCalendarIntegration()
    
    print("Аутентифікація в Google Calendar...")
    if not calendar_integration.authenticate():
        print("Помилка аутентифікації")
        sys.exit(1)
    
    print("\nОтримання списку календарів...")
    calendars = calendar_integration.get_calendars()
    print(f"Знайдено {len(calendars)} календарів:")
    for i, calendar in enumerate(calendars):
        print(f"{i+1}. {calendar.get('summary')} (ID: {calendar.get('id')})")
    
    # Якщо є календарі, пропонуємо вибрати для синхронізації
    if calendars:
        print("\nВиберіть календар для синхронізації (або натисніть Enter для основного):")
        choice = input("> ")
        
        calendar_id = 'primary'
        if choice and choice.isdigit():
            index = int(choice) - 1
            if 0 <= index < len(calendars):
                calendar_id = calendars[index].get('id')
        
        print(f"\nСинхронізація подій з календаря '{calendar_id}'...")
        added_count = calendar_integration.sync_calendar_to_tasks(calendar_id=calendar_id)
        
        if added_count >= 0:
            print(f"Успішно синхронізовано {added_count} подій")
            
            # Відображення задач
            task_manager = TaskManager()
            print("\nЗадачі після синхронізації:")
            for i, task in enumerate(task_manager.get_all_tasks()):
                status = "✅" if task.get('completed') else "❌"
                date_info = f" (до {task.get('due_date')})" if task.get('due_date') else ""
                print(f"{i+1}. {status} {task.get('name')}{date_info} - {task.get('category', 'Без категорії')}")
        else:
            print("Помилка синхронізації")


if __name__ == "__main__":
    main() 