import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as schedule from 'node-schedule';

// Інтерфейси для конфігурації та задач
interface TelegramConfig {
  token: string;
  chatId: string | number;
  scheduleTime: string; // Формат "HH:MM"
}

interface Task {
  id: number;
  name: string;
  completed: boolean;
  due_date?: string;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
}

interface Config {
  telegram: TelegramConfig;
  tasks: {
    tasksFile: string;
  };
}

export class TelegramReporter {
  private config: Config;
  private configPath: string;
  private scheduledJob: schedule.Job | null = null;

  constructor(configPath = 'config.json') {
    this.configPath = configPath;
    this.config = this.loadConfig();
    this.initScheduler();
  }

  /**
   * Завантаження конфігурації з файлу
   */
  private loadConfig(): Config {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(configData);
      }
      // Якщо файл не існує, створюємо базову конфігурацію
      const defaultConfig: Config = {
        telegram: {
          token: '',
          chatId: '',
          scheduleTime: '18:00'
        },
        tasks: {
          tasksFile: 'tasks.json'
        }
      };
      this.saveConfig(defaultConfig);
      return defaultConfig;
    } catch (error) {
      console.error('Помилка при завантаженні конфігурації:', error);
      throw new Error('Не вдалося завантажити конфігурацію');
    }
  }

  /**
   * Збереження конфігурації у файл
   */
  private saveConfig(config: Config): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
      console.error('Помилка при збереженні конфігурації:', error);
      throw new Error('Не вдалося зберегти конфігурацію');
    }
  }

  /**
   * Оновлення налаштувань Telegram
   */
  public updateTelegramSettings(token: string, chatId: string | number, scheduleTime?: string): void {
    this.config.telegram.token = token;
    this.config.telegram.chatId = chatId;
    
    if (scheduleTime) {
      this.config.telegram.scheduleTime = scheduleTime;
    }
    
    this.saveConfig(this.config);
    
    // Перезапускаємо планувальник з новими налаштуваннями
    this.initScheduler();
  }

  /**
   * Завантаження задач з файлу
   */
  private loadTasks(): Task[] {
    try {
      const tasksPath = this.config.tasks.tasksFile;
      if (fs.existsSync(tasksPath)) {
        const tasksData = fs.readFileSync(tasksPath, 'utf8');
        const parsedData = JSON.parse(tasksData);
        return parsedData.tasks || [];
      }
      return [];
    } catch (error) {
      console.error('Помилка при завантаженні задач:', error);
      return [];
    }
  }

  /**
   * Формування текстового звіту на основі задач
   */
  public generateReport(tasks: Task[] = this.loadTasks()): string {
    const completedTasks = tasks.filter(task => task.completed);
    const pendingTasks = tasks.filter(task => !task.completed);
    
    const today = new Date().toLocaleDateString('uk-UA');
    let report = `📅 Звіт за день (${today}):\n\n`;
    
    // Статистика
    report += `📊 Статистика: ${completedTasks.length}/${tasks.length} виконано`;
    if (tasks.length > 0) {
      const completionRate = Math.round((completedTasks.length / tasks.length) * 100);
      report += ` (${completionRate}%)\n\n`;
    } else {
      report += ' (0%)\n\n';
    }
    
    // Виконані задачі
    if (completedTasks.length > 0) {
      report += '✅ Виконані задачі:\n';
      completedTasks.forEach(task => {
        report += `- ${task.name}\n`;
      });
      report += '\n';
    }
    
    // Невиконані задачі
    if (pendingTasks.length > 0) {
      report += '❌ Невиконані задачі:\n';
      pendingTasks.forEach(task => {
        const dueDate = task.due_date ? ` (до ${new Date(task.due_date).toLocaleDateString('uk-UA')})` : '';
        const priority = task.priority ? this.getPriorityEmoji(task.priority) : '';
        report += `- ${task.name}${dueDate} ${priority}\n`;
      });
    }
    
    return report;
  }

  /**
   * Отримання emoji для пріоритету
   */
  private getPriorityEmoji(priority: string): string {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '';
    }
  }

  /**
   * Відправка повідомлення через Telegram API
   */
  public async sendMessage(message: string): Promise<boolean> {
    const { token, chatId } = this.config.telegram;
    
    if (!token || !chatId) {
      console.error('Помилка: Токен або Chat ID не налаштовані');
      return false;
    }
    
    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await axios.post(url, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      });
      
      if (response.data && response.data.ok) {
        console.log('Повідомлення успішно відправлено');
        return true;
      } else {
        console.error('Помилка при відправці повідомлення:', response.data);
        return false;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Помилка при відправці повідомлення в Telegram:', 
          error.response?.data?.description || error.message);
          
        // Показуємо конкретну помилку по API
        if (error.response?.data?.error_code === 401) {
          console.error('Неправильний токен. Оновіть токен у налаштуваннях.');
        } else if (error.response?.data?.error_code === 400) {
          console.error('Неправильний формат запиту або chat_id. Перевірте налаштування.');
        }
      } else {
        console.error('Невідома помилка при відправці повідомлення:', error);
      }
      return false;
    }
  }

  /**
   * Відправка звіту
   */
  public async sendReport(): Promise<boolean> {
    const tasks = this.loadTasks();
    const report = this.generateReport(tasks);
    return await this.sendMessage(report);
  }

  /**
   * Ініціалізація планувальника для відправки звітів
   */
  public initScheduler(): void {
    // Спочатку скасовуємо існуючий планувальник, якщо він є
    if (this.scheduledJob) {
      this.scheduledJob.cancel();
    }
    
    // Перевіряємо, чи налаштовані необхідні дані
    if (!this.config.telegram.token || !this.config.telegram.chatId) {
      console.warn('Планувальник не запущено: відсутній токен або chat_id');
      return;
    }
    
    // Розбір часу розкладу
    const [hours, minutes] = this.config.telegram.scheduleTime.split(':').map(Number);
    
    // Створення нового планувальника
    this.scheduledJob = schedule.scheduleJob(`${minutes} ${hours} * * *`, async () => {
      console.log(`Надсилання звіту за розкладом (${this.config.telegram.scheduleTime})`);
      await this.sendReport();
    });
    
    console.log(`Планувальник запущено. Звіти будуть відправлятися щодня о ${this.config.telegram.scheduleTime}`);
  }

  /**
   * Надіслати тестовий звіт для перевірки налаштувань
   */
  public async sendTestReport(): Promise<boolean> {
    const { token, chatId } = this.config.telegram;
    
    if (!token || !chatId) {
      console.error('Помилка: Токен або Chat ID не налаштовані');
      return false;
    }
    
    const testMessage = '🔍 Тестове повідомлення\n\nЯкщо ви бачите це повідомлення, значить налаштування Telegram успішно завершено!';
    
    try {
      const result = await this.sendMessage(testMessage);
      return result;
    } catch (error) {
      console.error('Помилка при відправці тестового повідомлення:', error);
      return false;
    }
  }
}

// Приклад використання
export const initTelegramReporter = (): TelegramReporter => {
  return new TelegramReporter();
}; 