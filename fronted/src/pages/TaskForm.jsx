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
            due_date: data.due_date || '',
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
      if (isEdit) {
        await api.put(`/tasks/${id}/`, form);
      } else {
        await api.post('/tasks/', form);
      }
      navigate('/');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ non_field_errors: 'Ошибка сохранения' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty">Загрузка...</div>;

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>{isEdit ? 'Редактировать задачу' : 'Новая задача'}</h2>
      <form onSubmit={submit}>
        {errors.non_field_errors && (
          <div className="form-error">{errors.non_field_errors}</div>
        )}
        
        <div className="field">
          <label>Название *</label>
          <input
            name="title"
            value={form.title}
            onChange={change}
            required
            maxLength={120}
          />
          {errors.title && <span className="error">{errors.title}</span>}
        </div>

        <div className="field">
          <label>Описание</label>
          <textarea
            name="description"
            value={form.description}
            onChange={change}
            rows={4}
            maxLength={2000}
          />
          {errors.description && <span className="error">{errors.description}</span>}
        </div>

        <div className="field">
          <label>Статус</label>
          <select name="status" value={form.status} onChange={change}>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="field">
          <label>Приоритет</label>
          <select name="priority" value={form.priority} onChange={change}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="field">
          <label>Дедлайн</label>
          <input
            type="date"
            name="due_date"
            value={form.due_date}
            onChange={change}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => navigate('/')}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}