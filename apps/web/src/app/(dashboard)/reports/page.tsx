'use client';

import type { ReportsSummary } from '@/types/api';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [exporting, setExporting] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/reports/summary');
        setSummary(res.data);
      } catch (err) {
        setSummaryError(
          errorMessage(err, 'The summary could not be loaded.'),
        );
      }
    };
    fetchSummary();
  }, []);

  /** A count the API has not returned is not zero. */
  const figure = (value: number | undefined) =>
    value === undefined ? '—' : value.toLocaleString();

  /*
   * The breakdown, as proportions of what has actually been recorded. Outreach
   * events are counted as themselves: the API used to multiply them by fifty
   * and call the product "Total Community Reach".
   */
  const breakdown = (() => {
    const rows = [
      { label: 'Outreach events', count: summary?.totalOutreaches ?? 0, tone: 'bg-[var(--nav-surface)]' },
      { label: 'Screenings conducted', count: summary?.totalScreenings ?? 0, tone: 'bg-[var(--secondary)]' },
      { label: 'Navigation & care support', count: summary?.totalNavigationEvents ?? 0, tone: 'bg-[var(--risk-mod-text)]' },
      { label: 'Hospital referrals', count: summary?.totalReferrals ?? 0, tone: 'bg-[var(--risk-low-text)]' },
    ];
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    return {
      total,
      rows: rows.map((r) => ({
        ...r,
        percent: total > 0 ? Math.round((r.count / total) * 100) : 0,
      })),
    };
  })();

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
          <h1 className="text-2xl font-bold text-[var(--primary)]">Reports & Impact Analytics</h1>
          <p className="text-[var(--on-surface-variant)] text-xs mt-1">Generate programmatic, financial, clinical, and grant compliance analytics.</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="btn-primary text-xs disabled:opacity-50"
        >
          {exporting ? 'Generating...' : 'Export Full Report (JSON / CSV)'}
        </button>
      </div>

      {summaryError && (
        <p
          role="alert"
          className="rounded border border-[var(--risk-high-text)]/20 bg-[var(--risk-high-bg)] p-3 text-xs font-semibold text-[var(--risk-high-text)]"
        >
          {summaryError}
        </p>
      )}

      {/*
        These four were the literals 1,845, 462, 184 and 51, and the one field
        that did come from the API was written `summary?.totalScreenings || 462`
        — so a programme with no screenings yet reported 462 of them. On the one
        screen whose entire purpose is reporting.
      */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Participants Registered</span>
          <p className="text-3xl font-bold text-[var(--primary)] mt-1 tabular-nums">{figure(summary?.totalPatients)}</p>
          <span className="text-[11px] text-[var(--muted)]">
            Across {figure(summary?.communitiesCovered)} communities
          </span>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Screenings Conducted</span>
          <p className="text-3xl font-bold text-[var(--secondary)] mt-1 tabular-nums">{figure(summary?.totalScreenings)}</p>
          <span className="text-[11px] text-[var(--muted)]">
            {figure(summary?.positiveScreenings)} positive
          </span>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Referrals Awaiting Acceptance</span>
          <p className="text-3xl font-bold text-[var(--risk-mod-text)] mt-1 tabular-nums">{figure(summary?.activeReferrals)}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Referrals On Record</span>
          <p className="text-3xl font-bold text-[var(--risk-low-text)] mt-1 tabular-nums">{figure(summary?.totalReferrals)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown */}
        <div className="bg-white rounded-lg border border-[var(--outline)] p-5 space-y-4">
          <h3 className="font-bold text-[var(--primary)] text-sm border-b border-[var(--outline)] pb-2">Programmatic Impact Breakdown</h3>
          {/* Four counts with four percentages and four progress bars, none of
              which came from anywhere. The percentages are now of the total of
              the four, so the bars add to the whole rather than to 96%. */}
          {breakdown.total === 0 ? (
            <p className="py-4 text-xs text-[var(--muted)]">
              Nothing has been recorded yet, so there is no breakdown to show.
            </p>
          ) : (
            <div className="space-y-3 text-xs font-medium text-[var(--on-background)]">
              {breakdown.rows.map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between mb-1">
                    <span>{row.label}</span>
                    <span className="font-mono tabular-nums font-bold">
                      {row.count.toLocaleString()} ({row.percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-[var(--surface-subtle)] h-2 rounded-full overflow-hidden">
                    <div
                      className={`${row.tone} h-full rounded-full`}
                      style={{ width: `${row.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Catalog */}
        <div className="bg-white rounded-lg border border-[var(--outline)] p-5 space-y-4">
          <h3 className="font-bold text-[var(--primary)] text-sm border-b border-[var(--outline)] pb-2">Export</h3>
          {/*
            This listed three published reports — "Q1 Community Health Impact &
            Screening Audit", dated May 2025, and two others — none of which
            exist. All three Download buttons called the same export, so the
            catalogue was three names for one file.
          */}
          <p className="text-xs text-[var(--on-surface-variant)]">
            There is no report archive yet. The export below is generated from
            the current data each time it is requested.
          </p>
          <div className="rounded border border-[var(--outline)] bg-[var(--background)] p-3">
            <p className="text-xs font-bold text-[var(--primary)]">
              Full executive extract (JSON)
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--muted)]">
              Participants, screenings, referrals and finance, as of{' '}
              {summary?.generatedAt
                ? new Date(summary.generatedAt).toLocaleString()
                : 'now'}
              .
            </p>
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="btn-secondary mt-2 px-2.5 py-1 text-[11px] disabled:opacity-50"
            >
              {exporting ? 'Generating…' : 'Download'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
