'use client';

import type { ResearchProject } from '@/types/api';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

/**
 * A research project's own progress percentage.
 *
 * This used to derive completion from `project.tasks`, which belongs to the
 * project-management `Project` and is undefined on every row here — so every
 * research project showed 0% while `progress`, the column the API exposes a
 * PATCH endpoint for, went unread.
 */
function completion(project: ResearchProject): number {
  return Math.round(Number(project.progress) || 0);
}

export default function ResearchPage() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/research/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch research projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/research/projects', { title });
      setShowModal(false);
      setTitle('');
      fetchProjects();
    } catch (err) {
      console.error('Failed to create research study', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--outline)] pb-5">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Data Governance • Research & Surveys
          </span>
          <h1 className="text-2xl font-bold mt-1 text-[var(--on-background)]">Oncology Research & KAP Studies</h1>
          <p className="text-[var(--muted)] text-xs mt-0.5">Manage clinical research protocols, Knowledge Attitude & Practice (KAP) surveys, and study outcomes.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs mt-3 md:mt-0">
          + New Research Study
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Initiate Research Study</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Research Protocol / Study Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Rural Cervical Screening Acceptance KAP Survey"
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Study'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Active Research Projects</span>
          <p className="text-3xl font-bold text-[var(--primary)] mt-1 tabular-nums">{projects.length}</p>
        </div>
        {/*
          These were 1,240 survey respondents, 4 published protocols and "100%
          Valid" IRB approvals. None of the three has a table, a column or an
          endpoint anywhere in this system — they were literals, and "100%
          Valid" is a compliance claim about human-subjects research made by a
          screen with no knowledge of any approval.

          A ResearchProject has a title, a status and a percent complete, which
          is what these now report.
        */}
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Completed</span>
          <p className="text-3xl font-bold text-[var(--secondary)] mt-1 tabular-nums">
            {projects.filter(p => (p.status || '').toUpperCase() === 'COMPLETED').length}
          </p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">In Progress</span>
          <p className="text-3xl font-bold text-[var(--risk-low-text)] mt-1 tabular-nums">
            {projects.filter(p => (p.status || '').toUpperCase() !== 'COMPLETED').length}
          </p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Average Progress</span>
          <p className="text-3xl font-bold text-[var(--risk-mod-text)] mt-1 tabular-nums">
            {projects.length === 0
              ? '—'
              : `${Math.round(projects.reduce((sum, p) => sum + completion(p), 0) / projects.length)}%`}
          </p>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
        <div className="p-4 border-b border-[var(--outline)] font-bold text-[var(--primary)] text-sm bg-[var(--background)]">
          Registered Research Initiatives
        </div>
        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--muted)]">Loading research studies...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--muted)]">No research studies registered yet.</div>
        ) : (
          <div className="p-4 space-y-3">
            {projects.map((proj) => (
              <div key={proj.id} className="p-4 rounded border border-[var(--outline)] bg-[var(--background)] space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-[var(--primary)] text-sm">{proj.title}</h4>
                  {/* Derived from the project's own tasks. Every project used to
                      show a flat "40% Complete" because Project carries no
                      progress field and the fallback was a literal 40. */}
                  <span className="font-mono font-bold text-[var(--secondary)] tabular-nums">{completion(proj)}% Complete</span>
                </div>
                <div className="w-full bg-[var(--surface-subtle)] h-2 rounded-full overflow-hidden">
                  <div className="bg-[var(--secondary)] h-full rounded-full" style={{ width: `${completion(proj)}%` }}></div>
                </div>
                <div className="flex justify-between items-center pt-1 text-[11px] text-[var(--muted)]">
                  <span>Status: <strong className="text-[var(--on-background)]">{proj.status}</strong></span>
                  <span className="font-mono tabular-nums">Created: {proj.createdAt ? new Date(proj.createdAt).toLocaleDateString() : '—'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
