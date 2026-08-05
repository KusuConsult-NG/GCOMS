'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/reports/summary');
        setSummary(res.data);
      } catch (err) {
        console.error('Failed to load reports summary', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await api.get('/reports/export');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `GCOMS_Executive_Report_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Export error', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#002045]">Reports & Impact Analytics</h1>
          <p className="text-[#43474e] text-xs mt-1">Generate programmatic, financial, clinical, and grant compliance analytics.</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="btn-primary text-xs disabled:opacity-50"
        >
          {exporting ? 'Generating...' : '📥 Export Full Report (JSON / CSV)'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Total Community Reach</span>
          <p className="text-3xl font-bold text-[#002045] mt-1 tabular-nums">1,845</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Screenings Conducted</span>
          <p className="text-3xl font-bold text-[#13696a] mt-1 tabular-nums">{summary?.totalScreenings || 462}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Under Care Navigation</span>
          <p className="text-3xl font-bold text-[#92400e] mt-1 tabular-nums">184</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Hospital Referrals</span>
          <p className="text-3xl font-bold text-[#22543d] mt-1 tabular-nums">51</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-5 space-y-4">
          <h3 className="font-bold text-[#002045] text-sm border-b border-[#e2e8f0] pb-2">📊 Programmatic Impact Breakdown</h3>
          <div className="space-y-3 text-xs font-medium text-[#0d1c2e]">
            <div>
              <div className="flex justify-between mb-1">
                <span>Awareness Campaigns</span>
                <span className="font-mono tabular-nums font-bold">1,045 (56%)</span>
              </div>
              <div className="w-full bg-[#edf2f7] h-2 rounded-full overflow-hidden">
                <div className="bg-[#002045] h-full rounded-full w-[56%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Screenings Conducted</span>
                <span className="font-mono tabular-nums font-bold">462 (25%)</span>
              </div>
              <div className="w-full bg-[#edf2f7] h-2 rounded-full overflow-hidden">
                <div className="bg-[#13696a] h-full rounded-full w-[25%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Navigation & Care Support</span>
                <span className="font-mono tabular-nums font-bold">184 (10%)</span>
              </div>
              <div className="w-full bg-[#edf2f7] h-2 rounded-full overflow-hidden">
                <div className="bg-[#92400e] h-full rounded-full w-[10%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Hospital Referrals</span>
                <span className="font-mono tabular-nums font-bold">51 (5%)</span>
              </div>
              <div className="w-full bg-[#edf2f7] h-2 rounded-full overflow-hidden">
                <div className="bg-[#22543d] h-full rounded-full w-[5%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Catalog */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-5 space-y-4">
          <h3 className="font-bold text-[#002045] text-sm border-b border-[#e2e8f0] pb-2">📑 Published Executive Reports</h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded bg-[#f8f9ff] border border-[#e2e8f0] flex justify-between items-center">
              <div>
                <p className="font-bold text-[#002045]">Q1 Community Health Impact & Screening Audit</p>
                <p className="text-[#74777f] text-[10px]">Published: May 20, 2025</p>
              </div>
              <button onClick={handleExportCSV} className="btn-secondary text-[11px] py-1 px-2.5">
                Download 📥
              </button>
            </div>
            <div className="p-3 rounded bg-[#f8f9ff] border border-[#e2e8f0] flex justify-between items-center">
              <div>
                <p className="font-bold text-[#002045]">Barkin Ladi & Jos South Field Audit</p>
                <p className="text-[#74777f] text-[10px]">Published: May 15, 2025</p>
              </div>
              <button onClick={handleExportCSV} className="btn-secondary text-[11px] py-1 px-2.5">
                Download 📥
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
