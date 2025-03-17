/**
 * Сервіс для взаємодії з Telegram API
 */

// Інтерфейс для налаштувань Telegram
export interface TelegramSettings {
  botToken: string;
  chatId: string;
  enabled: boolean;
  reportSchedule: {
    daily: boolean;
    weekly: boolean;
    dailyTime: string; // формат "HH:MM"
    weeklyDay: number; // 0-6 (неділя-субота)
    weeklyTime: string; // формат "HH:MM"
  };
}

// Ключ для зберігання налаштувань в localStorage
export const TELEGRAM_SETTINGS_KEY = "telegram_settings";

// Значення за замовчуванням
export const DEFAULT_TELEGRAM_SETTINGS: TelegramSettings = {
  botToken: "",
  chatId: "",
  enabled: false,
  reportSchedule: {
    daily: false,
    weekly: false,
    dailyTime: "20:00",
    weeklyDay: 5, // П'ятниця
    weeklyTime: "18:00",
  },
};

/**
 * Завантажує налаштування Telegram з localStorage
 */
export const loadTelegramSettings = (): TelegramSettings => {
  try {
    const savedSettings = localStorage.getItem(TELEGRAM_SETTINGS_KEY);
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error("Помилка завантаження налаштувань Telegram:", error);
  }
  return DEFAULT_TELEGRAM_SETTINGS;
};

/**
 * Зберігає налаштування Telegram в localStorage
 */
export const saveTelegramSettings = (settings: TelegramSettings): void => {
  try {
    localStorage.setItem(TELEGRAM_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Помилка збереження налаштувань Telegram:", error);
  }
};

/**
 * Відправляє повідомлення через Telegram бот
 */
export const sendTelegramMessage = async (
  botToken: string,
  chatId: string,
  message: string
): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error("Помилка відправки повідомлення в Telegram:", error);
    return false;
  }
};

/**
 * Перевіряє валідність токена бота
 */
