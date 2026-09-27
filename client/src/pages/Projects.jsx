import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../api.js';
import { projectsLoading, setProjects, setProjectsError } from '../store.js';

const projectSchema = z.object({
  name: z.string().trim().min(2, 'Project name must be at least 2 characters.').max(120, 'Project name is too long.'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters.').max(1000, 'Description is too long.'),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  startDate: z.string().min(1, 'Start date is required.'),
  dueDate: z.string().min(1, 'Due date is required.')
}).refine(v => new Date(v.dueDate) >= new Date(v.startDate), {
  path: ['dueDate'], message: 'Due date must be on or after start date.'
});

const emptyForm = { name: '', description: '', status: 'PLANNING', priority: 'MEDIUM', startDate: '', dueDate: '' };

export default function Projects() {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const { items: projects, loading } = useSelector(s => s.projects);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState(null);
  const [editId, setEditId] = useState(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: emptyForm
  });

  const load = async () => {
    dispatch(projectsLoading(true));
    try {
      const r = await api.get('/projects');
      dispatch(setProjects(r.data.projects || []));
    } catch (e) {
      const message = e.response?.data?.message || 'Unable to load projects.';
      dispatch(setProjectsError(message));
      setError(message);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async form => {
    setSaving(true); setError(''); setNotice('');
    try {
      await api.post('/projects', form);
      reset(emptyForm);
      setNotice('Project created successfully.');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Create failed.');
    } finally { setSaving(false); }
  };

  const beginEdit = project => {
    setEditId(project._id);
    reset({
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate?.slice(0, 10) || '',
      dueDate: project.dueDate?.slice(0, 10) || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveEdit = async form => {
    setSaving(true); setError(''); setNotice('');
    try {
      await api.put(`/projects/${editId}`, form);
      setEditId(null);
      reset(emptyForm);
      setNotice('Project updated successfully.');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Update failed.');
    } finally { setSaving(false); }
  };

  const deleteProject = async id => {
    if (!window.confirm('Delete this project and all of its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      if (selected?._id === id) setSelected(null);
      setNotice('Project deleted successfully.');
      await load();
    } catch (e) { setError(e.response?.data?.message || 'Delete failed.'); }
  };

  const archiveProject = async id => {
    if (!window.confirm('Archive this project?')) return;
    try {
      await api.patch(`/projects/${id}/archive`);
      setNotice('Project archived.');
      await load();
    } catch (e) { setError(e.response?.data?.message || 'Archive failed.'); }
  };

  const openDetails = async project => {
    setError('');
    try {
      const r = await api.get(`/projects/${project._id}`);
      setSelected(r.data);
    } catch (e) { setError(e.response?.data?.message || 'Unable to load project details.'); }
  };

  const addMember = async projectId => {
    const email = memberEmail.trim();
    if (!email) { setError('Enter a member email first.'); return; }
    try {
      await api.post(`/projects/${projectId}/members`, { email });
      setMemberEmail('');
      setNotice('Member added successfully.');
      await load();
      if (selected?._id === projectId) await openDetails(projects.find(p => p._id === projectId) || { _id: projectId });
    } catch (e) { setError(e.response?.data?.message || 'Unable to add member.'); }
  };

  const removeMember = async (projectId, userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/projects/${projectId}/members`, { data: { userId } });
      setNotice('Member removed.');
      await load();
      if (selected?._id === projectId) await openDetails({ _id: projectId });
    } catch (e) { setError(e.response?.data?.message || 'Unable to remove member.'); }
  };

  const isOwner = p => user?.role === 'ADMIN' || p.owner?._id === user?.id;

  return <section className="page-shell">
    <div className="mb-7"><p className="mb-1 text-sm font-semibold text-indigo-600">Workspace</p><h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Projects</h1><p className="mt-1 text-sm text-slate-500">Create projects, manage members and track project work.</p></div>
    {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
    {notice && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</div>}

    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <form className="card h-fit lg:sticky lg:top-24" onSubmit={handleSubmit(editId ? saveEdit : create)}>
        <div className="mb-5"><h2 className="text-lg font-bold text-slate-950">{editId ? 'Edit project' : 'Create project'}</h2><p className="mt-1 text-xs text-slate-500">{editId ? 'Update the project settings.' : 'Set the project details and timeline.'}</p></div>
        <div className="space-y-4">
          <div><label className="label">Project name</label><input className="input" {...register('name')} placeholder="e.g. Website Redesign" />{errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}</div>
          <div><label className="label">Description</label><textarea className="input min-h-28" {...register('description')} placeholder="Describe the project..." />{errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}</div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Start date</label><input className="input" type="date" {...register('startDate')} />{errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate.message}</p>}</div><div><label className="label">Due date</label><input className="input" type="date" {...register('dueDate')} />{errors.dueDate && <p className="mt-1 text-xs text-red-600">{errors.dueDate.message}</p>}</div></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Status</label><select className="input" {...register('status')}><option>PLANNING</option><option>IN_PROGRESS</option><option>COMPLETED</option><option>ARCHIVED</option></select></div><div><label className="label">Priority</label><select className="input" {...register('priority')}><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></div></div>
          <div className="flex gap-2"><button disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : editId ? 'Save changes' : '+ Create Project'}</button>{editId && <button type="button" className="btn-secondary" onClick={() => { setEditId(null); reset(emptyForm); }}>Cancel</button>}</div>
        </div>
      </form>

      <div className="card">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-950">Projects</h2><p className="mt-1 text-xs text-slate-500">{projects.length} project{projects.length === 1 ? '' : 's'} available</p></div></div>
        {loading && <p className="mb-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Loading projects...</p>}
        {!loading && projects.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><h3 className="font-semibold text-slate-800">No projects yet</h3><p className="mt-1 text-sm text-slate-500">Create your first project using the form.</p></div>}
        <div className="space-y-3">
          {projects.map(p => <article className="rounded-2xl border border-slate-200 p-5 transition hover:border-indigo-200 hover:shadow-sm" key={p._id}>
            <div className="flex flex-col justify-between gap-4 xl:flex-row">
              <div className="min-w-0"><h3 className="text-base font-bold text-slate-900">{p.name}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{p.description}</p><div className="mt-3 flex flex-wrap gap-2"><span className={`badge ${p.status === 'COMPLETED' ? 'badge-green' : p.status === 'IN_PROGRESS' ? 'badge-blue' : p.status === 'ARCHIVED' ? 'badge-orange' : 'badge-neutral'}`}>{p.status.replace('_', ' ')}</span><span className={`badge ${p.priority === 'HIGH' ? 'badge-red' : p.priority === 'MEDIUM' ? 'badge-orange' : 'badge-neutral'}`}>{p.priority}</span><span className="badge badge-neutral">Members: {p.members?.length || 0}</span></div><p className="mt-2 text-xs text-slate-400">{p.startDate?.slice(0,10)} → {p.dueDate?.slice(0,10)} · Owner: {p.owner?.name}</p></div>
              <div className="flex shrink-0 flex-wrap items-center gap-2"><button className="btn-secondary min-h-9 px-3 py-1.5 text-xs" onClick={() => openDetails(p)}>Details</button>{isOwner(p) && <><button className="btn-secondary min-h-9 px-3 py-1.5 text-xs" onClick={() => beginEdit(p)}>Edit</button><button className="btn-secondary min-h-9 px-3 py-1.5 text-xs" onClick={() => archiveProject(p._id)} disabled={p.status === 'ARCHIVED'}>Archive</button><button className="btn-danger min-h-9 px-3 py-1.5 text-xs" onClick={() => deleteProject(p._id)}>Delete</button></>}</div>
            </div>
            {isOwner(p) && <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row"><input className="input flex-1" placeholder="Member email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} /><button className="btn-primary" onClick={() => addMember(p._id)}>+ Add member</button></div>}
          </article>)}
        </div>
      </div>
    </div>

    {selected && <div className="mt-5 card"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-indigo-600">Project details</p><h2 className="text-2xl font-extrabold text-slate-950">{selected.project.name}</h2><p className="mt-1 text-sm text-slate-500">{selected.project.description}</p></div><button className="btn-secondary" onClick={() => setSelected(null)}>Close</button></div><div className="mt-6 grid gap-5 md:grid-cols-2"><div><h3 className="mb-3 font-bold">Members</h3><div className="space-y-2">{selected.project.members?.length ? selected.project.members.map(m => <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3" key={m._id}><span className="text-sm">{m.name} <span className="text-slate-400">({m.email})</span></span>{isOwner(selected.project) && <button className="text-xs font-semibold text-red-600" onClick={() => removeMember(selected.project._id, m._id)}>Remove</button>}</div>) : <p className="text-sm text-slate-500">No additional members.</p>}</div></div><div><h3 className="mb-3 font-bold">Project tasks</h3><div className="space-y-2">{selected.tasks?.length ? selected.tasks.map(t => <div className="rounded-xl border border-slate-100 p-3" key={t._id}><div className="flex justify-between gap-3"><b className="text-sm">{t.title}</b><span className="badge badge-neutral">{t.status.replace('_',' ')}</span></div><p className="mt-1 text-xs text-slate-500">{t.assignedUser?.name || 'Unassigned'} · Due {new Date(t.dueDate).toLocaleDateString()}</p></div>) : <p className="text-sm text-slate-500">No tasks in this project.</p>}</div></div></div></div>}
  </section>;
}
