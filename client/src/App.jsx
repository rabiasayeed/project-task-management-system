import React from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setAuth } from './store.js';
import api from './api.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Projects from './pages/Projects.jsx';
import Tasks from './pages/Tasks.jsx';
import Notifications from './pages/Notifications.jsx';
import Users from './pages/Users.jsx';

function Layout({ children }) {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const nav = useNavigate();
  const location = useLocation();
  const out = () => { dispatch(logout()); nav('/login'); };

  const links = [
    ['/', 'Dashboard'],
    ['/projects', 'Projects'],
    ['/tasks', 'Tasks'],
    ['/notifications', 'Notifications'],
    ...(user?.role === 'ADMIN' ? [['/users', 'Users']] : []),
  ];

  return (
    <div className="app-shell min-h-screen">
      <header className="sticky top-0 z-50 border-b border-indigo-100/80 bg-white/90 shadow-[0_8px_30px_rgba(79,70,229,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 font-extrabold text-slate-900">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-lg shadow-indigo-600/25">P</span>
            <span className="text-lg">ProjectFlow</span>
          </Link>
          <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto pb-2 md:order-none md:w-auto md:pb-0">
            {links.map(([to, label]) => (
              <Link key={to} to={to} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${location.pathname === to ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                {label}
              </Link>
            ))}
            {user?.role === 'ADMIN' && <span className="ml-1 rounded-full bg-gradient-to-r from-violet-50 to-cyan-50 px-2.5 py-1 text-xs font-bold text-violet-700 ring-1 ring-violet-100">ADMIN</span>}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-slate-900">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-500">{user?.email || ''}</p>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-bold text-indigo-700 ring-1 ring-indigo-200">{(user?.name || 'U').charAt(0).toUpperCase()}</div>
            <button onClick={out} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">Logout</button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

function Protected({ children }) {
  return useSelector((s) => s.auth.user) ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function SessionLoader({ children }) {
  const dispatch = useDispatch();
  const token = useSelector(s => s.auth.token);
  const [checked, setChecked] = React.useState(!token);

  React.useEffect(() => {
    if (!token) { setChecked(true); return; }
    api.get('/auth/me')
      .then(({ data }) => {
        localStorage.setItem('user', JSON.stringify(data.user));
        dispatch(setAuth({ user: data.user, token }));
      })
      .catch(() => dispatch(logout()))
      .finally(() => setChecked(true));
  }, [token, dispatch]);

  if (!checked) return <div className="app-loading grid min-h-screen place-items-center text-sm text-slate-500">Checking your session...</div>;
  return children;
}

export default function App() {
  return (
    <SessionLoader>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/projects" element={<Protected><Projects /></Protected>} />
      <Route path="/tasks" element={<Protected><Tasks /></Protected>} />
      <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
      <Route path="/users" element={<Protected><Users /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </SessionLoader>
  );
}
