import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api.js';
import { setNotifications, markRead, markAllRead, notificationsLoading, setNotificationsError } from '../store.js';

export default function Notifications() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector(s => s.notifications);
  const [error, setError] = useState('');
  const unread = items.filter(n => !n.read).length;

  useEffect(() => {
    let active = true;
    const load = async () => {
      dispatch(notificationsLoading(true));
      try {
        const r = await api.get('/notifications');
        if (active) dispatch(setNotifications(r.data.notifications || []));
      } catch (e) {
        const message = e.response?.data?.message || 'Unable to load notifications.';
        setError(message);
        dispatch(setNotificationsError(message));
      }
    };
    load();
    return () => { active = false; };
  }, [dispatch]);

  const read = async id => {
    try { await api.patch(`/notifications/${id}/read`); dispatch(markRead(id)); }
    catch (e) { setError(e.response?.data?.message || 'Unable to mark notification as read.'); }
  };

  const all = async () => {
    try { await api.patch('/notifications/read-all'); dispatch(markAllRead()); }
    catch (e) { setError(e.response?.data?.message || 'Unable to mark notifications as read.'); }
  };

  return <section className="page-shell"><div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-1 text-sm font-semibold text-indigo-600">Activity center</p><h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Notifications</h1><p className="mt-1 text-sm text-slate-500">Stay informed about project and task activity.</p></div><button className="btn-secondary" onClick={all} disabled={!unread}>Mark all as read</button></div>
    {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
    <div className="card p-0"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="font-bold text-slate-900">Recent activity</h2><span className="badge badge-blue">{unread} unread</span></div>{loading ? <div className="p-10 text-center text-sm text-slate-500">Loading notifications...</div> : items.length ? <div className="divide-y divide-slate-100">{items.map(n => <div className={`flex flex-col justify-between gap-4 px-5 py-5 transition sm:flex-row sm:items-center sm:px-6 ${n.read ? 'bg-white' : 'bg-indigo-50/50'}`} key={n._id}><div className="flex gap-3"><div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${n.read ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-600'}`}>•</div><div><b className="block text-sm text-slate-800">{n.message}</b><small className="mt-1 block text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</small></div></div>{!n.read && <button className="btn-secondary min-h-9 self-start px-3 py-1.5 text-xs sm:self-auto" onClick={() => read(n._id)}>Mark read</button>}</div>)}</div> : <div className="p-12 text-center"><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">✓</div><h3 className="font-semibold text-slate-800">No notifications</h3><p className="mt-1 text-sm text-slate-500">You're all caught up.</p></div>}</div>
  </section>;
}
