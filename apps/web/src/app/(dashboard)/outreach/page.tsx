'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function OutreachPage() {
  const { user } = useAuthStore();
  const [outreaches, setOutreaches] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [locationId, setLocationId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SYSTEM_ADMIN' || user?.role === 'EXECUTIVE';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [oRes, lRes] = await Promise.all([
        api.get('/outreach'),
        api.get('/locations'),
      ]);
      setOutreaches(oRes.data);
      setLocations(lRes.data);
      if (lRes.data.length > 0) setLocationId(lRes.data[0].id);
    } catch (err) {
      console.error('Failed to load outreach campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSubmitting(true);
    try {
      await api.post('/outreach', {
        title,
        locationId: locationId || undefined,
        date,
      });
      setShowModal(false);
      setTitle('');
      fetchData();
    } catch (err) {
      console.error('Error creating outreach campaign', err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalAttendance = outreaches.reduce((sum, o) => sum + (o.attendance || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#002045]">Community Outreach Campaigns</h1>
          <p className="text-[#43474e] text-xs mt-1">Plan, coordinate, and execute field cancer screening drives across LGAs.</p>
        </div>
        
        {/* Only Admin can schedule an outreach */}
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary text-xs flex items-center gap-1"
          >
            + Schedule New Campaign
          </button>
        )}
      </div>

      {/* Modal - Admin Only */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
              <h2 className="text-base font-bold text-[#002045]">Schedule Outreach Campaign (Admin Only)</h2>
              <button onClick={() => setShowModal(false)} className="text-[#74777f] font-bold">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Barkin Ladi Cervical Cancer Screening Drive"
                  className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs focus:border-[#13696a] outline-none text-[#0d1c2e]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Target Community Location</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs focus:border-[#13696a] outline-none text-[#0d1c2e]"
                >
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.lga}, {l.state})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Event Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs focus:border-[#13696a] outline-none text-[#0d1c2e] tabular-nums"
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
                  {submitting ? 'Scheduling...' : 'Schedule Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Total Campaigns</span>
          <p className="text-2xl font-bold text-[#002045] mt-1 tabular-nums">{outreaches.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Total Attendance</span>
          <p className="text-2xl font-bold text-[#13696a] mt-1 tabular-nums">{totalAttendance.toLocaleString()}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Planned Drives</span>
          <p className="text-2xl font-bold text-[#92400e] mt-1 tabular-nums">{outreaches.filter(o => o.status === 'PLANNED').length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Completed Drives</span>
          <p className="text-2xl font-bold text-[#22543d] mt-1 tabular-nums">{outreaches.filter(o => o.status === 'COMPLETED').length}</p>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
        <div className="p-4 border-b border-[#e2e8f0] flex justify-between items-center bg-[#f8f9ff]">
          <h2 className="font-bold text-[#002045] text-sm">📍 Scheduled & Completed Campaigns</h2>
          <span className="text-xs text-[#74777f] font-mono tabular-nums">{outreaches.length} Events</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#74777f]">Loading outreach campaigns...</div>
        ) : outreaches.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#74777f]">No outreach campaigns scheduled yet.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
              <tr>
                <th className="p-3">Campaign Title</th>
                <th className="p-3">Target Location</th>
                <th className="p-3">Date</th>
                <th className="p-3">Attendance</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0d1c2e]">
              {outreaches.map((o) => (
                <tr key={o.id} className="hover:bg-[#e5eeff]">
                  <td className="p-3 font-bold text-[#002045]">{o.title}</td>
                  <td className="p-3 text-[#13696a] font-semibold">{o.location?.name || 'Main Office'}</td>
                  <td className="p-3 text-[#74777f] tabular-nums">{new Date(o.date).toLocaleDateString()}</td>
                  <td className="p-3 font-bold tabular-nums text-[#002045]">{o.attendance || 0} participants</td>
                  <td className="p-3">
                    <span className={o.status === 'COMPLETED' ? 'badge-low-risk' : 'badge-mod-risk'}>
                      {o.status}
                    </span>
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
