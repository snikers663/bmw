import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api.js';

export default function TaskForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/tasks/${id}/`)
        .then((res) => {
          const data = res.data;
          setForm({
            title: data.title,
            description: data.description || '',
            status: data.status,
            priority: data.priority,
            due_date: data.due_date ? data.due_date.slice(0, 16) : '',
          });
        })
        .catch(() => alert('Ошибка загрузки задачи'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      const payload = { ...form, due_date: form.due_date || null };
      
      if (isEdit) {
        await api.put(`/tasks/${id}/`, payload);
      } else {
        await api.post('/tasks/', payload);
      }
      navigate('/');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ non_field_errors: 'Ошибка сохранения. Проверьте данные.' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty">Загрузка...</div>;

  return (
    <div className="card" style={{ maxWidth: '650px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>{isEdit ? '✏️ Редактировать задачу' : '➕ Новая задача'}</h2>
      <form onSubmit={submit}>
        {errors.non_field_errors && (
          <div className="form-error">{errors.non_field_errors}</div>
        )}
        
        <div className="field">
          <label>Название задачи *</label>
          <input
            name="title"
            value={form.title}
            onChange={change}
            required
            maxLength={120}
            placeholder="Например: Сдать проект по вебу"
          />
          {errors.title && <span className="error">{errors.title}</span>}
        </div>

        <div className="field">
          <label>Описание</label>
          <textarea
            name="description"
            value={form.description}
            onChange={change}
            rows={3}
            maxLength={2000}
            placeholder="Детали задачи..."
          />
          {errors.description && <span className="error">{errors.description}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="field">
            <label>Статус</label>
            <select name="status" value={form.status} onChange={change}>
              <option value="todo">📌 К выполнению</option>
              <option value="in_progress">⏳ В процессе</option>
              <option value="done">✅ Выполнено</option>
            </select>
          </div>

          <div className="field">
            <label>Приоритет</label>
            <select name="priority" value={form.priority} onChange={change}>
              <option value="low">🟢 Низкий</option>
              <option value="medium">🟡 Средний</option>
              <option value="high">🔴 Высокий</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Дедлайн (Дата и Время)</label>
          <input
            type="datetime-local"
            name="due_date"
            value={form.due_date}
            onChange={change}
            style={{ colorScheme: 'dark' }} 
          />
          <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
            Выберите точное время (например, 09:00 для утренних задач или 19:00 для вечерних)
          </small>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button className="btn btn-primary" type="submit" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
            {saving ? 'Сохранение...' : 'Сохранить задачу'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/')} style={{ flex: 1, justifyContent: 'center' }}>
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
