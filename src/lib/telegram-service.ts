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
  
  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  
  report += `<b>✅ Виконані задачі (${completedTasks.length}/${tasks.length}):</b>\n`;
  if (completedTasks.length > 0) {
    completedTasks.forEach((task, index) => {
      report += `${index + 1}. ${task.title}\n`;
    });
  } else {
    report += "Немає виконаних задач.\n";
  }
  
  report += `\n<b>⏳ Невиконані задачі (${pendingTasks.length}):</b>\n`;
  if (pendingTasks.length > 0) {
    pendingTasks.forEach((task, index) => {
      report += `${index + 1}. ${task.title}\n`;
    });
  } else {
    report += "Немає невиконаних задач.";
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
  const pendingTasks = tasks.filter(task => !task.completed);
  
  const completionRate = Math.round((completedTasks.length / tasks.length) * 100);
  
  report += `<b>📈 Загальний прогрес: ${completionRate}%</b>\n`;
  report += `<b>✅ Виконано: ${completedTasks.length} задач</b>\n`;
  report += `<b>⏳ Залишилось: ${pendingTasks.length} задач</b>\n\n`;
  
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
    
    categoryTasks.forEach((task, index) => {
      const status = task.completed ? "✅" : "⏳";
      report += `${status} ${task.title}\n`;
    });
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
  
  const today = new Date();
  const formattedDate = today.toLocaleDateString('uk-UA', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  const message = `<b>🧪 Тестовий звіт</b>\n\n` +
    `Це тестове повідомлення для перевірки налаштувань Telegram бота.\n\n` +
    `<b>📅 Дата:</b> ${formattedDate}\n` +
    `<b>⏰ Час:</b> ${today.toLocaleTimeString('uk-UA')}\n\n` +
    `Якщо ви бачите це повідомлення, значить налаштування бота працюють коректно.`;
  
  return await sendTelegramMessage(settings.botToken, settings.chatId, message);
}; 