import { TelegramReporter } from './telegram-reporter';

/**
 * Приклад використання TelegramReporter
 */
export const demoTelegramReporter = async () => {
  // Ініціалізація TelegramReporter
  const reporter = new TelegramReporter();
  
  // Масив задач для прикладу
  const tasks = [
    { id: 1, name: 'Створити проект', completed: true },
    { id: 2, name: 'Налаштувати середовище', completed: true },
    { id: 3, name: 'Реалізувати основні функції', completed: false },
    { id: 4, name: 'Написати тести', completed: false },
    { id: 5, name: 'Опублікувати код', completed: false },
  ];
  
  // Генерація звіту на основі задач
  const report = reporter.generateReport(tasks);
  console.log('Згенерований звіт:');
  console.log(report);
  
  // Якщо налаштування відсутні, пропонуємо налаштувати
  if (!reporter['config'].telegram.token || !reporter['config'].telegram.chatId) {
    console.log('\nНалаштування Telegram відсутні.');
    console.log('Налаштуйте token і chatId, щоб відправляти звіти.');
    console.log('Приклад налаштування:');
    console.log('reporter.updateTelegramSettings("your_token", "your_chat_id", "18:00")');
    return;
  }
  
  // Відправка звіту
  console.log('\nВідправка звіту...');
  const success = await reporter.sendReport();
  
  if (success) {
    console.log('Звіт успішно відправлено!');
  } else {
    console.error('Не вдалося відправити звіт. Перевірте налаштування або мережу.');
  }
};

/**
 * Функція для ручного налаштування TelegramReporter
 */
export const configureReporter = (token: string, chatId: string | number, scheduleTime = '18:00') => {
  const reporter = new TelegramReporter();
  reporter.updateTelegramSettings(token, chatId, scheduleTime);
  console.log('Налаштування оновлено!');
  return reporter;
};

// Запускаємо демонстрацію, якщо файл запущено напряму
if (require.main === module) {
  demoTelegramReporter().catch(error => {
    console.error('Помилка в демонстрації:', error);
  });
} 