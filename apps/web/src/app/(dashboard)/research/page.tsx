'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function ResearchPage() {
  const [projects, setProjects] = useState<any[]>([]);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#002045] text-white p-5 rounded-lg border border-[#1a365d] shadow-sm">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#13696a] text-white uppercase tracking-wider">
            Data Governance • Research & Surveys
          </span>
          <h1 className="text-2xl font-bold mt-1 text-white">Oncology Research & KAP Studies</h1>
          <p className="text-slate-300 text-xs mt-0.5">Manage clinical research protocols, Knowledge Attitude & Practice (KAP) surveys, and study outcomes.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs mt-3 md:mt-0">
          + New Research Study
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
              <h2 className="text-base font-bold text-[#002045]">Initiate Research Study</h2>
              <button onClick={() => setShowModal(false)} className="text-[#74777f] font-bold">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Research Protocol / Study Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Rural Cervical Screening Acceptance KAP Survey"
                  className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
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
          <span className="text-xs font-semibold text-[#74777f] uppercase">Active Research Projects</span>
          <p className="text-3xl font-bold text-[#002045] mt-1 tabular-nums">{projects.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase">Survey Respondents</span>
          <p className="text-3xl font-bold text-[#13696a] mt-1 tabular-nums">1,240</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase">Published Protocols</span>
          <p className="text-3xl font-bold text-[#22543d] mt-1 tabular-nums">4</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase">IRB Approvals</span>
          <p className="text-3xl font-bold text-[#92400e] mt-1 tabular-nums">100% Valid</p>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
        <div className="p-4 border-b border-[#e2e8f0] font-bold text-[#002045] text-sm bg-[#f8f9ff]">
          🔬 Registered Research Initiatives
        </div>
        {loading ? (
          <div className="p-8 text-center text-xs text-[#74777f]">Loading research studies...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#74777f]">No research studies registered yet.</div>
        ) : (
          <div className="p-4 space-y-3">
            {projects.map((proj) => (
              <div key={proj.id} className="p-4 rounded border border-[#e2e8f0] bg-[#f8f9ff] space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-[#002045] text-sm">{proj.title}</h4>
                  <span className="font-mono font-bold text-[#13696a] tabular-nums">{proj.progress || 40}% Complete</span>
                </div>
                <div className="w-full bg-[#edf2f7] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#13696a] h-full rounded-full" style={{ width: `${proj.progress || 40}%` }}></div>
                </div>
                <div className="flex justify-between items-center pt-1 text-[11px] text-[#74777f]">
                  <span>Status: <strong className="text-[#0d1c2e]">{proj.status}</strong></span>
                  <span className="font-mono">Created: {new Date(proj.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
