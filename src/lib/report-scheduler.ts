/**
 * Сервіс для планування та відправки звітів
 */

import { 
  TelegramSettings, 
  loadTelegramSettings, 
  sendTelegramMessage, 
  formatDailyReport, 
  formatWeeklyReport 
} from './telegram-service';

// Ключ для зберігання задач в localStorage
const TASKS_STORAGE_KEY = 'tasks';

// Інтерфейс для задачі
interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt?: string;
}

/**
 * Завантажує задачі з localStorage
 */
const loadTasks = (): Task[] => {
  try {
    const tasksJson = localStorage.getItem(TASKS_STORAGE_KEY);
    return tasksJson ? JSON.parse(tasksJson) : [];
  } catch (error) {
    console.error('Помилка завантаження задач:', error);
    return [];
  }
};

/**
 * Фільтрує задачі за вказаним діапазоном дат
 */
const filterTasksByDateRange = (tasks: Task[], startDate: Date, endDate: Date): Task[] => {
  return tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    return taskDate >= startDate && taskDate <= endDate;
  });
};

/**
 * Отримує задачі за вказаний день
 */
const getTasksForDay = (date: Date): Task[] => {
  const tasks = loadTasks();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return filterTasksByDateRange(tasks, startOfDay, endOfDay);
};

/**
 * Отримує задачі за вказаний тиждень
 */
const getTasksForWeek = (date: Date): { tasks: Task[], startDate: Date, endDate: Date } => {
  const tasks = loadTasks();
  
  // Знаходимо початок тижня (понеділок)
  const startDate = new Date(date);
  const day = startDate.getDay();
  const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Якщо неділя, то -6, інакше +1
  startDate.setDate(diff);
  startDate.setHours(0, 0, 0, 0);
  
  // Знаходимо кінець тижня (неділя)
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  
  const weekTasks = filterTasksByDateRange(tasks, startDate, endDate);
  
  return { tasks: weekTasks, startDate, endDate };
};

/**
 * Перевіряє, чи потрібно відправити щоденний звіт
 */
const shouldSendDailyReport = (settings: TelegramSettings): boolean => {
  if (!settings.enabled || !settings.reportSchedule.daily) {
    return false;
  }
  
  const now = new Date();
  const [hours, minutes] = settings.reportSchedule.dailyTime.split(':').map(Number);
  
  return now.getHours() === hours && now.getMinutes() === minutes;
};

/**
 * Перевіряє, чи потрібно відправити щотижневий звіт
 */
const shouldSendWeeklyReport = (settings: TelegramSettings): boolean => {
  if (!settings.enabled || !settings.reportSchedule.weekly) {
    return false;
  }
  
  const now = new Date();
  const [hours, minutes] = settings.reportSchedule.weeklyTime.split(':').map(Number);
  
  return now.getDay() === settings.reportSchedule.weeklyDay && 
         now.getHours() === hours && 
         now.getMinutes() === minutes;
};

/**
 * Відправляє щоденний звіт
 */
const sendDailyReport = async (): Promise<boolean> => {
  const settings = loadTelegramSettings();
  
  if (!settings.enabled || !settings.reportSchedule.daily) {
    return false;
  }
  
  const today = new Date();
  const tasks = getTasksForDay(today);
  const report = formatDailyReport(tasks, today);
  
  return await sendTelegramMessage(settings.botToken, settings.chatId, report);
};

/**
 * Відправляє щотижневий звіт
 */
const sendWeeklyReport = async (): Promise<boolean> => {
  const settings = loadTelegramSettings();
  
  if (!settings.enabled || !settings.reportSchedule.weekly) {
    return false;
  }
  
  const today = new Date();
  const { tasks, startDate, endDate } = getTasksForWeek(today);
  const report = formatWeeklyReport(tasks, startDate, endDate);
  
  return await sendTelegramMessage(settings.botToken, settings.chatId, report);
};

/**
 * Ініціалізує планувальник звітів
 */
export const initReportScheduler = (): void => {
  // Перевіряємо кожну хвилину, чи потрібно відправити звіт
  setInterval(() => {
    const settings = loadTelegramSettings();
    
    if (shouldSendDailyReport(settings)) {
      sendDailyReport()
        .then(success => {
          if (success) {
            console.log('Щоденний звіт успішно відправлено');
          } else {
            console.error('Помилка відправки щоденного звіту');
          }
        });
    }
    
    if (shouldSendWeeklyReport(settings)) {
      sendWeeklyReport()
        .then(success => {
          if (success) {
            console.log('Щотижневий звіт успішно відправлено');
          } else {
            console.error('Помилка відправки щотижневого звіту');
          }
        });
    }
  }, 60000); // Перевіряємо кожну хвилину
};

/**
 * Відправляє тестовий звіт
 */
export const sendTestReport = async (): Promise<boolean> => {
  const settings = loadTelegramSettings();
  
  if (!settings.enabled) {
    return false;
  }
  
  const today = new Date();
  const tasks = getTasksForDay(today);
  const report = `<b>🧪 Тестовий звіт</b>\n\n` + formatDailyReport(tasks, today);
  
  return await sendTelegramMessage(settings.botToken, settings.chatId, report);
}; 