'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string | null;
  address: string | null;
  createdAt: string;
  screenings?: any[];
  referrals?: any[];
  navigationEvents?: any[];
  clinicalEncounters?: any[];
  followUps?: any[];
}

export default function PatientsPage() {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState<Patient | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchPatients(search);
  }, [search]);

  const fetchPatients = async (q: string) => {
    setLoading(true);
    try {
      const res = await api.get('/participants', { params: { search: q || undefined } });
      setPatients(res.data);
      setTotalCount(res.data.length);
    } catch (err) {
      console.error('Failed to fetch patients', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (id: string) => {
    setLoadingProfile(true);
    try {
      const res = await api.get(`/participants/${id}`);
      setSelected(res.data);
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const getAge = (dob: string) => {
    if (!dob) return 'N/A';
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Clinical Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#002045]">Patient Directory</h1>
          <p className="text-[#43474e] text-xs mt-1">Unified community database of registered participants and patients.</p>
        </div>
        <a href="/registration" className="btn-primary text-xs flex items-center gap-1">
          + Register New Participant
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Total Registered</span>
          <p className="text-3xl font-bold text-[#002045] mt-1 tabular-nums">{totalCount}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Search Results</span>
          <p className="text-3xl font-bold text-[#13696a] mt-1 tabular-nums">{patients.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Active Filter</span>
          <p className="text-3xl font-bold text-[#002045] mt-1">{search ? '✓ Filtered' : '— None'}</p>
        </div>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search by name, National ID, or phone number..."
          className="flex-1 px-4 py-2 bg-white border border-[#e2e8f0] rounded text-xs focus:border-[#13696a] focus:ring-2 focus:ring-[#13696a]/20 outline-none text-[#0d1c2e]"
        />
        <button type="submit" className="btn-primary text-xs">
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); setSearchInput(''); }}
            className="btn-secondary text-xs"
          >
            Clear
          </button>
        )}
      </form>

      <div className="flex gap-6">
        {/* Table */}
        <div className={`bg-white rounded-lg border border-[#e2e8f0] overflow-hidden ${selected ? 'flex-1' : 'w-full'}`}>
          {loading ? (
            <div className="p-8 text-center text-[#74777f] text-xs">Loading patient directory...</div>
          ) : patients.length === 0 ? (
            <div className="p-8 text-center text-[#74777f] text-xs">
              {search ? `No patients found matching "${search}"` : 'No patients registered yet.'}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
                <tr>
                  <th className="p-3">Patient</th>
                  <th className="p-3">National ID</th>
                  <th className="p-3">Age / Gender</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Registered</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0d1c2e]">
                {patients.map(p => (
                  <tr
                    key={p.id}
                    className={`hover:bg-[#e5eeff] cursor-pointer transition-colors ${selected?.id === p.id ? 'bg-[#e5eeff] border-l-4 border-[#13696a]' : ''}`}
                    onClick={() => loadProfile(p.id)}
                  >
                    <td className="p-3 font-bold text-[#002045]">{p.firstName} {p.lastName}</td>
                    <td className="p-3 font-mono text-[#43474e] tabular-nums">{p.nationalId}</td>
                    <td className="p-3 tabular-nums">{getAge(p.dateOfBirth)} yrs / {p.gender}</td>
                    <td className="p-3 tabular-nums">{p.phoneNumber || 'N/A'}</td>
                    <td className="p-3 text-[#74777f] tabular-nums">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <button className="text-[#13696a] hover:underline font-semibold text-xs">View Profile →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Patient Profile Detail Side Panel */}
        {selected && (
          <div className="w-[380px] flex-shrink-0 space-y-4">
            <div className="bg-white rounded-lg border border-[#e2e8f0] p-5 shadow-sm">
              <div className="flex justify-between items-start border-b border-[#e2e8f0] pb-3">
                <div>
                  <h2 className="text-base font-bold text-[#002045]">{selected.firstName} {selected.lastName}</h2>
                  <p className="text-xs text-[#43474e] font-mono tabular-nums">{selected.nationalId}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-[#74777f] hover:text-[#0d1c2e] font-bold text-sm">✕</button>
              </div>

              {loadingProfile ? (
                <div className="mt-4 text-center text-[#74777f] text-xs">Loading clinical record...</div>
              ) : (
                <div className="mt-4 space-y-4 text-xs">
                  {/* Bio Details */}
                  <div className="grid grid-cols-2 gap-2 text-[#43474e]">
                    <div><span className="font-semibold text-[#002045]">Gender:</span> {selected.gender}</div>
                    <div><span className="font-semibold text-[#002045]">Age:</span> <span className="tabular-nums">{getAge(selected.dateOfBirth)}</span></div>
                    <div className="col-span-2"><span className="font-semibold text-[#002045]">Phone:</span> <span className="tabular-nums">{selected.phoneNumber || 'N/A'}</span></div>
                    <div className="col-span-2"><span className="font-semibold text-[#002045]">Address:</span> {selected.address || 'N/A'}</div>
                  </div>

                  {/* Screenings */}
                  <div>
                    <h3 className="font-semibold text-[#002045] border-b border-[#e2e8f0] pb-1 mb-2">🩺 Screenings ({selected.screenings?.length || 0})</h3>
                    {selected.screenings && selected.screenings.length > 0 ? (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {selected.screenings.map((s: any) => (
                          <div key={s.id} className="flex justify-between items-center bg-[#f8f9ff] p-2 rounded border border-[#e2e8f0]">
                            <span className="font-medium text-[#0d1c2e]">{s.cancerType}</span>
                            <span className={s.result?.toLowerCase().includes('positive') ? 'badge-high-risk' : 'badge-low-risk'}>
                              {s.result}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-[#74777f]">No screenings recorded.</p>}
                  </div>

                  {/* Referrals */}
                  <div>
                    <h3 className="font-semibold text-[#002045] border-b border-[#e2e8f0] pb-1 mb-2">📋 Referrals ({selected.referrals?.length || 0})</h3>
                    {selected.referrals && selected.referrals.length > 0 ? (
                      <div className="space-y-1.5 max-h-24 overflow-y-auto">
                        {selected.referrals.map((r: any) => (
                          <div key={r.id} className="flex justify-between items-center bg-[#f8f9ff] p-2 rounded border border-[#e2e8f0]">
                            <span className="text-[#0d1c2e]">{r.referredTo}</span>
                            <span className={r.status === 'PENDING' ? 'badge-mod-risk' : 'badge-low-risk'}>
                              {r.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-[#74777f]">No referrals recorded.</p>}
                  </div>

                  {/* Follow-ups */}
                  <div>
                    <h3 className="font-semibold text-[#002045] border-b border-[#e2e8f0] pb-1 mb-2">📅 Follow-ups ({selected.followUps?.length || 0})</h3>
                    {selected.followUps && selected.followUps.length > 0 ? (
                      <div className="space-y-1.5 max-h-24 overflow-y-auto">
                        {selected.followUps.map((f: any) => (
                          <div key={f.id} className="flex justify-between items-center bg-[#f8f9ff] p-2 rounded border border-[#e2e8f0]">
                            <span className="text-[#0d1c2e] tabular-nums">{new Date(f.scheduledDate).toLocaleDateString()}</span>
                            <span className={f.status === 'COMPLETED' ? 'badge-low-risk' : f.status === 'SCHEDULED' ? 'badge-mod-risk' : 'badge-high-risk'}>
                              {f.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-[#74777f]">No follow-ups scheduled.</p>}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e2e8f0]">
                    <a href="/screenings" className="text-center py-2 bg-[#e5eeff] text-[#002045] font-semibold text-xs rounded hover:bg-[#dce9ff]">
                      + Screening
                    </a>
                    <a href="/follow-ups" className="text-center py-2 bg-[#13696a]/10 text-[#13696a] font-semibold text-xs rounded hover:bg-[#13696a]/20">
                      + Follow-up
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
