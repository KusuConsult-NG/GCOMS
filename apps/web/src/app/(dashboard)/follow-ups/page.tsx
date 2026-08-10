'use client';

import { errorMessage } from '@/lib/errors';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface FollowUp {
  id: string;
  scheduledDate: string;
  status: string;
  notes: string | null;
  participant: { firstName: string; lastName: string; registrationId: string; nationalId: string | null; phoneNumber: string | null };
  clinician: { firstName: string; lastName: string; role: string };
}

interface Stats {
  scheduled: number;
  completed: number;
  missed: number;
  cancelled: number;
  upcoming: number;
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-[var(--muted)]',
  MISSED: 'bg-red-100 text-red-700',
};

export default function FollowUpPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [missed, setMissed] = useState<FollowUp[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'missed'>('all');
  const [filterStatus, setFilterStatus] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ participantId: '', clinicianId: '', scheduledDate: '', notes: '' });
  const [formMsg, setFormMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);


  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [fuRes, missedRes, statsRes] = await Promise.all([
        api.get('/follow-ups', { params: { status: filterStatus || undefined } }),
        api.get('/follow-ups/missed'),
        api.get('/follow-ups/dashboard-stats'),
      ]);
      setFollowUps(fuRes.data);
      setMissed(missedRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load follow-ups', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api.patch(`/follow-ups/${id}/status`, { status });
      fetchAll();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg('');
    try {
      await api.post('/follow-ups', form);
      setFormMsg('Follow-up scheduled successfully!');
      setForm({ participantId: '', clinicianId: '', scheduledDate: '', notes: '' });
      fetchAll();
      setTimeout(() => setShowForm(false), 1500);
    } catch (err) {
      setFormMsg(errorMessage(err, 'Failed to schedule follow-up.'));
    } finally {
      setSubmitting(false);
    }
  };

  const displayList = activeTab === 'missed' ? missed : followUps;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--on-background)]">Follow-Up Management</h1>
          <p className="text-[var(--muted)] mt-1 text-sm">Track, schedule, and manage all patient follow-ups across the programme.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-[var(--secondary)] px-4 py-2.5 text-sm font-semibold text-[var(--on-secondary)] transition hover:bg-[var(--secondary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          + Schedule Follow-up
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Scheduled', value: stats.scheduled, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Upcoming (7d)', value: stats.upcoming, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Completed', value: stats.completed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Missed', value: stats.missed, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Cancelled', value: stats.cancelled, color: 'text-[var(--muted)]', bg: 'bg-slate-50' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} p-4 rounded-2xl border border-slate-100`}>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-[var(--muted)] mt-1 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Form Modal */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Schedule New Follow-Up</h2>
          {formMsg && (
            <div className={`p-3 rounded-lg mb-4 text-sm ${formMsg.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {formMsg}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Participant ID (UUID)</label>
              <input
                type="text"
                value={form.participantId}
                onChange={e => setForm({ ...form, participantId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="Enter participant UUID"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Clinician ID (UUID)</label>
              <input
                type="text"
                value={form.clinicianId}
                onChange={e => setForm({ ...form, clinicianId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="Leave blank to assign to self"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                value={form.scheduledDate}
                onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Notes (Optional)</label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="Any additional notes..."
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg text-sm"
              >
                {submitting ? 'Scheduling...' : 'Schedule Follow-Up'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs & Filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['all', 'upcoming', 'missed'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as Parameters<typeof setActiveTab>[0])}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-[var(--secondary)] text-[var(--on-secondary)]'
                  : 'bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-dim)]'
              }`}
            >
              {tab === 'missed' ? `Missed (${stats?.missed || 0})` : tab === 'upcoming' ? `Upcoming (${stats?.upcoming || 0})` : 'All Follow-ups'}
            </button>
          ))}
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[var(--muted)] text-sm">Loading follow-ups...</div>
        ) : displayList.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted)] text-sm">No follow-ups found.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[var(--muted)] uppercase font-semibold">
              <tr>
                <th className="p-4">Patient</th>
                <th className="p-4">Clinician</th>
                <th className="p-4">Scheduled Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Notes</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayList.map(fu => (
                <tr key={fu.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div className="font-bold text-[var(--on-background)]">{fu.participant?.firstName} {fu.participant?.lastName}</div>
                    <div className="text-[var(--muted)] font-mono">{fu.participant?.registrationId ?? fu.participant?.nationalId ?? '—'}</div>
                  </td>
                  <td className="p-4">{fu.clinician?.firstName} {fu.clinician?.lastName}</td>
                  <td className="p-4 font-mono">{new Date(fu.scheduledDate).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_COLORS[fu.status] || 'bg-slate-100 text-[var(--muted)]'}`}>
                      {fu.status}
                    </span>
                  </td>
                  <td className="p-4 text-[var(--muted)] max-w-[200px] truncate">{fu.notes || '—'}</td>
                  <td className="p-4">
                    {fu.status === 'SCHEDULED' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStatusUpdate(fu.id, 'COMPLETED')}
                          className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold hover:bg-emerald-200"
                        >
                          ✓ Complete
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(fu.id, 'CANCELLED')}
                          className="px-2 py-1 bg-red-100 text-red-600 rounded text-[10px] font-bold hover:bg-red-200"
                        >
                          ✗ Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
