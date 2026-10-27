import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await api.post('/auth/register/', form);
      navigate('/login');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ non_field_errors: 'Ошибка регистрации' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card">
      <h2>Регистрация</h2>
      <form onSubmit={submit}>
        {errors.non_field_errors && (
          <div className="form-error">{errors.non_field_errors}</div>
        )}
        <div className="field">
          <label>Логин</label>
          <input name="username" value={form.username} onChange={change} required />
          {errors.username && <span className="error">{errors.username}</span>}
        </div>
        <div className="field">
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={change} required />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>
        <div className="field">
          <label>Пароль</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={change}
            required
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </div>
        <div className="field">
          <label>Подтверждение пароля</label>
          <input
            name="password_confirm"
            type="password"
            value={form.password_confirm}
            onChange={change}
            required
          />
          {errors.password_confirm && (
            <span className="error">{errors.password_confirm}</span>
          )}
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Регистрация...' : 'Создать аккаунт'}
        </button>
        <p style={{ fontSize: 14 }}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </div>
  );
}