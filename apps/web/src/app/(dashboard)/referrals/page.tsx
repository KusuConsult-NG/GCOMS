'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [participantId, setParticipantId] = useState('');
  const [referredTo, setReferredTo] = useState('JUTH Oncology Department');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([
        api.get('/referrals'),
        api.get('/participants'),
      ]);
      setReferrals(rRes.data);
      setParticipants(pRes.data);
      if (pRes.data.length > 0) setParticipantId(pRes.data[0].id);
    } catch (err) {
      console.error('Failed to load referrals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/referrals', {
        participantId,
        referredTo,
        reason,
      });
      setShowModal(false);
      setReason('');
      fetchData();
    } catch (err) {
      console.error('Error creating referral', err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/referrals/${id}/status`, { status });
      fetchData();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#002045]">Referral Network</h1>
          <p className="text-[#43474e] text-xs mt-1">Coordinate patient transfers to partner tertiary hospitals & oncology units.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-xs flex items-center gap-1"
        >
          + Submit New Referral
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
              <h2 className="text-base font-bold text-[#002045]">Submit Hospital Referral</h2>
              <button onClick={() => setShowModal(false)} className="text-[#74777f] font-bold">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Select Patient *</label>
                <select
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs focus:border-[#13696a] outline-none text-[#0d1c2e]"
                  required
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.nationalId})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Referred Hospital / Unit *</label>
                <select
                  value={referredTo}
                  onChange={(e) => setReferredTo(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs focus:border-[#13696a] outline-none text-[#0d1c2e]"
                >
                  <option value="JUTH Oncology Department">Jos University Teaching Hospital (JUTH)</option>
                  <option value="Plateau State Specialist Hospital">Plateau State Specialist Hospital</option>
                  <option value="Bingham University Teaching Hospital">Bingham University Teaching Hospital</option>
                  <option value="Federal Medical Centre, Keffi">Federal Medical Centre, Keffi</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Clinical Notes & Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Suspicious lesion biopsy request / stage 2 evaluation..."
                  className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs focus:border-[#13696a] outline-none text-[#0d1c2e]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Referral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Total Referrals</span>
          <p className="text-3xl font-bold text-[#002045] mt-1 tabular-nums">{referrals.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Pending Confirmation</span>
          <p className="text-3xl font-bold text-[#92400e] mt-1 tabular-nums">{referrals.filter(r => r.status === 'PENDING').length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Completed Transfers</span>
          <p className="text-3xl font-bold text-[#22543d] mt-1 tabular-nums">{referrals.filter(r => r.status === 'COMPLETED').length}</p>
        </div>
      </div>

      {/* Referrals Directory Table */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#74777f]">Loading referral directory...</div>
        ) : referrals.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#74777f]">No referrals logged yet.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
              <tr>
                <th className="p-3">Patient Name</th>
                <th className="p-3">Referred To</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Referred By</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0d1c2e]">
              {referrals.map((r) => (
                <tr key={r.id} className="hover:bg-[#e5eeff]">
                  <td className="p-3 font-bold text-[#002045]">
                    {r.participant ? `${r.participant.firstName} ${r.participant.lastName}` : 'N/A'}
                    <div className="text-[10px] text-[#74777f] font-mono tabular-nums">{r.participant?.nationalId}</div>
                  </td>
                  <td className="p-3 font-semibold text-[#13696a]">{r.referredTo}</td>
                  <td className="p-3">{r.reason}</td>
                  <td className="p-3 text-[#43474e]">{r.referredBy ? `${r.referredBy.firstName} ${r.referredBy.lastName}` : 'System'}</td>
                  <td className="p-3 text-[#74777f] tabular-nums">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-1 rounded outline-none ${
                        r.status === 'COMPLETED' ? 'bg-[#c6f6d5] text-[#22543d]' : r.status === 'PENDING' ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#ffdad6] text-[#ba1a1a]'
                      }`}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="ACCEPTED">ACCEPTED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
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
