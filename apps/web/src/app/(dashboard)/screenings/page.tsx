'use client';

import { errorMessage } from '@/lib/errors';
import type { Participant, Screening } from '@/types/api';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function ScreeningsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    participantId: '',
    cancerType: 'Cervical Cancer',
    result: 'Negative',
    riskScore: '',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');


  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        api.get('/participants'),
        api.get('/reports/export'),
      ]);
      setParticipants(pRes.data);
      setScreenings(sRes.data);
      if (pRes.data.length > 0) {
        setFormData(prev => ({ ...prev, participantId: pRes.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch screening data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await api.post('/screenings', formData);
      setMessage('Screening recorded successfully!');
      fetchData();
    } catch (err) {
      setMessage(errorMessage(err, 'Failed to record screening.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--primary)]">Screening Registry & Assessment</h1>
        <p className="text-[var(--on-surface-variant)] text-xs mt-1">Record screening results and compute automatic clinical risk scores.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="clinical-card lg:col-span-1 space-y-4">
          <h2 className="text-base font-bold text-[var(--primary)] border-b border-[var(--outline)] pb-2">➕ Record New Screening</h2>

          {message && (
            <div className={`p-3 rounded text-xs font-semibold ${message.includes('success') ? 'bg-[var(--risk-low-bg)] text-[var(--risk-low-text)]' : 'bg-[var(--risk-high-bg)] text-[var(--risk-high-text)]'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[var(--on-background)] mb-1">Select Participant *</label>
              <select
                name="participantId"
                value={formData.participantId}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)]"
                required
              >
                {participants.length === 0 ? (
                  <option value="">No participants registered yet</option>
                ) : (
                  participants.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.registrationId ?? p.nationalId ?? '—'})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[var(--on-background)] mb-1">Cancer Screening Type *</label>
              <select
                name="cancerType"
                value={formData.cancerType}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)]"
                required
              >
                <option value="Cervical Cancer">Cervical Cancer (VIA / Pap)</option>
                <option value="Breast Cancer">Breast Cancer (CBE / Mammogram)</option>
                <option value="Prostate Cancer">Prostate Cancer (PSA)</option>
                <option value="Colorectal Cancer">Colorectal Cancer</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[var(--on-background)] mb-1">Screening Result *</label>
              <select
                name="result"
                value={formData.result}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)]"
                required
              >
                <option value="Negative">Negative (Normal)</option>
                <option value="Suspicious">Suspicious (Requires Biopsy)</option>
                <option value="Positive (VIA+)">Positive (VIA+)</option>
                <option value="Positive (Stage 1)">Positive (Stage 1)</option>
                <option value="Positive (Stage 2)">Positive (Stage 2)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[var(--on-background)] mb-1">Override Risk Score (Optional, 0.0 - 10.0)</label>
              <input
                type="number"
                step="0.1"
                name="riskScore"
                value={formData.riskScore}
                onChange={handleChange}
                placeholder="Auto-calculated if left blank"
                className="w-full px-3 py-2 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)]"
              />
            </div>

            <button
              type="submit"
              disabled={saving || participants.length === 0}
              className="w-full btn-primary text-xs mt-2 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & Calculate Risk'}
            </button>
          </form>
        </div>

        {/* Data Table Card */}
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden lg:col-span-2">
          <div className="p-4 border-b border-[var(--outline)] flex justify-between items-center bg-[var(--background)]">
            <h2 className="font-bold text-[var(--primary)] text-sm">📋 Recent Screening Records</h2>
            <span className="text-xs text-[var(--muted)] font-mono tabular-nums">{screenings.length} Total</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-[var(--muted)] text-xs">Loading screening records...</div>
          ) : screenings.length === 0 ? (
            <div className="p-8 text-center text-[var(--muted)] text-xs">No screenings recorded yet.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                <tr>
                  <th className="p-3">Participant</th>
                  <th className="p-3">Cancer Type</th>
                  <th className="p-3">Result</th>
                  <th className="p-3">Risk Score</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
                {screenings.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--primary-surface)]">
                    <td className="p-3 font-bold text-[var(--primary)]">
                      {s.participant ? `${s.participant.firstName} ${s.participant.lastName}` : "Unknown"}
                      <div className="text-[10px] text-[var(--muted)] font-mono tabular-nums">{s.participant?.registrationId ?? "—"}</div>
                    </td>
                    <td className="p-3">{s.cancerType}</td>
                    <td className="p-3">
                      <span className={s.result?.toLowerCase().includes('positive') ? 'badge-high-risk' : s.result?.toLowerCase().includes('suspicious') ? 'badge-mod-risk' : 'badge-low-risk'}>
                        {s.result}
                      </span>
                    </td>
                    <td className="p-3 font-bold tabular-nums text-[var(--primary)]">{s.riskScore ?? 'N/A'}</td>
                    <td className="p-3 text-[var(--muted)] tabular-nums">{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
