'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function GrantWorkspace({ user }: { user: any }) {
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    donorName: 'Global Fund for Health',
    amount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchGrants = async () => {
    setLoading(true);
    try {
      const res = await api.get('/grants');
      setGrants(res.data);
    } catch (err) {
      console.error('Failed to load grants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrants();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/grants', formData);
      setShowModal(false);
      setFormData({ title: '', donorName: 'Global Fund for Health', amount: '', startDate: new Date().toISOString().split('T')[0], endDate: '2026-12-31' });
      fetchGrants();
    } catch (err) {
      console.error('Failed to create grant', err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalFunding = grants.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[var(--nav-surface)] text-white p-5 rounded-lg border border-[var(--nav-surface-raised)] shadow-sm">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--secondary)] text-white uppercase">Grants & Donor Relations</span>
          <h1 className="text-2xl font-bold mt-1 text-white">Grant & Donor Officer Workspace</h1>
          <p className="text-xs text-slate-300">Donor databases, grant proposals, milestone tracking, compliance, and funding allocation.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs mt-3 md:mt-0">
          + Register New Grant Proposal
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Register Grant Opportunity / Award</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Grant Project Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Plateau State Rural Cervical Cancer Elimination Initiative"
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Donor Organization *</label>
                <select
                  value={formData.donorName}
                  onChange={e => setFormData({ ...formData, donorName: e.target.value })}
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                >
                  <option value="Global Fund for Health">Global Fund for Health</option>
                  <option value="World Health Organization (WHO)">World Health Organization (WHO)</option>
                  <option value="USAID Global Health Initiative">USAID Global Health Initiative</option>
                  <option value="Bill & Melinda Gates Foundation">Bill & Melinda Gates Foundation</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Total Grant Award (₦) *</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g. 50000000"
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">
                  {submitting ? 'Registering...' : 'Save Grant Award'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Total Active Grants</span>
          <p className="text-3xl font-bold text-[var(--primary)] mt-1 tabular-nums">{grants.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Total Grant Funding</span>
          <p className="text-3xl font-bold text-[var(--risk-low-text)] mt-1 tabular-nums">₦{totalFunding.toLocaleString()}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Active Donors</span>
          <p className="text-3xl font-bold text-[var(--secondary)] mt-1 tabular-nums">4</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Milestones Completed</span>
          <p className="text-3xl font-bold text-[var(--risk-mod-text)] mt-1 tabular-nums">14 / 16</p>
        </div>
      </div>

      {/* Grants Table */}
      <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
        <div className="p-4 border-b border-[var(--outline)] font-bold text-[var(--primary)] text-sm bg-[var(--background)]">
          📜 Registered Grant Awards & Pipeline
        </div>
        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--muted)]">Loading grants from database...</div>
        ) : grants.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--muted)]">No grants registered yet. Click "+ Register New Grant Proposal" to create one.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
              <tr>
                <th className="p-3">Grant Title</th>
                <th className="p-3">Donor Organization</th>
                <th className="p-3">Grant Amount</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
              {grants.map((g) => (
                <tr key={g.id} className="hover:bg-[var(--primary-surface)]">
                  <td className="p-3 font-bold text-[var(--primary)]">{g.title}</td>
                  <td className="p-3 text-[var(--secondary)] font-semibold">{g.donorName}</td>
                  <td className="p-3 font-bold font-mono tabular-nums text-[var(--primary)]">₦{Number(g.amount).toLocaleString()}</td>
                  <td className="p-3 text-[var(--muted)] tabular-nums">
                    {new Date(g.startDate).toLocaleDateString()} - {new Date(g.endDate).toLocaleDateString()}
                  </td>
                  <td className="p-3"><span className="badge-low-risk">{g.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
