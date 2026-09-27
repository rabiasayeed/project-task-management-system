import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';

const labels = { totalProjects: 'Total Projects', activeProjects: 'Active Projects', completedProjects: 'Completed Projects', totalTasks: 'Total Tasks', pendingTasks: 'Pending Tasks', completedTasks: 'Completed Tasks', overdueTasks: 'Overdue Tasks', highPriorityTasks: 'High Priority Tasks' };
const icons = { totalProjects: '◈', activeProjects: '↗', completedProjects: '✓', totalTasks: '☷', pendingTasks: '◷', completedTasks: '✓', overdueTasks: '!', highPriorityTasks: '!' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(e => setError(e.response?.data?.message || 'Unable to load dashboard.')).finally(() => setLoading(false));
  }, []);

  if (error) return <section className="page-shell"><div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">{error}</div></section>;
  if (loading || !data) return <section className="page-shell"><div className="grid min-h-64 place-items-center rounded-2xl border border-slate-200 bg-white"><div className="text-center"><div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"/><p className="text-sm text-slate-500">Loading dashboard...</p></div></div></section>;

  const s = data.stats;
  const cardLinks = { totalProjects: '/projects', activeProjects: '/projects', completedProjects: '/projects', totalTasks: '/tasks', pendingTasks: '/tasks?pending=true', completedTasks: '/tasks?status=COMPLETED', overdueTasks: '/tasks?overdue=true', highPriorityTasks: '/tasks?priority=HIGH' };

  return <section className="page-shell">
    <div className="mb-7"><p className="mb-1 text-sm font-semibold text-indigo-600">Workspace overview</p><h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Dashboard</h1><p className="mt-1 text-sm text-slate-500">Monitor projects, tasks and progress at a glance.</p></div>
    <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(s).map(([k, v]) => <Link to={cardLinks[k] || '/'} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-soft" key={k}><div className="mb-4 flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 font-bold text-indigo-600">{icons[k] || '•'}</span><span className="text-xs font-medium text-slate-400">View</span></div><strong className="block text-3xl font-extrabold text-slate-950">{v}</strong><span className="mt-1 block text-sm font-medium text-slate-500">{labels[k] || k}</span></Link>)}</div>
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="card"><div className="mb-6"><h2 className="text-lg font-bold text-slate-950">Project progress</h2><p className="mt-1 text-xs text-slate-500">Completion is calculated dynamically from tasks.</p></div>{data.progress.length ? <div className="space-y-6">{data.progress.map(p => <div key={p.projectId}><div className="mb-2 flex items-center justify-between gap-4"><b className="truncate text-sm text-slate-800">{p.name}</b><span className="shrink-0 text-xs font-semibold text-slate-500">{p.completed}/{p.total} · {p.progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-violet-500 to-cyan-500 transition-all" style={{ width: `${p.progress}%` }}/></div></div>)}</div> : <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No projects found.</p>}</div>
      <div className="card"><div className="mb-6"><h2 className="text-lg font-bold text-slate-950">Overdue tasks</h2><p className="mt-1 text-xs text-slate-500">Due date has passed and the task is not completed.</p></div>{data.overdue.length ? <div className="divide-y divide-slate-100">{data.overdue.map(t => <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0" key={t._id}><div className="min-w-0"><b className="block truncate text-sm text-slate-800">{t.title}</b><span className="text-xs text-slate-500">{t.project?.name || 'Project'}</span></div><span className="badge badge-red shrink-0">Overdue</span></div>)}</div> : <p className="rounded-xl bg-emerald-50 p-5 text-sm font-medium text-emerald-700">No overdue tasks. Great work!</p>}</div>
    </div>
  </section>;
}
