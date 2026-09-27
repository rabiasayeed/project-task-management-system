import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import api from '../api.js';

export default function Users() {
  const user = useSelector(s => s.auth.user);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    api.get('/users')
      .then(r => setUsers(r.data.users || []))
      .catch(e => setError(e.response?.data?.message || 'Unable to load users.'))
      .finally(() => setLoading(false));
  }, [user?.role]);

  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;

  return <section className="page-shell"><div className="mb-7"><p className="mb-1 text-sm font-semibold text-indigo-600">Administration</p><h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Users</h1><p className="mt-1 text-sm text-slate-500">View all registered users and their roles.</p></div>{error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}<div className="card p-0"><div className="border-b border-slate-100 px-5 py-4 font-bold">All users</div>{loading ? <div className="p-10 text-center text-sm text-slate-500">Loading users...</div> : users.length ? <div className="divide-y divide-slate-100">{users.map(u => <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" key={u._id}><div><b className="text-sm text-slate-900">{u.name}</b><p className="text-xs text-slate-500">{u.email}</p></div><span className={`badge ${u.role === 'ADMIN' ? 'badge-blue' : 'badge-neutral'}`}>{u.role}</span></div>)}</div> : <div className="p-10 text-center text-sm text-slate-500">No users found.</div>}</div></section>;
}
