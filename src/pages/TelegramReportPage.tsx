import React, { useState, useEffect } from 'react';
import TelegramSettings from '../components/TelegramSettings';
import { TelegramReporter } from '../telegram-reporter';

const TelegramReportPage: React.FC = () => {
  const [telegramReporter, setTelegramReporter] = useState<TelegramReporter | null>(null);
  const [tasks, setTasks] = useState<Array<{id: number, name: string, completed: boolean}>>([]);
  const [reportText, setReportText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Ініціалізація TelegramReporter при завантаженні сторінки
  useEffect(() => {
    const reporter = new TelegramReporter();
    setTelegramReporter(reporter);
    
    // Завантаження прикладових задач
    const exampleTasks = [
      { id: 1, name: 'Ознайомитися з вимогами', completed: true },
      { id: 2, name: 'Розробити архітектуру', completed: true },
      { id: 3, name: 'Реалізувати базову структуру', completed: true },
      { id: 4, name: 'Додати функціонал звітування', completed: false },
      { id: 5, name: 'Налаштувати Telegram інтеграцію', completed: false },
      { id: 6, name: 'Написати документацію', completed: false },
      { id: 7, name: 'Провести тестування', completed: false },
    ];
    setTasks(exampleTasks);
    
    // Генерація звіту для прикладу
    if (reporter) {
      const report = reporter.generateReport(exampleTasks);
      setReportText(report);
    }
  }, []);

  // Оновлення звіту при зміні статусу задач
  const updateTaskStatus = (taskId: number, completed: boolean) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed } : task
    );
    setTasks(updatedTasks);
    
    if (telegramReporter) {
      const report = telegramReporter.generateReport(updatedTasks);
      setReportText(report);
    }
  };

  // Відправка звіту через Telegram
  const sendReport = async () => {
    if (!telegramReporter) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await telegramReporter.sendMessage(reportText);
      if (result) {
        setSuccess('Звіт успішно відправлено!');
      } else {
        setError('Не вдалося відправити звіт. Перевірте налаштування.');
      }
    } catch (err: any) {
      setError(err.message || 'Сталася помилка при відправці звіту');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-7">
          <div className="mb-5">
            <h1>Telegram звіти</h1>
            <p className="lead">
              На цій сторінці ви можете налаштувати автоматичні звіти про задачі через Telegram.
            </p>
          </div>
          
          {telegramReporter && (
            <TelegramSettings 
              telegramReporter={telegramReporter} 
              onSettingsUpdated={() => setSuccess('Налаштування успішно оновлено')}
            />
          )}
        </div>
        
        <div className="col-md-5">
          <div className="card mt-5">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Звіт про задачі</h5>
              <button 
                className="btn btn-primary btn-sm" 
                onClick={sendReport} 
                disabled={loading || !telegramReporter}
              >
                {loading ? 'Відправка...' : 'Відправити зараз'}
              </button>
            </div>
            <div className="card-body">
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
              
              <pre className="report-preview bg-light p-3 rounded">
                {reportText}
              </pre>
            </div>
          </div>
          
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">Керування задачами</h5>
            </div>
            <div className="card-body">
              <p className="text-muted">
                Змініть статус задач, щоб побачити оновлення звіту
              </p>
              <ul className="list-group">
                {tasks.map(task => (
                  <li 
                    key={task.id} 
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <input 
                        type="checkbox" 
                        className="form-check-input me-2" 
                        checked={task.completed} 
                        onChange={(e) => updateTaskStatus(task.id, e.target.checked)}
                        id={`task-${task.id}`}
                      />
                      <label 
                        htmlFor={`task-${task.id}`}
                        className={task.completed ? 'text-decoration-line-through' : ''}
                      >
                        {task.name}
                      </label>
                    </div>
                    <span className={`badge ${task.completed ? 'bg-success' : 'bg-secondary'}`}>
                      {task.completed ? 'Виконано' : 'Не виконано'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramReportPage; 