export const validateBotToken = async (botToken: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getMe`
    );
    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error("Помилка перевірки токена бота:", error);
    return false;
  }
};

/**
 * Форматує звіт про задачі за день
 */
export const formatDailyReport = (tasks: any[], date: Date): string => {
  const formattedDate = date.toLocaleDateString('uk-UA', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  let report = `<b>📅 Звіт за ${formattedDate}</b>\n\n`;
  
  if (tasks.length === 0) {
    report += "Немає задач на цей день.";
    return report;
  }
  
  // Розділяємо задачі на виконані, активні на сьогодні та прострочені
  const completedTasks = tasks.filter(task => task.completed);
  const activeTasks = tasks.filter(task => !task.completed);
  
  // Перевіряємо, чи є прострочені задачі
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = activeTasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  });
  
  // Активні задачі на сьогодні (не прострочені)
  const todayTasks = activeTasks.filter(task => !overdueTasks.includes(task));
  
  report += `<b>✅ Виконані задачі (${completedTasks.length}/${tasks.length}):</b>\n`;
  if (completedTasks.length > 0) {
    completedTasks.forEach((task, index) => {
      report += `${index + 1}. ${task.title}\n`;
    });
  } else {
    report += "Немає виконаних задач.\n";
  }
  
  report += `\n<b>⏳ Активні задачі на сьогодні (${todayTasks.length}):</b>\n`;
  if (todayTasks.length > 0) {
    todayTasks.forEach((task, index) => {
      report += `${index + 1}. ${task.title}\n`;
    });
  } else {
    report += "Немає активних задач на сьогодні.\n";
  }
  
  if (overdueTasks.length > 0) {
    report += `\n<b>⚠️ Прострочені задачі (${overdueTasks.length}):</b>\n`;
    overdueTasks.forEach((task, index) => {
      const taskDate = new Date(task.dueDate);
      const formattedTaskDate = taskDate.toLocaleDateString('uk-UA', { 
        day: 'numeric', 
        month: 'long'
      });
      report += `${index + 1}. ${task.title} (${formattedTaskDate})\n`;
    });
  }
  
  return report;
};

/**
 * Форматує звіт про задачі за тиждень
 */
export const formatWeeklyReport = (tasks: any[], startDate: Date, endDate: Date): string => {
  const startFormatted = startDate.toLocaleDateString('uk-UA', { 
    day: 'numeric', 
    month: 'long'
  });
  
  const endFormatted = endDate.toLocaleDateString('uk-UA', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  let report = `<b>📊 Тижневий звіт (${startFormatted} - ${endFormatted})</b>\n\n`;
  
  if (tasks.length === 0) {
    report += "Немає задач за цей період.";
    return report;
  }
  
  const completedTasks = tasks.filter(task => task.completed);
  const activeTasks = tasks.filter(task => !task.completed);
  
  // Перевіряємо, чи є прострочені задачі
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = activeTasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  });
  
  // Активні задачі на цей тиждень (не прострочені)
  const currentWeekTasks = activeTasks.filter(task => !overdueTasks.includes(task));
  
  const completionRate = Math.round((completedTasks.length / tasks.length) * 100);
  
  report += `<b>📈 Загальний прогрес: ${completionRate}%</b>\n`;
  report += `<b>✅ Виконано: ${completedTasks.length} задач</b>\n`;
  report += `<b>⏳ Активних: ${currentWeekTasks.length} задач</b>\n`;
  if (overdueTasks.length > 0) {
    report += `<b>⚠️ Прострочено: ${overdueTasks.length} задач</b>\n`;
  }
  report += `\n`;
  
  // Групуємо задачі за категоріями
  const tasksByCategory: Record<string, any[]> = {};
  tasks.forEach(task => {
    const category = task.category || 'Без категорії';
    if (!tasksByCategory[category]) {
      tasksByCategory[category] = [];
    }
    tasksByCategory[category].push(task);
  });
  
  report += "<b>📋 Задачі за категоріями:</b>\n";
  
  Object.entries(tasksByCategory).forEach(([category, categoryTasks]) => {
    const categoryCompleted = categoryTasks.filter(task => task.completed).length;
    report += `\n<b>${category} (${categoryCompleted}/${categoryTasks.length}):</b>\n`;
    
    // Спочатку виводимо активні задачі
    const activeCategoryTasks = categoryTasks.filter(task => !task.completed && !overdueTasks.includes(task));
    if (activeCategoryTasks.length > 0) {
      activeCategoryTasks.forEach(task => {
        const taskDate = new Date(task.dueDate);
        const formattedTaskDate = taskDate.toLocaleDateString('uk-UA', { 
          day: 'numeric', 
          month: 'long'
        });
        report += `⏳ ${task.title} (${formattedTaskDate})\n`;
      });
    }
    
    // Потім виводимо прострочені задачі
    const overdueCategoryTasks = categoryTasks.filter(task => overdueTasks.includes(task));
    if (overdueCategoryTasks.length > 0) {
      overdueCategoryTasks.forEach(task => {
        const taskDate = new Date(task.dueDate);
        const formattedTaskDate = taskDate.toLocaleDateString('uk-UA', { 
          day: 'numeric', 
          month: 'long'
        });
        report += `⚠️ ${task.title} (${formattedTaskDate}) - прострочено\n`;
      });
    }
    
    // Потім виводимо виконані задачі
    const completedCategoryTasks = categoryTasks.filter(task => task.completed);
    if (completedCategoryTasks.length > 0) {
      completedCategoryTasks.forEach(task => {
        report += `✅ ${task.title}\n`;
      });
    }
  });
  
  return report;
};

/**
 * Відправляє тестовий звіт
 */
export const sendTestReport = async (): Promise<boolean> => {
  const settings = loadTelegramSettings();
  
  if (!settings.enabled || !settings.botToken || !settings.chatId) {
    return false;
  }
  
  // Отримуємо всі задачі з localStorage
  try {
    const tasksJson = localStorage.getItem('tasks');
    const allTasks = tasksJson ? JSON.parse(tasksJson) : [];
    
    const today = new Date();
    const formattedDate = today.toLocaleDateString('uk-UA', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    let message = `<b>🧪 Тестовий звіт</b>\n\n` +
      `Це тестове повідомлення для перевірки налаштувань Telegram бота.\n\n` +
      `<b>📅 Дата:</b> ${formattedDate}\n` +
      `<b>⏰ Час:</b> ${today.toLocaleTimeString('uk-UA')}\n\n`;
    
    // Додаємо інформацію про всі задачі
    message += `<b>📋 Всі задачі (${allTasks.length}):</b>\n\n`;
    
    if (allTasks.length === 0) {
      message += "У вас немає жодних задач.\n";
    } else {
      const activeTasks = allTasks.filter((task: any) => !task.completed);
      const completedTasks = allTasks.filter((task: any) => task.completed);
      
      message += `<b>⏳ Активні задачі (${activeTasks.length}):</b>\n`;
      if (activeTasks.length > 0) {
        activeTasks.forEach((task: any, index: number) => {
          const taskDate = new Date(task.dueDate);
          const formattedTaskDate = taskDate.toLocaleDateString('uk-UA', { 
            day: 'numeric', 
            month: 'long'
          });
          message += `${index + 1}. ${task.title} (${formattedTaskDate})\n`;
        });
      } else {
        message += "Немає активних задач.\n";
      }
      
      message += `\n<b>✅ Виконані задачі (${completedTasks.length}):</b>\n`;
      if (completedTasks.length > 0) {
        completedTasks.slice(0, 5).forEach((task: any, index: number) => {
          message += `${index + 1}. ${task.title}\n`;
        });
        
        if (completedTasks.length > 5) {
          message += `... та ще ${completedTasks.length - 5} задач\n`;
        }
      } else {
        message += "Немає виконаних задач.\n";
      }
    }
    
    message += `\nЯкщо ви бачите це повідомлення, значить налаштування бота працюють коректно.`;
    
    return await sendTelegramMessage(settings.botToken, settings.chatId, message);
  } catch (error) {
    console.error("Помилка при формуванні тестового звіту:", error);
    return false;
  }
}; 