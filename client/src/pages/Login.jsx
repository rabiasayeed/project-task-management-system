import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { setAuth } from '../store.js';
import api from '../api.js';

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.')
});

export default function Login() {
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const submit = async form => {
    setApiError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      dispatch(setAuth(data));
      navigate('/');
    } catch (e) {
      setApiError(e.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 px-4 py-10 sm:grid sm:place-items-center">
    <div className="mx-auto w-full max-w-md">
      <div className="mb-7 text-center text-white"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 text-xl font-extrabold shadow-xl shadow-indigo-500/25">P</div><h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1><p className="mt-2 text-sm text-slate-300">Sign in to your ProjectFlow workspace.</p></div>
      <form className="rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8" onSubmit={handleSubmit(submit)}>
        {apiError && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{apiError}</div>}
        <div className="space-y-5">
          <div><label className="label">Email</label><input className="input" placeholder="you@example.com" type="email" {...register('email')} />{errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}</div>
          <div><label className="label">Password</label><input className="input" placeholder="Enter your password" type="password" {...register('password')} />{errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}</div>
          <button disabled={loading} className="btn-primary w-full">{loading ? 'Signing in...' : 'Sign in'}</button>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">New user? <Link className="font-semibold text-indigo-600 hover:text-violet-700" to="/register">Create an account</Link></p>
      </form>
    </div>
  </div>;
}
