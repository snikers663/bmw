import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import TaskList from './pages/TaskList.jsx';
import TaskForm from './pages/TaskForm.jsx';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('access');
  return token ? children : <Navigate to="/login" replace />;
}

function Header() {
  const navigate = useNavigate();
  const isAuth = !!localStorage.getItem('access');
  const username = localStorage.getItem('username');

  if (!isAuth) return null;

  const logout = async () => {
    const refresh = localStorage.getItem('refresh');
    try {
      await fetch('/api/auth/logout/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
    } catch (e) {}
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <Link to="/" className="brand">✨ TaskFlow Pro</Link>
      <div className="header-right">
        <span className="username">Привет, {username} 👋</span>
        <button className="btn btn-secondary" onClick={logout}>Выйти</button>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <>
      {/* Изюминка: Анимированные светящиеся сферы на фоне */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      <Header />
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><TaskList /></PrivateRoute>} />
          <Route path="/tasks/new" element={<PrivateRoute><TaskForm /></PrivateRoute>} />
          <Route path="/tasks/:id" element={<PrivateRoute><TaskForm /></PrivateRoute>} />
          <Route path="/tasks/:id/edit" element={<PrivateRoute><TaskForm /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
