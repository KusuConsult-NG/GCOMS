'use client';

import type { BoardAction, BoardMember, BoardResolution, GovernanceMeeting } from '@/types/api';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

export function GovernanceWorkspace() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'meetings' | 'members' | 'resolutions' | 'actions'>('meetings');
  const [meetings, setMeetings] = useState<GovernanceMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<null | 'meeting' | 'minutes' | 'member' | 'resolution' | 'action'>(null);
  const [activeVoteModal, setActiveVoteModal] = useState<BoardResolution | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    minutesUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Local Seeded States
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);

  const [resolutions, setResolutions] = useState<BoardResolution[]>([]);

  const [actions, setActions] = useState<BoardAction[]>([]);

  // Form States
  const [memberForm, setMemberForm] = useState({ name: '', title: '', role: 'MEMBER', committees: [] as string[], phone: '', email: '', termStart: '', termEnd: '' });
  const [resolutionForm, setResolutionForm] = useState({ title: '', meetingDate: '', resolutionType: 'POLICY', description: '', proposedBy: '', secondedBy: '' });
  const [actionForm, setActionForm] = useState({ description: '', responsible: '', due: '', priority: 'MEDIUM', meetingId: '', status: 'PENDING' });

  // Vote State for activeVoteModal
  const [currentVotes, setCurrentVotes] = useState<Record<string, string>>({});

  const fetchBoardMembers = async () => {
    try { setBoardMembers((await api.get('/operations/board-members')).data); }
    catch (err) { console.error('Failed to fetch board members', err); }
  };
  const fetchActions = async () => {
    try { setActions((await api.get('/operations/board-actions')).data); }
    catch (err) { console.error('Failed to fetch board actions', err); }
  };

  const fetchResolutions = async () => {
    try {
      const res = await api.get('/governance/resolutions');
      setResolutions(res.data);
    } catch (err) { console.error('Failed to fetch resolutions', err); }
  };

  useEffect(() => {
    fetchResolutions();
    fetchBoardMembers();
    fetchActions();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const actionParam = searchParams.get('action');

    if (tabParam && ['meetings', 'members', 'resolutions', 'actions'].includes(tabParam)) {
      setActiveTab(tabParam as Parameters<typeof setActiveTab>[0]);
    }
    if (actionParam) {
      if (actionParam === 'new-meeting') setActiveModal('meeting');
      if (actionParam === 'new-minutes') { setActiveTab('meetings'); setActiveModal('minutes'); }
    }
  }, [searchParams]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/governance/meetings');
      setMeetings(res.data);
    } catch (err) {
      console.error('Failed to fetch governance meetings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/governance/meetings', formData);
      setActiveModal(null);
      setFormData({ title: '', date: new Date().toISOString().split('T')[0], minutesUrl: '' });
      fetchMeetings();
    } catch (err) {
      console.error('Failed to schedule meeting', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Was `setBoardMembers([...boardMembers, { ...memberForm, id: Date.now() }])`:
  // the record existed in this tab only and the id was a millisecond timestamp.
  // GET already read the real table, so the list looked live while every
  // addition disappeared on reload.
  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/operations/board-members', {
        name: memberForm.name,
        title: memberForm.title || undefined,
        role: memberForm.role,
        // The column is a comma-separated string; SQLite has no array type.
        committees: memberForm.committees.join(',') || undefined,
        phone: memberForm.phone || undefined,
        email: memberForm.email || undefined,
        termStart: new Date(memberForm.termStart).toISOString(),
        termEnd: new Date(memberForm.termEnd).toISOString(),
      });
      setActiveModal(null);
      setMemberForm({ name: '', title: '', role: 'MEMBER', committees: [], phone: '', email: '', termStart: '', termEnd: '' });
      await fetchBoardMembers();
    } catch (err) {
      console.error('Failed to add board member', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommitteeToggle = (c: string) => {
    setMemberForm(prev => ({
      ...prev,
      committees: prev.committees.includes(c) ? prev.committees.filter(x => x !== c) : [...prev.committees, c]
    }));
  };

  // The resolution number was minted here as RES-2026-<count+1>, which repeats
  // the moment two people table a resolution against the same list — and the
  // column is unique. The server owns it.
  const handleResolutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/governance/resolutions', {
        title: resolutionForm.title,
        description: resolutionForm.description,
        resolutionType: resolutionForm.resolutionType,
        meetingDate: resolutionForm.meetingDate
          ? new Date(resolutionForm.meetingDate).toISOString()
          : undefined,
        proposedBy: resolutionForm.proposedBy || undefined,
        secondedBy: resolutionForm.secondedBy || undefined,
        status: 'PENDING',
      });
      setActiveModal(null);
      setResolutionForm({ title: '', meetingDate: '', resolutionType: 'POLICY', description: '', proposedBy: '', secondedBy: '' });
      await fetchResolutions();
    } catch (err) {
      console.error('Failed to table resolution', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/operations/board-actions', {
        description: actionForm.description,
        responsible: actionForm.responsible,
        dueDate: new Date(actionForm.due).toISOString(),
        priority: actionForm.priority,
        meetingId: actionForm.meetingId || undefined,
      });
      setActiveModal(null);
      setActionForm({ description: '', responsible: '', due: '', priority: 'MEDIUM', meetingId: '', status: 'PENDING' });
      await fetchActions();
    } catch (err) {
      console.error('Failed to add board action', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseVoting = () => {
    if (!activeVoteModal) return;
    let f = 0, a = 0, ab = 0;
    Object.values(currentVotes).forEach(v => {
      if (v === 'FAVOUR') f++;
      if (v === 'AGAINST') a++;
      if (v === 'ABSTAIN') ab++;
    });
    const status = f > a ? 'PASSED' : 'REJECTED';
    setResolutions(resolutions.map(r => r.id === activeVoteModal.id ? { ...r, status, votes: { favour: f, against: a, abstain: ab } } : r));
    setActiveVoteModal(null);
    setCurrentVotes({});
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[var(--outline)] pb-5">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Enterprise Governance & Board Software • GCOMS
          </span>
          <h1 className="text-2xl font-bold mt-1 text-[var(--on-background)]">Board Governance & Oversight</h1>
          <p className="text-[var(--muted)] text-xs mt-0.5">Manage board convenings, official resolutions, committee memberships, and minutes logs.</p>
        </div>
        <div className="mt-3 lg:mt-0 flex flex-wrap gap-2">
          <button onClick={() => setActiveModal('meeting')} className="btn-primary text-xs bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]">
            + Convene Board Meeting
          </button>
          <button onClick={() => setActiveModal('resolution')} className="btn-primary text-xs bg-[var(--primary-dark)] border border-amber-800/40 text-amber-300">
            + Table New Resolution
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex border-b border-[var(--outline)] gap-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'meetings', label: 'Board Meetings' },
          { id: 'members', label: 'Board Members' },
          { id: 'resolutions', label: 'Resolutions & Voting' },
          { id: 'actions', label: 'Action Tracker' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as Parameters<typeof setActiveTab>[0])}
            className={`py-2.5 px-4 rounded-t border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id ? 'border-[var(--secondary)] text-[var(--secondary)] bg-white font-bold' : 'border-transparent text-[var(--muted)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* MODALS */}
      {activeModal === 'meeting' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Schedule Board Convening</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleMeetingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Meeting Title *</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Convening Date *</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Minutes / Agenda Document Link</label>
                <input type="url" value={formData.minutesUrl} onChange={e => setFormData({ ...formData, minutesUrl: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">{submitting ? 'Scheduling...' : 'Schedule Meeting'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'member' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4 h-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Add Board Member</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleMemberSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Full Name *</label>
                <input type="text" required value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Title / Designation *</label>
                <input type="text" required value={memberForm.title} onChange={e => setMemberForm({ ...memberForm, title: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Role on Board *</label>
                <select required value={memberForm.role} onChange={e => setMemberForm({ ...memberForm, role: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="CHAIRPERSON">CHAIRPERSON</option>
                  <option value="VICE_CHAIRPERSON">VICE_CHAIRPERSON</option>
                  <option value="SECRETARY">SECRETARY</option>
                  <option value="TREASURER">TREASURER</option>
                  <option value="MEMBER">MEMBER</option>
                  <option value="PATRON">PATRON</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Committee Membership</label>
                <div className="space-y-1">
                  {['Finance & Audit', 'Programme & Strategy', 'HR & Remuneration', 'Clinical Governance', 'Risk & Compliance'].map(c => (
                    <label key={c} className="flex items-center gap-2">
                      <input type="checkbox" checked={memberForm.committees.includes(c)} onChange={() => handleCommitteeToggle(c)} />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Phone</label>
                  <input type="tel" value={memberForm.phone} onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Email</label>
                  <input type="email" value={memberForm.email} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Term Start Date *</label>
                  <input type="date" required value={memberForm.termStart} onChange={e => setMemberForm({ ...memberForm, termStart: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Term End Date *</label>
                  <input type="date" required value={memberForm.termEnd} onChange={e => setMemberForm({ ...memberForm, termEnd: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'resolution' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4 h-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Table New Resolution</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleResolutionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Resolution Title *</label>
                <input type="text" required value={resolutionForm.title} onChange={e => setResolutionForm({ ...resolutionForm, title: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Meeting Date *</label>
                <input type="date" required value={resolutionForm.meetingDate} onChange={e => setResolutionForm({ ...resolutionForm, meetingDate: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Resolution Type *</label>
                <select required value={resolutionForm.resolutionType} onChange={e => setResolutionForm({ ...resolutionForm, resolutionType: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="POLICY">POLICY</option>
                  <option value="FINANCIAL_APPROVAL">FINANCIAL APPROVAL</option>
                  <option value="PROGRAMME_APPROVAL">PROGRAMME APPROVAL</option>
                  <option value="PERSONNEL">PERSONNEL</option>
                  <option value="GOVERNANCE_AMENDMENT">GOVERNANCE AMENDMENT</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Proposed By *</label>
                <select required value={resolutionForm.proposedBy} onChange={e => setResolutionForm({ ...resolutionForm, proposedBy: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="">Select Board Member</option>
                  {boardMembers.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Seconded By *</label>
                <select required value={resolutionForm.secondedBy} onChange={e => setResolutionForm({ ...resolutionForm, secondedBy: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="">Select Board Member</option>
                  {boardMembers.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Resolution Text *</label>
                <textarea required rows={4} value={resolutionForm.description} onChange={e => setResolutionForm({ ...resolutionForm, description: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Table Resolution</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'action' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Add Action Item</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Action Description *</label>
                <input type="text" required value={actionForm.description} onChange={e => setActionForm({ ...actionForm, description: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Responsible Person *</label>
                <select required value={actionForm.responsible} onChange={e => setActionForm({ ...actionForm, responsible: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="">Select Board Member</option>
                  {boardMembers.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Due Date *</label>
                  <input type="date" required value={actionForm.due} onChange={e => setActionForm({ ...actionForm, due: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Priority *</label>
                  <select required value={actionForm.priority} onChange={e => setActionForm({ ...actionForm, priority: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Source Meeting *</label>
                <select value={actionForm.meetingId} onChange={e => setActionForm({ ...actionForm, meetingId: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="">Not tied to a meeting</option>
                  {meetings.map(m => (
                    <option key={m.id} value={m.id}>{m.title} — {new Date(m.meetingDate).toLocaleDateString()}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Add Action</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeVoteModal && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Open Voting: {activeVoteModal.resolutionNo}</h2>
              <button onClick={() => setActiveVoteModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <div className="text-xs space-y-4">
              <div className="p-3 bg-slate-50 rounded border">{activeVoteModal.title}</div>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                {boardMembers.map(b => (
                  <div key={b.id} className="flex justify-between items-center p-2 border rounded hover:bg-slate-50">
                    <span className="font-bold">{b.name} <span className="text-gray-500 font-normal">({b.role})</span></span>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentVotes({ ...currentVotes, [b.id]: 'FAVOUR' })} className={`px-2 py-1 rounded border ${currentVotes[b.id] === 'FAVOUR' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50'}`}>IN FAVOUR</button>
                      <button onClick={() => setCurrentVotes({ ...currentVotes, [b.id]: 'AGAINST' })} className={`px-2 py-1 rounded border ${currentVotes[b.id] === 'AGAINST' ? 'bg-red-600 text-white' : 'hover:bg-red-50'}`}>AGAINST</button>
                      <button onClick={() => setCurrentVotes({ ...currentVotes, [b.id]: 'ABSTAIN' })} className={`px-2 py-1 rounded border ${currentVotes[b.id] === 'ABSTAIN' ? 'bg-gray-600 text-white' : 'hover:bg-gray-50'}`}>ABSTAIN</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center p-3 bg-[var(--background)] rounded border font-bold">
                <span>Tallying Votes:</span>
                <span className="text-emerald-700">In Favour: {Object.values(currentVotes).filter(v => v === 'FAVOUR').length}</span>
                <span className="text-red-700">Against: {Object.values(currentVotes).filter(v => v === 'AGAINST').length}</span>
                <span className="text-gray-700">Abstain: {Object.values(currentVotes).filter(v => v === 'ABSTAIN').length}</span>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveVoteModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button onClick={handleCloseVoting} className="btn-primary text-xs bg-[var(--nav-surface)]">Close Voting & Record Result</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Board Convenings</span>
          <p className="text-3xl font-bold text-[var(--primary)] mt-1 tabular-nums">{meetings.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Board Members</span>
          <p className="text-3xl font-bold text-[var(--secondary)] mt-1 tabular-nums">{boardMembers.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Passed Resolutions</span>
          <p className="text-3xl font-bold text-[var(--risk-low-text)] mt-1 tabular-nums">{resolutions.filter(r => r.status === 'PASSED').length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Pending Actions</span>
          <p className="text-3xl font-bold text-[var(--risk-mod-text)] mt-1 tabular-nums">{actions.filter(a => a.status === 'PENDING').length}</p>
        </div>
      </div>

      {/* TAB 1: MEETINGS */}
      {activeTab === 'meetings' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
          <div className="p-4 border-b border-[var(--outline)] font-bold text-[var(--primary)] text-sm bg-[var(--background)]">
            Board Meetings & Minutes Log
          </div>
          {loading ? (
            <div className="p-8 text-center text-xs text-[var(--muted)]">Loading board meetings...</div>
          ) : meetings.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--muted)]">No board meetings recorded yet.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                <tr>
                  <th className="p-3">Meeting Title</th>
                  <th className="p-3">Convening Date</th>
                  <th className="p-3">Minutes Link</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
                {meetings.map((m) => (
                  <tr key={m.id} className="hover:bg-[var(--primary-surface)]">
                    <td className="p-3 font-bold text-[var(--primary)]">{m.title}</td>
                    <td className="p-3 text-[var(--muted)] tabular-nums">{new Date(m.meetingDate).toLocaleDateString()}</td>
                    <td className="p-3">
                      {m.minutesUrl ? (
                        <a href={m.minutesUrl} target="_blank" rel="noreferrer" className="text-[var(--secondary)] font-bold hover:underline">
                          View Minutes
                        </a>
                      ) : (
                        <span className="text-[var(--muted)]">Pending Upload</span>
                      )}
                    </td>
                    <td className="p-3"><span className="badge-low-risk">{m.status || 'SCHEDULED'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 2: BOARD MEMBERS */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--outline)] pb-2">
            <h2 className="font-bold text-[var(--primary)] text-sm">Board of Directors & Standing Committees</h2>
            <button onClick={() => setActiveModal('member')} className="btn-primary text-xs bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]">+ Add Board Member</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {boardMembers.map((b) => (
              <div key={b.id} className="p-4 bg-[var(--background)] border border-[var(--outline)] rounded space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-[var(--primary)] text-sm">{b.name}</p>
                    <p className="text-[var(--muted)]">{b.title}</p>
                  </div>
                  <span className="px-1.5 py-0.5 bg-[var(--primary-surface)] text-[var(--primary)] rounded font-bold text-[9px]">{b.role}</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-[10px] text-[var(--muted)] font-bold">Committees:</p>
                  <p className="text-[var(--secondary)] font-semibold">{b.committees || 'None assigned'}</p>
                </div>
                <div className="text-[10px] text-[var(--muted)] space-y-0.5">
                  <p>{b.phone}</p>
                  <p>{b.email}</p>
                  <p>Term: {b.termStart} to {b.termEnd}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RESOLUTIONS */}
      {activeTab === 'resolutions' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
          <div className="p-4 border-b border-[var(--outline)] flex justify-between items-center bg-[var(--background)]">
            <div className="font-bold text-[var(--primary)] text-sm">Official Board Resolutions</div>
            <button onClick={() => setActiveModal('resolution')} className="btn-primary text-xs bg-[var(--primary-dark)] text-white">
              + Table New Resolution
            </button>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
              <tr>
                <th className="p-3">Res No. & Title</th>
                <th className="p-3">Type</th>
                <th className="p-3">Meeting Date</th>
                <th className="p-3">Proposed / Seconded</th>
                <th className="p-3">Status & Votes</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
              {resolutions.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--primary-surface)] align-top">
                  <td className="p-3 w-64">
                    <span className="font-bold text-[var(--secondary)]">{r.resolutionNo}</span>
                    <p className="font-bold text-[var(--primary)] mt-0.5">{r.title}</p>
                    <p className="text-[10px] text-[var(--muted)] mt-1 line-clamp-2" title={r.description}>{r.description}</p>
                  </td>
                  <td className="p-3">{r.resolutionType}</td>
                  <td className="p-3 tabular-nums">{r.meetingDate ? new Date(r.meetingDate).toLocaleDateString() : '—'}</td>
                  <td className="p-3 text-[10px]">
                    <p>P: {r.proposedBy || '—'}</p>
                    <p>S: {r.secondedBy || '—'}</p>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${r.status === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : r.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                      {r.status}
                    </span>
                    {r.status !== 'TABLED' && (
                      <p className="text-[9px] mt-1 text-[var(--muted)]">
                        {r.votesFor} In Favour, {r.votesAgainst} Against, {r.abstentions} Abstain
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    {r.status === 'TABLED' && (
                      <button onClick={() => setActiveVoteModal(r)} className="bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-emerald-800">
                        Open Voting
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: ACTIONS */}
      {activeTab === 'actions' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
          <div className="p-4 border-b border-[var(--outline)] flex justify-between items-center bg-[var(--background)]">
            <div className="font-bold text-[var(--primary)] text-sm">Action Tracker</div>
            <button onClick={() => setActiveModal('action')} className="btn-primary text-xs bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]">
              + Add Action Item
            </button>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
              <tr>
                <th className="p-3">Action Description</th>
                <th className="p-3">Responsible</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Source Meeting</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
              {actions.map((a) => (
                <tr key={a.id} className={`hover:bg-[var(--primary-surface)] ${a.status === 'COMPLETED' ? 'opacity-60' : ''}`}>
                  <td className="p-3 font-bold text-[var(--primary)] w-64">{a.description}</td>
                  <td className="p-3">{a.responsible}</td>
                  <td className="p-3 tabular-nums">{String(a.dueDate ?? '').slice(0, 10)}</td>
                  <td className="p-3">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${a.priority === 'HIGH' ? 'bg-red-100 text-red-700' : a.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {a.priority}
                    </span>
                  </td>
                  <td className="p-3 text-[var(--muted)]">{a.meeting?.title ?? '—'}</td>
                  <td className="p-3">
                    {a.status === 'PENDING' ? (
                      <button onClick={() => setActions(actions.map(x => x.id === a.id ? { ...x, status: 'COMPLETED' } : x))} className="text-emerald-700 font-bold hover:underline border border-emerald-700 px-2 py-1 rounded">
                        Mark Complete
                      </button>
                    ) : (
                      <span className="text-[var(--risk-low-text)] font-bold px-2 py-1">✓ Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
