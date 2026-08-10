'use client';

import { errorMessage } from '@/lib/errors';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

interface SystemConfig {
  key: string;
  value: string;
  updatedAt: string;
}

export default function SystemAdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.role !== 'EXECUTIVE' && user.role !== 'SYSTEM_ADMIN') {
      router.push('/');
      return;
    }

    const fetchConfigs = async () => {
      try {
        const res = await api.get('/system-admin/config');
        setConfigs(res.data);
      } catch (err) {
        console.error('Failed to fetch configs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfigs();
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/system-admin/config', { key, value });
      setConfigs([...configs.filter(c => c.key !== key), res.data]);
      setSuccess('Configuration updated successfully.');
      setKey('');
      setValue('');
    } catch (err) {
      setError(errorMessage(err, 'Update failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[var(--muted)]">Loading System Config...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--on-background)]">System Admin Control Panel</h1>
        <p className="text-slate-600 mt-1">Manage global application settings and maintenance overrides.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Set Configuration Variable</h2>
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-medium border border-emerald-100">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Config Key</label>
              <input
                type="text"
                required
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[var(--on-background)] font-mono text-sm"
                placeholder="e.g. MAINTENANCE_MODE"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Config Value</label>
              <input
                type="text"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[var(--on-background)]"
                placeholder="e.g. true"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 mt-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-all shadow-sm disabled:opacity-70"
            >
              {submitting ? 'Applying...' : 'Apply Configuration'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Active Configurations</h2>
          
          {configs.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No custom configurations applied.</p>
          ) : (
            <div className="space-y-2">
              {configs.map((config) => (
                <div key={config.key} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="font-mono text-sm font-semibold text-slate-800">
                    {config.key}
                  </div>
                  <div className="text-sm text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                    {config.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
