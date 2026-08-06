'use client';

import type { Referral } from '@/types/api';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function NavigationPage() {
  // This reads /referrals, not outreach events.
  const [events, setEvents] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNavigationData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/referrals');
      setEvents(res.data);
    } catch (err) {
      console.error('Failed to fetch navigation data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNavigationData();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[var(--nav-surface)] text-white p-5 rounded-lg border border-[var(--nav-surface-raised)] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--secondary)] text-white uppercase tracking-wider">
            Patient Care • Patient Navigation Engine
          </span>
          <h1 className="text-2xl font-bold mt-1 text-white">Patient Navigation & Referral Support</h1>
          <p className="text-slate-300 text-xs mt-0.5">Track patient journeys from initial screening through tertiary referral and ongoing cancer treatment.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Under Active Navigation</span>
          <p className="text-3xl font-bold text-[var(--primary)] mt-1 tabular-nums">184</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Appointments Scheduled</span>
          <p className="text-3xl font-bold text-[var(--secondary)] mt-1 tabular-nums">42</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Tertiary Hospital Referrals</span>
          <p className="text-3xl font-bold text-[var(--risk-low-text)] mt-1 tabular-nums">28</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Completion Rate</span>
          <p className="text-3xl font-bold text-[var(--risk-mod-text)] mt-1 tabular-nums">89%</p>
        </div>
      </div>

      {/* Navigation Directory Table */}
      <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
        <div className="p-4 border-b border-[var(--outline)] flex justify-between items-center bg-[var(--background)]">
          <h2 className="font-bold text-[var(--primary)] text-sm">📍 Active Patient Navigation Trajectory Roster</h2>
          <span className="text-xs text-[var(--muted)] font-mono tabular-nums">{events.length} Navigated Records</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--muted)]">Loading patient navigation records...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
              <tr>
                <th className="p-3">Patient Code / Name</th>
                <th className="p-3">Referred Facility</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Referral Date</th>
                <th className="p-3">Navigation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-[var(--muted)]">
                    No referrals to navigate yet.
                  </td>
                </tr>
              )}
              {/* Two invented patients used to render here whenever the list was
                  empty — names, registration ids and facilities that looked like
                  real referrals to anyone reading the screen. */}
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-[var(--primary-surface)]">
                  <td className="p-3 font-bold text-[var(--primary)]">
                    {e.participant?.firstName} {e.participant?.lastName} <span className="font-mono text-[10px] text-[var(--muted)]">({e.participant?.registrationId ?? '—'})</span>
                  </td>
                  <td className="p-3 text-[var(--secondary)] font-semibold">{e.referredTo}</td>
                  <td className="p-3 text-[var(--on-surface-variant)]">{e.reason}</td>
                  <td className="p-3 text-[var(--muted)] tabular-nums">{new Date(e.createdAt).toLocaleDateString()}</td>
                  <td className="p-3"><span className="badge-low-risk">{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
