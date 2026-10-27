import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';

export default function TaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Фильтры
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      let url = '/tasks/';
      const params = [];
      if (status) params.push(`status=${status}`);
      if (priority) params.push(`priority=${priority}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await api.get(url);
      setTasks(res.data);
    } catch (err) {
      setError('Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line
  }, [status, priority]);

  const deleteTask = async (id) => {
    if (!window.confirm('Удалить эту задачу?')) return;
    try {
      await api.delete(`/tasks/${id}/`);
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err) {
      alert('Ошибка при удалении');
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
    } catch (err) {
      alert('Ошибка при выгрузке Excel');
    }
  };

  const isOverdue = (dateStr, taskStatus) => {
    if (!dateStr || taskStatus === 'done') return false;
    const today = new Date().toISOString().slice(0, 10);
    return dateStr < today;
  };

  const getStatusLabel = (s) => {
    return { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }[s] || s;
  };

  return (
    <div>
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
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div className="field">
          <label>Приоритет</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">Все</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="empty">Загрузка...</div>
      ) : tasks.length === 0 ? (
        <div className="empty">
          У вас пока нет задач. Нажмите «Добавить задачу», чтобы создать первую.
        </div>
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`task-row ${isOverdue(task.due_date, task.status) ? 'overdue' : ''}`}
            >
              <div className="task-main">
                <div className="task-title">
                  {task.title}
                  {isOverdue(task.due_date, task.status) && (
                    <span style={{ color: '#dc2626', fontSize: '12px', marginLeft: '8px' }}>
                      (Просрочено)
                    </span>
                  )}
                </div>
                <div className="task-meta">
                  <span className={`badge badge-${task.status}`}>
                    {getStatusLabel(task.status)}
                  </span>
                  <span className={`badge badge-${task.priority}`}>
                    {task.priority}
                  </span>
                  {task.due_date && (
                    <span>📅 Дедлайн: {task.due_date}</span>
                  )}
                </div>
              </div>
              <div className="task-actions">
                <Link to={`/tasks/${task.id}`} className="btn-link">
                  Открыть
                </Link>
                <button
                  className="btn btn-danger"
                  onClick={() => deleteTask(task.id)}
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}