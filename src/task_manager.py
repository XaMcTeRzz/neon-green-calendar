#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import logging
from datetime import datetime

# Налаштування логування
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Шлях до файлу задач
TASKS_FILE = 'tasks.json'

class TaskManager:
    """Клас для управління задачами"""
    
    def __init__(self, tasks_file=TASKS_FILE):
        """
        Ініціалізація менеджера задач
        
        :param tasks_file: Шлях до файлу з задачами
        """
        self.tasks_file = tasks_file
        self.tasks = self.load_tasks()
    
    def load_tasks(self):
        """
        Завантаження задач з файлу
        
        :return: Словник з задачами
        """
        try:
            if os.path.exists(self.tasks_file):
                with open(self.tasks_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return {"tasks": []}
        except Exception as e:
            logger.error(f"Помилка завантаження задач: {e}")
            return {"tasks": []}
    
    def save_tasks(self):
        """
        Збереження задач у файл
        
        :return: True, якщо збереження успішне, False - інакше
        """
        try:
            with open(self.tasks_file, 'w', encoding='utf-8') as f:
                json.dump(self.tasks, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            logger.error(f"Помилка збереження задач: {e}")
            return False
    
    def get_all_tasks(self):
        """
        Отримання всіх задач
        
        :return: Список всіх задач
        """
        return self.tasks.get('tasks', [])
    
    def get_task_by_id(self, task_id):
        """
        Отримання задачі за індексом
        
        :param task_id: Індекс задачі
        :return: Задача або None, якщо задачу не знайдено
        """
        tasks = self.tasks.get('tasks', [])
        
        if 0 <= task_id < len(tasks):
            return tasks[task_id]
        
        return None
    
    def get_task_by_name(self, name):
        """
        Отримання задачі за назвою
        
        :param name: Назва задачі
        :return: Задача або None, якщо задачу не знайдено
        """
        tasks = self.tasks.get('tasks', [])
        
        for task in tasks:
            if task.get('name') == name:
                return task
        
        return None
    
    def add_task(self, name, completed=False, due_date=None, priority=None, category=None):
        """
        Додавання нової задачі
        
        :param name: Назва задачі
        :param completed: Статус виконання
        :param due_date: Дата виконання (формат: "DD.MM.YYYY")
        :param priority: Пріоритет задачі (high, medium, low)
        :param category: Категорія задачі
        :return: True, якщо додавання успішне, False - інакше
        """
        if not name:
            logger.error("Назва задачі не може бути пустою")
            return False
        
        # Перевірка на дублікати
        existing_task = self.get_task_by_name(name)
        if existing_task:
            logger.warning(f"Задача з назвою '{name}' вже існує")
            return False
        
        # Створення нової задачі
        new_task = {
            'name': name,
            'completed': completed,
            'created_at': datetime.now().strftime('%d.%m.%Y %H:%M:%S')
        }
        
        # Додавання опціональних полів
        if due_date:
            new_task['due_date'] = due_date
        
        if priority:
            new_task['priority'] = priority
        
        if category:
            new_task['category'] = category
        
        # Додавання задачі в список
        if 'tasks' not in self.tasks:
            self.tasks['tasks'] = []
        
        self.tasks['tasks'].append(new_task)
        
        # Збереження змін
        return self.save_tasks()
    
    def update_task(self, task_id, **kwargs):
        """
        Оновлення існуючої задачі
        
        :param task_id: Індекс задачі
        :param kwargs: Поля для оновлення (name, completed, due_date, priority, category)
        :return: True, якщо оновлення успішне, False - інакше
        """
        task = self.get_task_by_id(task_id)
        
        if not task:
            logger.error(f"Задачу з ID {task_id} не знайдено")
            return False
        
        # Оновлення полів
        for key, value in kwargs.items():
            if key in ['name', 'completed', 'due_date', 'priority', 'category']:
                task[key] = value
        
        # Додавання часу оновлення
        task['updated_at'] = datetime.now().strftime('%d.%m.%Y %H:%M:%S')
        
        # Збереження змін
        return self.save_tasks()
    
    def delete_task(self, task_id):
        """
        Видалення задачі
        
        :param task_id: Індекс задачі
        :return: True, якщо видалення успішне, False - інакше
        """
        tasks = self.tasks.get('tasks', [])
        
        if 0 <= task_id < len(tasks):
            del tasks[task_id]
            return self.save_tasks()
        
        logger.error(f"Задачу з ID {task_id} не знайдено")
        return False
    
    def mark_completed(self, task_id, completed=True):
        """
        Позначення задачі як виконаної/невиконаної
        
        :param task_id: Індекс задачі
        :param completed: Статус виконання
        :return: True, якщо оновлення успішне, False - інакше
        """
        return self.update_task(task_id, completed=completed)
    
    def get_completed_tasks(self):
        """
        Отримання виконаних задач
        
        :return: Список виконаних задач
        """
        tasks = self.tasks.get('tasks', [])
        return [task for task in tasks if task.get('completed')]
    
    def get_pending_tasks(self):
        """
        Отримання невиконаних задач
        
        :return: Список невиконаних задач
        """
        tasks = self.tasks.get('tasks', [])
        return [task for task in tasks if not task.get('completed')]
    
    def filter_tasks_by_category(self, category):
        """
        Фільтрація задач за категорією
        
        :param category: Категорія для фільтрації
        :return: Список задач у вказаній категорії
        """
        tasks = self.tasks.get('tasks', [])
        return [task for task in tasks if task.get('category') == category]
    
    def filter_tasks_by_priority(self, priority):
        """
        Фільтрація задач за пріоритетом
        
        :param priority: Пріоритет для фільтрації
        :return: Список задач з вказаним пріоритетом
        """
        tasks = self.tasks.get('tasks', [])
        return [task for task in tasks if task.get('priority') == priority]
    
    def filter_tasks_by_due_date(self, due_date):
        """
        Фільтрація задач за датою виконання
        
        :param due_date: Дата для фільтрації (формат: "DD.MM.YYYY")
        :return: Список задач з вказаною датою виконання
        """
        tasks = self.tasks.get('tasks', [])
        return [task for task in tasks if task.get('due_date') == due_date]
    
    def get_tasks_count(self):
        """
        Отримання кількості задач
        
        :return: Загальна кількість задач
        """
        return len(self.tasks.get('tasks', []))
    
    def get_completed_count(self):
        """
        Отримання кількості виконаних задач
        
        :return: Кількість виконаних задач
        """
        return len(self.get_completed_tasks())
    
    def get_pending_count(self):
        """
        Отримання кількості невиконаних задач
        
        :return: Кількість невиконаних задач
        """
        return len(self.get_pending_tasks())
    
    def get_stats(self):
        """
        Отримання статистики по задачам
        
        :return: Словник зі статистикою
        """
        total = self.get_tasks_count()
        completed = self.get_completed_count()
        pending = self.get_pending_count()
        
        completion_rate = 0
        if total > 0:
            completion_rate = round((completed / total) * 100, 2)
        
        return {
            'total': total,
            'completed': completed,
            'pending': pending,
            'completion_rate': completion_rate
        }
    
    def clear_completed_tasks(self):
        """
        Видалення всіх виконаних задач
        
        :return: True, якщо видалення успішне, False - інакше
        """
        tasks = self.tasks.get('tasks', [])
        new_tasks = [task for task in tasks if not task.get('completed')]
        
        self.tasks['tasks'] = new_tasks
        return self.save_tasks()
    
    def clear_all_tasks(self):
        """
        Видалення всіх задач
        
        :return: True, якщо видалення успішне, False - інакше
        """
        self.tasks['tasks'] = []
        return self.save_tasks()


# Тестова функція для демонстрації роботи
def main():
    """Демонстрація роботи з менеджером задач"""
    task_manager = TaskManager()
    
    # Додавання нових задач
    task_manager.add_task("Завершити звіт", completed=False, priority="high", category="Робота")
    task_manager.add_task("Купити продукти", completed=True, category="Особисте")
    task_manager.add_task("Підготувати презентацію", due_date="20.03.2024", priority="medium", category="Робота")
    
    # Відображення всіх задач
    print("Всі задачі:")
    for i, task in enumerate(task_manager.get_all_tasks()):
        status = "✅" if task.get('completed') else "❌"
        print(f"{i}. {status} {task.get('name')} - {task.get('category', 'Без категорії')}")
    
    # Позначення задачі як виконаної
    task_manager.mark_completed(0)
    
    # Отримання статистики
    stats = task_manager.get_stats()
    print(f"\nСтатистика: {stats['completed']}/{stats['total']} виконано ({stats['completion_rate']}%)")
    
    # Фільтрація за категорією
    work_tasks = task_manager.filter_tasks_by_category("Робота")
    print("\nРобочі задачі:")
    for task in work_tasks:
        status = "✅" if task.get('completed') else "❌"
        print(f"{status} {task.get('name')}")


if __name__ == "__main__":
    main() 