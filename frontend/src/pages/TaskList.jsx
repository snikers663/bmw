import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';

// Компонент всплывающего уведомления
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      {type === 'success' ? '✅' : '❌'} {message}
    </div>
  );
};

export default function TaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  // Функция для показа уведомлений
  const showToast = (message, type = 'success') => {
    setToasts((prev) => [...prev, { id: Date.now(), message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Запрос разрешения на системные уведомления
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = '/tasks/';
      const params = [];
      if (status) params.push(`status=${status}`);
      if (priority) params.push(`priority=${priority}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await api.get(url);
      setTasks(res.data);
    } catch (err) {
      showToast('Не удалось загрузить задачи', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line
  }, [status, priority]);

  // Умные напоминалки (раз в минуту)
  useEffect(() => {
    if (!tasks.length) return;

    const checkNotifications = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.status !== 'done' && task.due_date) {
          const dueDate = new Date(task.due_date);
          const diffMs = dueDate - now;
          const diffHours = diffMs / (1000 * 60 * 60);

          // Если до дедлайна меньше 24 часов и больше 0
          if (diffHours > 0 && diffHours <= 24) {
            const notifiedKey = `notified_${task.id}`;
            if (!localStorage.getItem(notifiedKey)) {
              if (Notification.permission === 'granted') {
                new Notification('🔥 Скоро дедлайн!', {
                  body: `Задача "${task.title}" должна быть выполнена до ${dueDate.toLocaleString('ru-RU')}`,
                  icon: '/vite.svg'
                });
                localStorage.setItem(notifiedKey, 'true');
              }
            }
          }
        }
      });
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000); 
    return () => clearInterval(interval);
  }, [tasks]);

  const deleteTask = async (id) => {
    if (!window.confirm('Удалить эту задачу?')) return;
    try {
      await api.delete(`/tasks/${id}/`);
      setTasks(tasks.filter((t) => t.id !== id));
      showToast('Задача удалена');
    } catch (err) {
      showToast('Ошибка при удалении', 'error');
    }
  };

  const downloadExcel = async () => {
    try {
      let url = '/tasks/export/';
      const params = [];
      if (status) params.push(`status=${status}`);
      if (priority) params.push(`priority=${priority}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `tasks_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      showToast('Excel файл скачан');
    } catch (err) {
      showToast('Ошибка при выгрузке Excel', 'error');
    }
  };

  const isOverdue = (dateStr, taskStatus) => {
    if (!dateStr || taskStatus === 'done') return false;
    return new Date(dateStr) < new Date();
  };

  const getStatusLabel = (s) => ({ todo: 'К выполнению', in_progress: 'В процессе', done: 'Выполнено' }[s] || s);
  const getPriorityLabel = (p) => ({ low: 'Низкий', medium: 'Средний', high: 'Высокий' }[p] || p);

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Вычисления для дашборда
  const activeTasks = tasks.filter(t => t.status !== 'done');
  const completedTasks = tasks.filter(t => t.status === 'done');
  const overdueCount = activeTasks.filter(t => isOverdue(t.due_date, t.status)).length;
  
  // Процент выполнения
  const progressPercent = tasks.length === 0 ? 0 : Math.round((completedTasks.length / tasks.length) * 100);

  // Фокус на сегодня (задачи с дедлайном на сегодняшний день)
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTasks = activeTasks.filter(t => t.due_date && t.due_date.startsWith(todayStr));

  return (
    <div>
      {/* Всплывающие уведомления */}
      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      {overdueCount > 0 && (
        <div className="alert-banner">
          ⚠️ У вас есть просроченные задачи: {overdueCount}. Проверьте дедлайны!
        </div>
      )}

      {/* Блок "Фокус на сегодня" */}
      {todayTasks.length > 0 && (
        <div className="focus-block">
          <div className="focus-title">🎯 Фокус на сегодня</div>
          <div className="focus-list">
            {todayTasks.map(task => (
              <div key={task.id} className="focus-item">
                <span>{task.title}</span>
                <span style={{ color: '#c4b5fd' }}>{formatDateTime(task.due_date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Дашборд со статистикой */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{tasks.length}</div>
          <div className="stat-label">Всего задач</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-blue">{activeTasks.length}</div>
          <div className="stat-label">В работе</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-green">{completedTasks.length}</div>
          <div className="stat-label">Выполнено</div>
          {/* Полоска прогресса */}
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
            Прогресс: {progressPercent}%
          </div>
        </div>
      </div>

      <div className="toolbar">
        <h2>Мои задачи</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={downloadExcel}>
            📥 Скачать Excel
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/tasks/new')}>
            + Добавить задачу
          </button>
        </div>
      </div>

      <div className="filters card">
        <div className="field">
          <label>Статус</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Все</option>
            <option value="todo">К выполнению</option>
            <option value="in_progress">В процессе</option>
            <option value="done">Выполнено</option>
          </select>
        </div>
        <div className="field">
          <label>Приоритет</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">Все</option>
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="empty">Загрузка...</div>
      ) : tasks.length === 0 ? (
        <div className="empty">
          У вас пока нет задач. Нажмите «Добавить задачу», чтобы создать первую.
        </div>
      ) : (
        <div className="kanban-board">
          <div className="kanban-column">
            <h3 className="column-title">🔥 Активные ({activeTasks.length})</h3>
            <div className="task-list">
              {activeTasks.length === 0 && <div className="empty-small">Нет активных задач</div>}
              {activeTasks.map((task) => (
                <div key={task.id} className={`task-row ${isOverdue(task.due_date, task.status) ? 'overdue' : ''}`}>
                  <div className="task-main">
                    <div className="task-title">
                      {task.title}
                      {isOverdue(task.due_date, task.status) && <span style={{ color: '#dc2626', fontSize: '12px', marginLeft: '8px' }}>(Просрочено)</span>}
                    </div>
                    <div className="task-meta">
                      <span className={`badge badge-${task.status}`}>{getStatusLabel(task.status)}</span>
                      <span className={`badge badge-${task.priority}`}>{getPriorityLabel(task.priority)}</span>
                      {task.due_date && <span>📅 {formatDateTime(task.due_date)}</span>}
                    </div>
                  </div>
                  <div className="task-actions">
                    <Link to={`/tasks/${task.id}`} className="btn-link">Открыть</Link>
                    <button className="btn btn-danger" onClick={() => deleteTask(task.id)} style={{ padding: '4px 8px', fontSize: '12px' }}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="kanban-column">
            <h3 className="column-title">✅ Выполненные ({completedTasks.length})</h3>
            <div className="task-list">
              {completedTasks.length === 0 && <div className="empty-small">Нет выполненных задач</div>}
              {completedTasks.map((task) => (
                <div key={task.id} className="task-row opacity-60">
                  <div className="task-main">
                    <div className="task-title text-strike">{task.title}</div>
                    <div className="task-meta">
                      <span className="badge badge-done">Выполнено</span>
                      {task.due_date && <span>📅 {formatDateTime(task.due_date)}</span>}
                    </div>
                  </div>
                  <div className="task-actions">
                    <Link to={`/tasks/${task.id}`} className="btn-link">Открыть</Link>
                    <button className="btn btn-danger" onClick={() => deleteTask(task.id)} style={{ padding: '4px 8px', fontSize: '12px' }}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
