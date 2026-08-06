'use client';

import { errorMessage } from '@/lib/errors';
import type { StrategicGoal } from '@/types/api';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function StrategyDashboard() {
  const { user } = useAuthStore();
  const [goals, setGoals] = useState<StrategicGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const [newGoal, setNewGoal] = useState({
    title: '',
    targetMetric: '',
    deadline: '',
  });
  const [message, setMessage] = useState('');


  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/strategy/goals');
      setGoals(res.data);
    } catch (err) {
      console.error('Failed to load strategic goals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/strategy/goals', {
        ...newGoal,
        targetMetric: Number(newGoal.targetMetric),
      });
      setMessage('Strategic OKR goal created successfully.');
      fetchGoals();
      setNewGoal({ title: '', targetMetric: '', deadline: '' });
    } catch (err) {
      setMessage(errorMessage(err, 'Failed to create goal.'));
    }
  };

  const handleUpdate = async (id: string, currentMetric: number) => {
    const newVal = prompt('Update current progress metric:', currentMetric.toString());
    if (newVal !== null) {
      try {
        await api.patch(`/strategy/goals/${id}`, { currentMetric: Number(newVal) });
        fetchGoals();
      } catch (err) {
        alert('Failed to update progress metric.');
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-[var(--muted)]">Loading strategic OKR goals...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--primary)]">Strategy & Organizational OKRs</h1>
        <p className="text-[var(--on-surface-variant)] text-xs mt-1">Track key performance indicators, strategic objectives, and foundation goals.</p>
      </div>

      {message && (
        <div className="p-3 bg-[var(--risk-low-bg)] text-[var(--risk-low-text)] rounded text-xs font-semibold">
          {message}
        </div>
      )}

      {/* Goal Creation Card */}
      {(user?.role === 'EXECUTIVE' || user?.role === 'SYSTEM_ADMIN' || user?.role === 'BOARD') && (
        <div className="clinical-card space-y-4">
          <h2 className="text-base font-bold text-[var(--primary)] border-b border-[var(--outline)] pb-2">🎯 Set New Strategic OKR Goal</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs items-end">
            <div className="md:col-span-2">
              <label className="block font-semibold text-[var(--on-background)] mb-1">Strategic Objective / Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Screen 10,000 Women for Cervical Cancer across Plateau State"
                className="w-full px-3 py-2 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)]"
                value={newGoal.title}
                onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--on-background)] mb-1">Target Metric *</label>
              <input
                type="number"
                required
                placeholder="e.g. 10000"
                className="w-full px-3 py-2 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)] font-mono tabular-nums"
                value={newGoal.targetMetric}
                onChange={e => setNewGoal({ ...newGoal, targetMetric: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--on-background)] mb-1">Target Deadline *</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)] tabular-nums"
                value={newGoal.deadline}
                onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })}
              />
            </div>
            <div className="md:col-span-4 flex justify-end pt-2">
              <button type="submit" className="btn-primary text-xs">
                + Add Strategic OKR Goal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goal Cards Grid */}
      {goals.length === 0 ? (
        <div className="p-8 text-center text-xs text-[var(--muted)] bg-white rounded border border-[var(--outline)]">
          No strategic goals configured.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const progress = Math.min(((goal.currentMetric || 0) / (goal.targetMetric || 1)) * 100, 100);
            return (
              <div key={goal.id} className="clinical-card flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[var(--primary)] text-sm">{goal.title}</h3>
                    <span className={goal.status === 'COMPLETED' ? 'badge-low-risk' : goal.status === 'AT_RISK' ? 'badge-high-risk' : 'badge-mod-risk'}>
                      {goal.status}
                    </span>
                  </div>
                  <div className="space-y-1.5 mt-3">
                    <div className="flex justify-between text-xs text-[var(--on-surface-variant)] font-medium">
                      <span>Progress</span>
                      <span className="font-mono tabular-nums font-bold text-[var(--primary)]">{goal.currentMetric || 0} / {goal.targetMetric} ({progress.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-[var(--surface-subtle)] rounded-full h-2 overflow-hidden">
                      <div className="bg-[var(--secondary)] h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-[var(--outline)] pt-3 text-[var(--muted)]">
                  <span>Due: <span className="tabular-nums font-semibold">{new Date(goal.deadline).toLocaleDateString()}</span></span>
                  {(user?.role === 'EXECUTIVE' || user?.role === 'BOARD' || user?.role === 'SYSTEM_ADMIN') && (
                    <button
                      onClick={() => handleUpdate(goal.id, goal.currentMetric || 0)}
                      className="text-[var(--secondary)] hover:underline font-bold text-xs"
                    >
                      Update Metric ✏️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
