'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  registrationId: string;
  nationalId: string | null;
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
          <h1 className="text-2xl font-bold text-[var(--primary)]">Patient Directory</h1>
          <p className="text-[var(--on-surface-variant)] text-xs mt-1">Unified community database of registered participants and patients.</p>
        </div>
        <a href="/registration" className="btn-primary text-xs flex items-center gap-1">
          + Register New Participant
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Total Registered</span>
          <p className="text-3xl font-bold text-[var(--primary)] mt-1 tabular-nums">{totalCount}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Search Results</span>
          <p className="text-3xl font-bold text-[var(--secondary)] mt-1 tabular-nums">{patients.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Active Filter</span>
          <p className="text-3xl font-bold text-[var(--primary)] mt-1">{search ? '✓ Filtered' : '— None'}</p>
        </div>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search by name, National ID, or phone number..."
          className="flex-1 px-4 py-2 bg-white border border-[var(--outline)] rounded text-xs focus:border-[var(--secondary)] focus:ring-2 focus:ring-[var(--secondary)]/20 outline-none text-[var(--on-background)]"
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
        <div className={`bg-white rounded-lg border border-[var(--outline)] overflow-hidden ${selected ? 'flex-1' : 'w-full'}`}>
          {loading ? (
            <div className="p-8 text-center text-[var(--muted)] text-xs">Loading patient directory...</div>
          ) : patients.length === 0 ? (
            <div className="p-8 text-center text-[var(--muted)] text-xs">
              {search ? `No patients found matching "${search}"` : 'No patients registered yet.'}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                <tr>
                  <th className="p-3">Patient</th>
                  <th className="p-3">National ID</th>
                  <th className="p-3">Age / Gender</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Registered</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
                {patients.map(p => (
                  <tr
                    key={p.id}
                    className={`hover:bg-[var(--primary-surface)] cursor-pointer transition-colors ${selected?.id === p.id ? 'bg-[var(--primary-surface)] border-l-4 border-[var(--secondary)]' : ''}`}
                    onClick={() => loadProfile(p.id)}
                  >
                    <td className="p-3 font-bold text-[var(--primary)]">{p.firstName} {p.lastName}</td>
                    <td className="p-3 font-mono text-[var(--on-surface-variant)] tabular-nums">{p.registrationId ?? p.nationalId ?? '—'}</td>
                    <td className="p-3 tabular-nums">{getAge(p.dateOfBirth)} yrs / {p.gender}</td>
                    <td className="p-3 tabular-nums">{p.phoneNumber || 'N/A'}</td>
                    <td className="p-3 text-[var(--muted)] tabular-nums">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <button className="text-[var(--secondary)] hover:underline font-semibold text-xs">View Profile →</button>
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
            <div className="bg-white rounded-lg border border-[var(--outline)] p-5 shadow-sm">
              <div className="flex justify-between items-start border-b border-[var(--outline)] pb-3">
                <div>
                  <h2 className="text-base font-bold text-[var(--primary)]">{selected.firstName} {selected.lastName}</h2>
                  <p className="text-xs text-[var(--on-surface-variant)] font-mono tabular-nums">{selected.registrationId ?? selected.nationalId ?? '—'}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-[var(--muted)] hover:text-[var(--on-background)] font-bold text-sm">✕</button>
              </div>

              {loadingProfile ? (
                <div className="mt-4 text-center text-[var(--muted)] text-xs">Loading clinical record...</div>
              ) : (
                <div className="mt-4 space-y-4 text-xs">
                  {/* Bio Details */}
                  <div className="grid grid-cols-2 gap-2 text-[var(--on-surface-variant)]">
                    <div><span className="font-semibold text-[var(--primary)]">Gender:</span> {selected.gender}</div>
                    <div><span className="font-semibold text-[var(--primary)]">Age:</span> <span className="tabular-nums">{getAge(selected.dateOfBirth)}</span></div>
                    <div className="col-span-2"><span className="font-semibold text-[var(--primary)]">Phone:</span> <span className="tabular-nums">{selected.phoneNumber || 'N/A'}</span></div>
                    <div className="col-span-2"><span className="font-semibold text-[var(--primary)]">Address:</span> {selected.address || 'N/A'}</div>
                  </div>

                  {/* Screenings */}
                  <div>
                    <h3 className="font-semibold text-[var(--primary)] border-b border-[var(--outline)] pb-1 mb-2">🩺 Screenings ({selected.screenings?.length || 0})</h3>
                    {selected.screenings && selected.screenings.length > 0 ? (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {selected.screenings.map((s: any) => (
                          <div key={s.id} className="flex justify-between items-center bg-[var(--background)] p-2 rounded border border-[var(--outline)]">
                            <span className="font-medium text-[var(--on-background)]">{s.cancerType}</span>
                            <span className={s.result?.toLowerCase().includes('positive') ? 'badge-high-risk' : 'badge-low-risk'}>
                              {s.result}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-[var(--muted)]">No screenings recorded.</p>}
                  </div>

                  {/* Referrals */}
                  <div>
                    <h3 className="font-semibold text-[var(--primary)] border-b border-[var(--outline)] pb-1 mb-2">📋 Referrals ({selected.referrals?.length || 0})</h3>
                    {selected.referrals && selected.referrals.length > 0 ? (
                      <div className="space-y-1.5 max-h-24 overflow-y-auto">
                        {selected.referrals.map((r: any) => (
                          <div key={r.id} className="flex justify-between items-center bg-[var(--background)] p-2 rounded border border-[var(--outline)]">
                            <span className="text-[var(--on-background)]">{r.referredTo}</span>
                            <span className={r.status === 'PENDING' ? 'badge-mod-risk' : 'badge-low-risk'}>
                              {r.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-[var(--muted)]">No referrals recorded.</p>}
                  </div>

                  {/* Follow-ups */}
                  <div>
                    <h3 className="font-semibold text-[var(--primary)] border-b border-[var(--outline)] pb-1 mb-2">📅 Follow-ups ({selected.followUps?.length || 0})</h3>
                    {selected.followUps && selected.followUps.length > 0 ? (
                      <div className="space-y-1.5 max-h-24 overflow-y-auto">
                        {selected.followUps.map((f: any) => (
                          <div key={f.id} className="flex justify-between items-center bg-[var(--background)] p-2 rounded border border-[var(--outline)]">
                            <span className="text-[var(--on-background)] tabular-nums">{new Date(f.scheduledDate).toLocaleDateString()}</span>
                            <span className={f.status === 'COMPLETED' ? 'badge-low-risk' : f.status === 'SCHEDULED' ? 'badge-mod-risk' : 'badge-high-risk'}>
                              {f.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-[var(--muted)]">No follow-ups scheduled.</p>}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--outline)]">
                    <a href="/screenings" className="text-center py-2 bg-[var(--primary-surface)] text-[var(--primary)] font-semibold text-xs rounded hover:bg-[var(--primary-surface)]">
                      + Screening
                    </a>
                    <a href="/follow-ups" className="text-center py-2 bg-[var(--secondary)]/10 text-[var(--secondary)] font-semibold text-xs rounded hover:bg-[var(--secondary)]/20">
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
