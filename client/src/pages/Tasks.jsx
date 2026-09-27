import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../api.js';
import { setTasks, updateTask, tasksLoading, setTasksError, setProjects } from '../store.js';

const taskSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters.').max(150, 'Title is too long.'),
  description: z.string().trim().min(5, 'Description must be at least 5 characters.').max(1000, 'Description is too long.'),
  project: z.string().min(1, 'Select a project.'),
  assignedUser: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  dueDate: z.string().min(1, 'Due date is required.')
});

const emptyTask = { title: '', description: '', project: '', assignedUser: '', priority: 'MEDIUM', dueDate: '' };

export default function Tasks() {
  const dispatch = useDispatch();
  const { items, pagination, loading } = useSelector(s => s.tasks);
  const currentUser = useSelector(s => s.auth.user);
  const projects = useSelector(s => s.projects.items);
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({ search: searchParams.get('search') || '', status: searchParams.get('status') || '', priority: searchParams.get('priority') || '', assignedUser: searchParams.get('assignedUser') || '', dueAfter: searchParams.get('dueAfter') || '', dueBefore: searchParams.get('dueBefore') || '', pending: searchParams.get('pending') || '', overdue: searchParams.get('overdue') || '', sort: searchParams.get('sort') || 'createdAt', order: searchParams.get('order') || 'desc', page: 1 }));
  const [users, setUsers] = useState([]);
  const filterUsers = Array.from(new Map(projects.flatMap(p => [...(p.members || []), p.owner].filter(Boolean)).map(u => [u._id, u])).values());
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: emptyTask
  });
  const selectedProjectId = watch('project');

  const loadTasks = async () => {
    dispatch(tasksLoading(true));
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => { if (value !== '' && value !== undefined) params.append(key, value); });
      params.set('limit', '8');
      const response = await api.get(`/tasks?${params.toString()}`);
      dispatch(setTasks(response.data));
    } catch (e) {
      const message = e.response?.data?.message || 'Unable to load tasks.';
      dispatch(setTasksError(message));
      setError(message);
    }
  };

  useEffect(() => { loadTasks(); }, [filters.search, filters.status, filters.priority, filters.assignedUser, filters.dueAfter, filters.dueBefore, filters.pending, filters.overdue, filters.sort, filters.order, filters.page]);

  useEffect(() => {
    if (!projects.length) {
      api.get('/projects').then(r => dispatch(setProjects(r.data.projects || []))).catch(() => {});
    }
  }, [projects.length, dispatch]);

  useEffect(() => {
    if (!selectedProjectId) { setUsers([]); return; }
    const loadAssignableUsers = async () => {
      try {
        if (currentUser?.role === 'ADMIN') {
          const r = await api.get('/users');
          setUsers(r.data.users || []);
        } else {
          const r = await api.get(`/projects/${selectedProjectId}`);
          const p = r.data.project;
          const members = [...(p.members || []), p.owner].filter(Boolean);
          const unique = members.filter((u, i, arr) => arr.findIndex(x => x._id === u._id) === i);
          setUsers(unique);
        }
      } catch { setUsers([]); }
    };
    loadAssignableUsers();
  }, [selectedProjectId, currentUser?.role]);

  const createTask = async form => {
    setSaving(true); setError(''); setNotice('');
    try {
      await api.post('/tasks', { ...form, assignedUser: form.assignedUser || null });
      reset({ ...emptyTask, project: form.project });
      setNotice('Task created successfully.');
      await loadTasks();
    } catch (e) { setError(e.response?.data?.message || 'Create task failed.'); }
    finally { setSaving(false); }
  };

  const statusChange = async (task, status) => {
    const oldTask = { ...task };
    dispatch(updateTask({ ...task, status }));
    setError(''); setNotice('');
    try {
      const r = await api.put(`/tasks/${task._id}`, { status });
      dispatch(updateTask(r.data.task));
      setNotice('Task status updated.');
    } catch (e) {
      dispatch(updateTask(oldTask));
      setError(e.response?.data?.message || 'Update failed; previous task state restored.');
    }
  };

  const deleteTask = async task => {
    if (!window.confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${task._id}`); setNotice('Task deleted.'); await loadTasks(); }
    catch (e) { setError(e.response?.data?.message || 'Delete failed.'); }
  };

  const setFilter = (name, value) => setFilters(old => ({ ...old, [name]: value, page: 1 }));

  return <section className="page-shell">
    <div className="mb-7"><p className="mb-1 text-sm font-semibold text-indigo-600">Work management</p><h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Tasks</h1><p className="mt-1 text-sm text-slate-500">Search, filter, sort, create and update project tasks.</p></div>
    {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
    {notice && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</div>}

    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <input className="input" placeholder="Search task title..." value={filters.search} onChange={e => setFilter('search', e.target.value)} />
      <select className="input" value={filters.status} onChange={e => setFilter('status', e.target.value)}><option value="">All statuses</option><option>TODO</option><option>IN_PROGRESS</option><option>REVIEW</option><option>COMPLETED</option></select>
      <select className="input" value={filters.priority} onChange={e => setFilter('priority', e.target.value)}><option value="">All priorities</option><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select>
      <select className="input" value={filters.assignedUser} onChange={e => setFilter('assignedUser', e.target.value)}><option value="">All assigned users</option>{filterUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}</select>
      <div><label className="label">Due date from</label><input className="input" type="date" value={filters.dueAfter} onChange={e => setFilter('dueAfter', e.target.value)} /></div>
      <div><label className="label">Due date to</label><input className="input" type="date" value={filters.dueBefore} onChange={e => setFilter('dueBefore', e.target.value)} /></div>
      <select className="input" value={filters.sort} onChange={e => setFilter('sort', e.target.value)}><option value="createdAt">Sort: Created</option><option value="priority">Sort: Priority</option><option value="dueDate">Sort: Due date</option></select>
      <select className="input" value={filters.order} onChange={e => setFilter('order', e.target.value)}><option value="desc">Newest / latest</option><option value="asc">Oldest / earliest</option></select>
    </div></div>

    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <form className="card h-fit lg:sticky lg:top-24" onSubmit={handleSubmit(createTask)}>
        <div className="mb-5"><h2 className="text-lg font-bold text-slate-950">Create task</h2><p className="mt-1 text-xs text-slate-500">Members can create tasks inside projects they belong to.</p></div>
        <div className="space-y-4">
          <div><label className="label">Task title</label><input className="input" placeholder="e.g. Build login page" {...register('title')} />{errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}</div>
          <div><label className="label">Description</label><textarea className="input min-h-24" placeholder="What needs to be done?" {...register('description')} />{errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}</div>
          <div><label className="label">Project</label><select className="input" {...register('project')}><option value="">Select project</option>{projects.map(p => <option value={p._id} key={p._id}>{p.name}</option>)}</select>{errors.project && <p className="mt-1 text-xs text-red-600">{errors.project.message}</p>}</div>
          <div><label className="label">Assigned user</label><select className="input" {...register('assignedUser')}><option value="">Unassigned</option>{users.map(u => <option value={u._id} key={u._id}>{u.name} ({u.email})</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Priority</label><select className="input" {...register('priority')}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></div><div><label className="label">Due date</label><input className="input" type="date" {...register('dueDate')} />{errors.dueDate && <p className="mt-1 text-xs text-red-600">{errors.dueDate.message}</p>}</div></div>
          <button disabled={saving} className="btn-primary w-full">{saving ? 'Creating...' : '+ Create Task'}</button>
        </div>
      </form>

      <div className="card"><div className="mb-5 flex items-end justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-950">Task list</h2><p className="mt-1 text-xs text-slate-500">{pagination.totalRecords || 0} total records</p></div></div>
        {loading && <div className="mb-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Loading tasks...</div>}
        {!loading && items.length > 0 ? <div className="space-y-3">{items.map(t => <article className="rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:shadow-sm" key={t._id}><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><b className="text-sm text-slate-900">{t.title}</b><span className={`badge ${t.status === 'COMPLETED' ? 'badge-green' : t.status === 'IN_PROGRESS' ? 'badge-blue' : t.status === 'REVIEW' ? 'badge-orange' : 'badge-neutral'}`}>{t.status.replace('_', ' ')}</span><span className={`badge ${t.priority === 'CRITICAL' || t.priority === 'HIGH' ? 'badge-red' : t.priority === 'MEDIUM' ? 'badge-orange' : 'badge-neutral'}`}>{t.priority}</span>{t.isOverdue && <span className="badge badge-red">OVERDUE</span>}</div><p className="mt-2 text-sm text-slate-500">{t.description}</p><small className="mt-2 block text-xs text-slate-400">{t.project?.name || 'Project'} · Assigned: {t.assignedUser?.name || 'Unassigned'} · Due: {new Date(t.dueDate).toLocaleDateString()}</small></div><div className="flex shrink-0 gap-2"><select className="input min-w-36 py-2 text-xs" value={t.status} onChange={e => statusChange(t, e.target.value)}><option>TODO</option><option>IN_PROGRESS</option><option>REVIEW</option><option>COMPLETED</option></select>{(currentUser?.role === 'ADMIN' || String(t.project?.owner) === String(currentUser?.id)) && <button type="button" className="btn-danger min-h-9 px-3 py-1.5 text-xs" onClick={() => deleteTask(t)}>Delete</button>}</div></div></article>)}</div> : !loading && <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><h3 className="font-semibold text-slate-800">No tasks found</h3><p className="mt-1 text-sm text-slate-500">Try changing your filters or create a new task.</p></div>}
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-slate-500">Page {pagination.page || 1} of {pagination.totalPages || 1} · {pagination.totalRecords || 0} records</span><div className="flex gap-2"><button type="button" className="btn-secondary min-h-9 px-3 text-xs" disabled={(pagination.page || 1) <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>Previous</button><button type="button" className="btn-secondary min-h-9 px-3 text-xs" disabled={(pagination.page || 1) >= (pagination.totalPages || 1)} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next</button></div></div>
      </div>
    </div>
  </section>;
}
