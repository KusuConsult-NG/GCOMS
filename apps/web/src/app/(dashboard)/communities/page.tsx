'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [lga, setLga] = useState('Barkin Ladi');
  const [population, setPopulation] = useState('1500');
  const [submitting, setSubmitting] = useState(false);

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/communities');
      setCommunities(res.data);
    } catch (err) {
      console.error('Failed to load communities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/communities', { name, lga, state: 'Plateau', population: Number(population) });
      setShowModal(false);
      setName('');
      fetchCommunities();
    } catch (err) {
      console.error('Failed to register community', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#002045] text-white p-5 rounded-lg border border-[#1a365d] shadow-sm">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#13696a] text-white uppercase tracking-wider">
            Field Operations • Community Coverage Database
          </span>
          <h1 className="text-2xl font-bold mt-1 text-white">Target Communities & LGA Coverage</h1>
          <p className="text-slate-300 text-xs mt-0.5">Registry of target LGAs and rural community coverage across Plateau State.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs mt-3 md:mt-0">
          + Register New Community
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
              <h2 className="text-base font-bold text-[#002045]">Register Community</h2>
              <button onClick={() => setShowModal(false)} className="text-[#74777f] font-bold">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Community Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Heipang Ward"
                  className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Local Government Area (LGA) *</label>
                <select
                  value={lga}
                  onChange={(e) => setLga(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs"
                >
                  <option value="Barkin Ladi">Barkin Ladi LGA</option>
                  <option value="Jos North">Jos North LGA</option>
                  <option value="Mangu">Mangu LGA</option>
                  <option value="Kanke">Kanke LGA</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Estimated Target Population</label>
                <input
                  type="number"
                  value={population}
                  onChange={(e) => setPopulation(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs font-mono tabular-nums"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">
                  {submitting ? 'Registering...' : 'Save Community'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase">Registered Communities</span>
          <p className="text-3xl font-bold text-[#002045] mt-1 tabular-nums">{communities.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase">Active LGAs</span>
          <p className="text-3xl font-bold text-[#13696a] mt-1 tabular-nums">17 LGAs</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase">Target Population</span>
          <p className="text-3xl font-bold text-[#22543d] mt-1 tabular-nums">450,000+</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase">State Coverage</span>
          <p className="text-3xl font-bold text-[#92400e] mt-1">Plateau State</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
        <div className="p-4 border-b border-[#e2e8f0] font-bold text-[#002045] text-sm bg-[#f8f9ff]">
          📍 Target Community Roster
        </div>
        {loading ? (
          <div className="p-8 text-center text-xs text-[#74777f]">Loading community registry...</div>
        ) : communities.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#74777f]">No communities registered yet.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
              <tr>
                <th className="p-3">Community Name</th>
                <th className="p-3">LGA</th>
                <th className="p-3">State</th>
                <th className="p-3">Est. Population</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0d1c2e]">
              {communities.map((c) => (
                <tr key={c.id} className="hover:bg-[#e5eeff]">
                  <td className="p-3 font-bold text-[#002045]">{c.name}</td>
                  <td className="p-3 text-[#13696a] font-semibold">{c.lga} LGA</td>
                  <td className="p-3 text-[#74777f]">{c.state}</td>
                  <td className="p-3 font-bold font-mono tabular-nums text-[#002045]">{Number(c.population || 2000).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
