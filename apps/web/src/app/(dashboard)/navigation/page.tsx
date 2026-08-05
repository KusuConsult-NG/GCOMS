'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function NavigationPage() {
  const [events, setEvents] = useState<any[]>([]);
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
      <div className="bg-[#002045] text-white p-5 rounded-lg border border-[#1a365d] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#13696a] text-white uppercase tracking-wider">
            Patient Care • Patient Navigation Engine
          </span>
          <h1 className="text-2xl font-bold mt-1 text-white">Patient Navigation & Referral Support</h1>
          <p className="text-slate-300 text-xs mt-0.5">Track patient journeys from initial screening through tertiary referral and ongoing cancer treatment.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Under Active Navigation</span>
          <p className="text-3xl font-bold text-[#002045] mt-1 tabular-nums">184</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Appointments Scheduled</span>
          <p className="text-3xl font-bold text-[#13696a] mt-1 tabular-nums">42</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Tertiary Hospital Referrals</span>
          <p className="text-3xl font-bold text-[#22543d] mt-1 tabular-nums">28</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Completion Rate</span>
          <p className="text-3xl font-bold text-[#92400e] mt-1 tabular-nums">89%</p>
        </div>
      </div>

      {/* Navigation Directory Table */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
        <div className="p-4 border-b border-[#e2e8f0] flex justify-between items-center bg-[#f8f9ff]">
          <h2 className="font-bold text-[#002045] text-sm">📍 Active Patient Navigation Trajectory Roster</h2>
          <span className="text-xs text-[#74777f] font-mono tabular-nums">{events.length} Navigated Records</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#74777f]">Loading patient navigation records...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
              <tr>
                <th className="p-3">Patient Code / Name</th>
                <th className="p-3">Referred Facility</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Referral Date</th>
                <th className="p-3">Navigation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0d1c2e]">
              {(events.length ? events : [
                { participant: { gcId: 'GC-99214', firstName: 'Mary', lastName: 'Luka' }, targetFacility: 'JUTH Oncology', reason: 'VIA Positive Staging', createdAt: new Date().toISOString(), status: 'IN_PROGRESS' },
                { participant: { gcId: 'GC-77218', firstName: 'Grace', lastName: 'Daniel' }, targetFacility: 'Plateau Specialist Hospital', reason: 'Breast Biopsy Follow-up', createdAt: new Date().toISOString(), status: 'PENDING' },
              ]).map((e, idx) => (
                <tr key={idx} className="hover:bg-[#e5eeff]">
                  <td className="p-3 font-bold text-[#002045]">
                    {e.participant?.firstName} {e.participant?.lastName} <span className="font-mono text-[10px] text-[#74777f]">({e.participant?.gcId || 'GC-001'})</span>
                  </td>
                  <td className="p-3 text-[#13696a] font-semibold">{e.targetFacility}</td>
                  <td className="p-3 text-[#43474e]">{e.reason}</td>
                  <td className="p-3 text-[#74777f] tabular-nums">{new Date(e.createdAt).toLocaleDateString()}</td>
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
