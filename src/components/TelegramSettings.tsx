import React, { useState, useEffect } from 'react';
import { TelegramReporter } from '../telegram-reporter';

interface TelegramSettingsProps {
  telegramReporter: TelegramReporter;
  onSettingsUpdated?: () => void;
}

const TelegramSettings: React.FC<TelegramSettingsProps> = ({ 
  telegramReporter, 
  onSettingsUpdated 
}) => {
  const [token, setToken] = useState<string>('');
  const [chatId, setChatId] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('18:00');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Завантаження поточних налаштувань
  useEffect(() => {
    try {
      // Отримуємо налаштування з конфігурації
      // В реальному додатку тут має бути метод для отримання поточних налаштувань
      const config = telegramReporter['config'];
      if (config && config.telegram) {
        setToken(config.telegram.token || '');
        setChatId(String(config.telegram.chatId) || '');
        setScheduleTime(config.telegram.scheduleTime || '18:00');
      }
    } catch (err) {
      console.error('Помилка при завантаженні налаштувань:', err);
      setError('Не вдалося завантажити налаштування');
    }
  }, [telegramReporter]);

  // Збереження налаштувань
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      telegramReporter.updateTelegramSettings(token, chatId, scheduleTime);
      setSuccess('Налаштування успішно збережено');
      if (onSettingsUpdated) {
        onSettingsUpdated();
      }
    } catch (err: any) {
      console.error('Помилка при збереженні налаштувань:', err);
      setError(err.message || 'Не вдалося зберегти налаштування');
    } finally {
      setLoading(false);
    }
  };

  // Відправка тестового повідомлення
  const handleTestMessage = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await telegramReporter.sendTestReport();
      if (result) {
        setSuccess('Тестове повідомлення успішно відправлено');
      } else {
        setError('Не вдалося відправити тестове повідомлення');
      }
    } catch (err: any) {
      console.error('Помилка при відправці тестового повідомлення:', err);
      setError(err.message || 'Не вдалося відправити тестове повідомлення');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="telegram-settings">
      <h2>Налаштування Telegram</h2>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSaveSettings}>
        <div className="mb-3">
          <label htmlFor="token" className="form-label">Telegram Bot Token</label>
          <input
            type="text"
            className="form-control"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123w2"
            required
          />
          <small className="form-text text-muted">
            Отримайте токен бота у <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">@BotFather</a>
          </small>
        </div>
        
        <div className="mb-3">
          <label htmlFor="chatId" className="form-label">Telegram Chat ID</label>
          <input
            type="text"
            className="form-control"
            id="chatId"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="123456789"
            required
          />
          <small className="form-text text-muted">
            ID чату, в який відправлятимуться звіти
          </small>
        </div>
        
        <div className="mb-3">
          <label htmlFor="scheduleTime" className="form-label">Час відправки звіту</label>
          <input
            type="time"
            className="form-control"
            id="scheduleTime"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            required
          />
          <small className="form-text text-muted">
            Щоденний час, коли буде відправлятися звіт
          </small>
        </div>
        
        <div className="d-flex gap-2">
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
          >
            {loading ? 'Збереження...' : 'Зберегти налаштування'}
          </button>
          
          <button 
            type="button" 
            className="btn btn-outline-secondary" 
            onClick={handleTestMessage}
            disabled={loading || !token || !chatId}
          >
            Надіслати тестове повідомлення
          </button>
        </div>
      </form>
    </div>
  );
};

export default TelegramSettings; 