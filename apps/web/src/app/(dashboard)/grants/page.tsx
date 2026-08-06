'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AccessDenied } from '@/components/AccessDenied';

function GrantsPageContent() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const allowedRoles = ['EXECUTIVE', 'BOARD', 'SUPER_ADMIN', 'SYSTEM_ADMIN', 'ADMIN', 'GRANT_MANAGER'];

  const [activeTab, setActiveTab] = useState<'grants' | 'pipeline' | 'donors' | 'milestones' | 'reports'>('grants');
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<null | 'grant' | 'donor' | 'milestone' | 'pipeline' | 'report' | 'milestone_progress' | 'report_submit'>(null);

  const [formData, setFormData] = useState({
    title: '', donorName: 'Global Fund for Health', amount: '', startDate: new Date().toISOString().split('T')[0], endDate: '2026-12-31',
  });
  const [submitting, setSubmitting] = useState(false);

  const [donors, setDonors] = useState([
    { id: 1, org: 'Global Fund for Health', country: 'Switzerland', type: 'MULTILATERAL', contact: 'Dr. Marcus Vance', title: 'Grant Officer', email: 'm.vance@globalfund.org', phone: '+41-22-791-1700', interests: ['Cervical Cancer', 'HIV/AIDS'], lastComm: '2026-06-15', notes: 'Key strategic partner. Q3 disbursement expected Aug 2026.' },
    { id: 2, org: 'World Health Organization (WHO)', country: 'Switzerland', type: 'MULTILATERAL', contact: 'Dr. Amina Touré', title: 'Regional Lead', email: 'tourea@who.int', phone: '+41-22-791-2111', interests: ['Cervical Cancer', 'Health Systems'], lastComm: '2026-05-20', notes: 'Technical assistance provider. Funding review in Oct 2026.' },
    { id: 3, org: 'USAID Global Health Initiative', country: 'USA', type: 'BILATERAL', contact: 'Ms. Jennifer Parks', title: 'Senior Grants Manager', email: 'jparks@usaid.gov', phone: '+1-202-712-4810', interests: ['Malaria', 'Cervical Cancer', 'WASH'], lastComm: '2026-04-10', notes: 'Grant application submitted Mar 2026, awaiting decision.' },
    { id: 4, org: 'Bill & Melinda Gates Foundation', country: 'USA', type: 'FOUNDATION', contact: 'Mr. Raj Patel', title: 'Program Officer', email: 'rpatel@gatesfoundation.org', phone: '+1-206-709-3100', interests: ['Nutrition', 'Health Systems', 'Cervical Cancer'], lastComm: '2026-03-01', notes: 'LOI submitted. Follow-up meeting scheduled Sept 2026.' }
  ]);
  const [donorForm, setDonorForm] = useState({ org: '', country: '', type: 'BILATERAL', contact: '', title: '', email: '', phone: '', interests: [] as string[], lastComm: '', notes: '' });

  // Milestones live in the GrantMilestone table. This was a hardcoded array
  // while six real rows sat in the database with no endpoint to read them.
  const [milestones, setMilestones] = useState<any[]>([]);
  const [milestoneForm, setMilestoneForm] = useState({ grantId: '', title: '', description: '', due: '', metric: '' });
  const [milestoneUpdateData, setMilestoneUpdateData] = useState({ id: 0, progress: 0, notes: '' });

  const [pipeline, setPipeline] = useState<any[]>([]);
  const [pipelineForm, setPipelineForm] = useState({ title: '', donor: '', value: '', deadline: '', status: 'ELIGIBLE', stage: 'IDENTIFIED', notes: '' });

  const [reports, setReports] = useState([
    { id: 1, grant: 'Global Fund Cervical Cancer Initiative 2025-2027', type: 'QUARTERLY', title: 'Q3 Financial & Programmatic Report', due: '2026-10-15', officer: 'Sarah Connor', status: 'UPCOMING' },
    { id: 2, grant: 'WHO Health Systems Strengthening Grant', type: 'SEMI_ANNUAL', title: 'Mid-Year Implementation Review', due: '2026-08-10', officer: 'Dr. James Okafor', status: 'UPCOMING' },
    { id: 3, grant: 'USAID Community Health Initiative', type: 'SPECIAL', title: 'Baseline M&E Framework Submission', due: '2026-07-20', officer: 'M&E Team Lead', status: 'SUBMITTED' },
    { id: 4, grant: 'Bill & Melinda Gates Foundation (Planning)', type: 'FINANCIAL_AUDIT', title: 'Pre-Award Audit Clearance', due: '2026-09-01', officer: 'Finance Director', status: 'UPCOMING' }
  ]);
  const [reportForm, setReportForm] = useState({ grant: '', type: 'QUARTERLY', title: '', due: '', officer: '' });
  const [reportSubmitData, setReportSubmitData] = useState({ id: 0, submitDate: '', ref: '' });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['grants', 'pipeline', 'donors', 'milestones', 'reports'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  const fetchGrants = async () => {
    setLoading(true);
    try {
      const res = await api.get('/grants');
      setGrants(res.data);
      const allGrants = res.data || [];
      const donorRecords = allGrants.filter((g: any) => g.type === 'DONOR_RECORD' || g.grantType === 'DONOR_RECORD');
      if (donorRecords.length > 0) {
        setDonors(prev => [...prev.filter(d => !donorRecords.find((dr: any) => dr.donorName === d.org)), ...donorRecords.map((dr: any) => ({ ...dr, id: dr.id || Date.now(), org: dr.donorName, country: dr.country || '', type: dr.type || 'BILATERAL', contact: dr.contact || '', title: dr.title || '', email: dr.email || '', phone: dr.phone || '', interests: dr.interests || [], lastComm: dr.lastComm || '', notes: dr.notes || '' }))]);
      }
    } catch (err) {
      console.error('Failed to load grants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && allowedRoles.includes(user.role)) {
      fetchGrants();
      fetchMilestones();
      fetchProposals();
    }
  }, [user]);

  if (user && !allowedRoles.includes(user.role)) {
    return <AccessDenied requiredRole="Grant Manager / Executive" />;
  }

  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/grants', formData);
      setActiveModal(null);
      setFormData({ title: '', donorName: 'Global Fund for Health', amount: '', startDate: new Date().toISOString().split('T')[0], endDate: '2026-12-31' });
      fetchGrants();
    } catch (err) {
      console.error('Failed to create grant', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDonorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDonors([...donors, { id: Date.now(), ...donorForm }]);
    api.post('/grants', { type: 'DONOR_RECORD', grantTitle: donorForm.org || 'Donor', donorName: donorForm.org, amount: '0', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }).catch(() => {});
    setActiveModal(null);
    setDonorForm({ org: '', country: '', type: 'BILATERAL', contact: '', title: '', email: '', phone: '', interests: [], lastComm: '', notes: '' });
  };

  const fetchProposals = async () => {
    try {
      const res = await api.get('/grants/proposals');
      setPipeline(res.data);
    } catch (err) { console.error('Failed to fetch proposals', err); }
  };

  const fetchMilestones = async () => {
    try {
      const res = await api.get('/grants/milestones');
      setMilestones(res.data);
    } catch (err) {
      console.error('Failed to fetch milestones', err);
    }
  };

  const handleMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // This used to POST a fabricated Grant row with type: 'MILESTONE',
      // inserting junk into the grants table on every milestone created.
      await api.post('/grants/milestones', {
        grantId: milestoneForm.grantId,
        title: milestoneForm.title,
        dueDate: milestoneForm.due,
        metric: milestoneForm.metric || undefined,
        description: milestoneForm.description || undefined,
      });
      setActiveModal(null);
      setMilestoneForm({ grantId: '', title: '', description: '', due: '', metric: '' });
      await fetchMilestones();
    } catch (err) {
      console.error('Failed to create milestone', err);
    }
  };

  const handleMilestoneUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/grants/milestones/${milestoneUpdateData.id}`, {
        progress: Number(milestoneUpdateData.progress),
      });
      setActiveModal(null);
      await fetchMilestones();
    } catch (err) {
      console.error('Failed to update milestone progress', err);
    }
  };

  const handlePipelineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPipeline([...pipeline, { id: Date.now(), ...pipelineForm, value: Number(pipelineForm.value) }]);
    api.post('/grants', { type: 'PIPELINE_OPPORTUNITY', grantTitle: pipelineForm.title || 'Pipeline Opportunity', donorName: pipelineForm.donor || 'TBD', amount: String(pipelineForm.value) || '0', startDate: new Date().toISOString().split('T')[0], endDate: pipelineForm.deadline || new Date().toISOString().split('T')[0] }).catch(() => {});
    setActiveModal(null);
    setPipelineForm({ title: '', donor: '', value: '', deadline: '', status: 'ELIGIBLE', stage: 'IDENTIFIED', notes: '' });
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReports([...reports, { id: Date.now(), ...reportForm, status: 'UPCOMING' }]);
    api.post('/grants', { type: 'REPORT_SCHEDULE', grantTitle: reportForm.grant || 'Report', donorName: 'Internal', amount: '0', startDate: reportForm.due || new Date().toISOString().split('T')[0], endDate: reportForm.due || new Date().toISOString().split('T')[0] }).catch(() => {});
    setActiveModal(null);
    setReportForm({ grant: '', type: 'QUARTERLY', title: '', due: '', officer: '' });
  };

  const handleReportMarkSubmitted = (e: React.FormEvent) => {
    e.preventDefault();
    setReports(reports.map(r => r.id === reportSubmitData.id ? { ...r, status: 'SUBMITTED' } : r));
    setActiveModal(null);
  };

  const toggleInterest = (interest: string) => {
    setDonorForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest) ? prev.interests.filter(i => i !== interest) : [...prev.interests, interest]
    }));
  };

  const totalFunding = grants.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
  const activeDonors = donors.length;
  const milestonesCompleted = milestones.filter(m => m.status === 'COMPLETED').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-[#002045] text-white p-5 rounded-lg border border-[#1a365d] shadow-sm">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#13696a] text-white uppercase tracking-wider">
            Enterprise Grants & Donor Software • GCOMS
          </span>
          <h1 className="text-2xl font-bold mt-1 text-white">Donor & Grant Portfolio Management</h1>
          <p className="text-slate-300 text-xs mt-0.5">Track donor organizations, grant applications, funding allocations, and milestone compliance.</p>
        </div>
        <div className="mt-3 lg:mt-0 flex flex-wrap gap-2">
          <button onClick={() => setActiveModal('grant')} className="btn-primary text-xs bg-[#13696a] hover:bg-[#0f5455]">
            + Register Grant Award
          </button>
          <button onClick={() => setActiveModal('pipeline')} className="btn-primary text-xs bg-indigo-700 hover:bg-indigo-800">
            + Track Opportunity
          </button>
          <button onClick={() => { setActiveTab('milestones'); setActiveModal('milestone'); }} className="btn-primary text-xs bg-cyan-700 hover:bg-cyan-800">
            + Add Milestone
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex border-b border-[#e2e8f0] gap-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'grants', label: '📜 Grant Portfolio & Active Awards' },
          { id: 'pipeline', label: '📈 Opportunity Pipeline' },
          { id: 'donors', label: '🏗 Donor CRM Directory' },
          { id: 'milestones', label: '🎯 Milestone & Deliverables Tracker' },
          { id: 'reports', label: '📊 Reporting Schedule & Compliance' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`py-2.5 px-4 rounded-t border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id ? 'border-[#13696a] text-[#13696a] bg-white font-bold' : 'border-transparent text-[#74777f]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase">Total Active Grants</span>
          <p className="text-3xl font-bold text-[#002045] mt-1 tabular-nums">{grants.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase">Total Portfolio Funding</span>
          <p className="text-3xl font-bold text-[#22543d] mt-1 tabular-nums">₦{totalFunding.toLocaleString()}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase">Active Donors</span>
          <p className="text-3xl font-bold text-[#13696a] mt-1 tabular-nums">{activeDonors}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase">Milestones Completed</span>
          <p className="text-3xl font-bold text-[#92400e] mt-1 tabular-nums">{milestonesCompleted} / {milestones.length}</p>
        </div>
      </div>

      {/* TAB 1: GRANTS TABLE */}
      {activeTab === 'grants' && (
        <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
          <div className="p-4 border-b border-[#e2e8f0] font-bold text-[#002045] text-sm bg-[#f8f9ff]">
            📜 Registered Grant Awards
          </div>
          {loading ? (
            <div className="p-8 text-center text-xs text-[#74777f]">Loading grants...</div>
          ) : grants.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#74777f]">No grants registered yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
                  <tr>
                    <th className="p-3">Grant Project Title</th>
                    <th className="p-3">Donor Organization</th>
                    <th className="p-3">Award Funding</th>
                    <th className="p-3">Project Duration</th>
                    <th className="p-3">Executive Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0d1c2e]">
                  {grants.map((g) => (
                    <tr key={g.id} className="hover:bg-[#e5eeff]">
                      <td className="p-3 font-bold text-[#002045]">{g.title}</td>
                      <td className="p-3 text-[#13696a] font-semibold">{g.donorName}</td>
                      <td className="p-3 font-bold font-mono tabular-nums text-[#002045]">₦{Number(g.amount).toLocaleString()}</td>
                      <td className="p-3 text-[#74777f] tabular-nums">
                        {new Date(g.startDate).toLocaleDateString()} - {new Date(g.endDate).toLocaleDateString()}
                      </td>
                      <td className="p-3"><span className="badge-low-risk">{g.status || 'ACTIVE'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-[#e2e8f0] bg-[#f8f9ff]">
            <h2 className="font-bold text-[#002045] text-sm">📈 Opportunity Pipeline</h2>
            <button onClick={() => setActiveModal('pipeline')} className="btn-primary text-xs bg-indigo-700 hover:bg-indigo-800">+ Track Opportunity</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
                <tr>
                  <th className="p-3">Programme Title</th>
                  <th className="p-3">Donor</th>
                  <th className="p-3">Estimated Value</th>
                  <th className="p-3">Deadline</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0d1c2e]">
                {pipeline.map(p => (
                  <tr key={p.id} className="hover:bg-[#e5eeff]">
                    <td className="p-3 font-bold text-[#002045]">{p.title}</td>
                    <td className="p-3">{p.donor}</td>
                    <td className="p-3 font-mono">₦{p.value.toLocaleString()}</td>
                    <td className="p-3">{p.deadline}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">{p.stage}</span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => {
                        const stages = ['IDENTIFIED', 'LOI_SUBMITTED', 'PROPOSAL_SUBMITTED', 'UNDER_REVIEW', 'AWARDED', 'REJECTED'];
                        const idx = stages.indexOf(p.stage);
                        if(idx > -1 && idx < stages.length - 1) {
                          setPipeline(pipeline.map(x => x.id === p.id ? { ...x, stage: stages[idx+1] } : x));
                        }
                      }} className="btn-secondary text-[10px] px-2 py-1">Next Stage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DONORS */}
      {activeTab === 'donors' && (
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-5 space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-2">
            <h2 className="font-bold text-[#002045] text-sm">🏗 Donor CRM Directory & Contacts</h2>
            <button onClick={() => setActiveModal('donor')} className="btn-primary text-xs">+ Register Donor</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {donors.map(d => {
              const donorGrants = grants.filter(g => g.donorName === d.org).length;
              return (
                <div key={d.id} className="p-4 bg-[#f8f9ff] border border-[#e2e8f0] rounded space-y-2">
                  <div className="flex justify-between font-bold text-[#002045]">
                    <span>{d.org}</span>
                    <span className="badge-low-risk">{d.type}</span>
                  </div>
                  <p className="text-[#74777f] text-[10px] uppercase">{d.country}</p>
                  <p className="text-[#13696a] font-semibold">{d.contact} <span className="text-[#74777f] font-normal">({d.title})</span></p>
                  <p className="text-[#74777f] font-mono">{d.email} • {d.phone}</p>
                  <div className="flex flex-wrap gap-1 my-1">
                    {d.interests.map((i, idx) => <span key={idx} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] rounded-full">{i}</span>)}
                  </div>
                  <div className="flex justify-between items-end mt-2 pt-2 border-t border-[#e2e8f0]">
                    <span className="text-[#22543d] font-bold text-[10px] uppercase">{donorGrants} Active Grants</span>
                    <span className="text-[#74777f] text-[10px]">Last Comm: {d.lastComm}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-5 space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-2">
            <h2 className="font-bold text-[#002045] text-sm">🎯 Milestone & Deliverables Tracker</h2>
            <button onClick={() => setActiveModal('milestone')} className="btn-primary text-xs bg-cyan-700 hover:bg-cyan-800">+ Add Milestone</button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {milestones.map(m => {
              let badgeColor = 'bg-gray-100 text-gray-800';
              if (m.status === 'COMPLETED') badgeColor = 'bg-green-100 text-green-800';
              else if (m.status === 'IN_PROGRESS') badgeColor = 'bg-blue-100 text-blue-800';
              else if (m.status === 'OVERDUE') badgeColor = 'bg-red-100 text-red-800';
              
              return (
                <div key={m.id} className="p-4 bg-white border border-[#e2e8f0] rounded-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#002045] text-sm">{m.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeColor}`}>{m.status}</span>
                    </div>
                    <p className="text-[#74777f] text-[11px]">{m.grant?.grantName}</p>
                    <p className="text-[#0d1c2e] font-semibold text-[11px]">Metric: {m.metric || '—'} <span className="text-[#74777f] ml-2">Due: {m.dueDate ? String(m.dueDate).slice(0, 10) : '—'}</span></p>
                  </div>
                  <div className="w-full md:w-48 space-y-2">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-[#74777f]">Progress</span>
                      <span className="text-[#13696a]">{m.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded overflow-hidden">
                      <div className={`h-full ${m.progress === 100 ? 'bg-green-600' : 'bg-[#13696a]'}`} style={{ width: `${m.progress}%` }} />
                    </div>
                    {m.status !== 'COMPLETED' && (
                      <button onClick={() => {
                        setMilestoneUpdateData({ id: m.id, progress: m.progress, notes: '' });
                        setActiveModal('milestone_progress');
                      }} className="btn-secondary w-full text-[10px] py-1 mt-1">Update Progress</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-[#e2e8f0] bg-[#f8f9ff]">
            <h2 className="font-bold text-[#002045] text-sm">📊 Reporting Schedule & Compliance</h2>
            <button onClick={() => setActiveModal('report')} className="btn-primary text-xs">+ Add Obligation</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
                <tr>
                  <th className="p-3">Grant</th>
                  <th className="p-3">Report Type</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Responsible Officer</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0d1c2e]">
                {reports.map(r => {
                  const daysToDue = Math.ceil((new Date(r.due).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  const isOverdue = r.status !== 'SUBMITTED' && daysToDue < 0;
                  const isSoon = r.status !== 'SUBMITTED' && daysToDue >= 0 && daysToDue <= 14;
                  return (
                    <tr key={r.id} className={`hover:bg-[#e5eeff] ${isOverdue ? 'bg-red-50' : isSoon ? 'bg-orange-50' : ''}`}>
                      <td className="p-3 text-[#74777f]">{r.grant}</td>
                      <td className="p-3 font-semibold">{r.type}</td>
                      <td className="p-3 font-bold text-[#002045]">{r.title}</td>
                      <td className={`p-3 ${isOverdue ? 'text-red-700 font-bold' : isSoon ? 'text-orange-700 font-bold' : ''}`}>{r.due}</td>
                      <td className="p-3">{r.officer}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'SUBMITTED' ? 'bg-green-100 text-green-800' : isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                          {isOverdue ? 'OVERDUE' : r.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {r.status !== 'SUBMITTED' && (
                          <button onClick={() => {
                            setReportSubmitData({ id: r.id, submitDate: new Date().toISOString().split('T')[0], ref: '' });
                            setActiveModal('report_submit');
                          }} className="btn-secondary text-[10px] px-2 py-1 bg-white">Mark Submitted</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* Register Grant Award */}
      {activeModal === 'grant' && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
              <h2 className="text-base font-bold text-[#002045]">Register Grant Award</h2>
              <button onClick={() => setActiveModal(null)} className="text-[#74777f] font-bold">✕</button>
            </div>
            <form onSubmit={handleGrantSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Grant Project Title *</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Donor Organization *</label>
                <select value={formData.donorName} onChange={e => setFormData({ ...formData, donorName: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs">
                  {donors.map(d => <option key={d.id} value={d.org}>{d.org}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Total Grant Award (₦) *</label>
                <input type="number" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs tabular-nums" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0d1c2e] mb-1">Start Date *</label>
                  <input type="date" required value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs tabular-nums" />
                </div>
                <div>
                  <label className="block font-semibold text-[#0d1c2e] mb-1">End Date *</label>
                  <input type="date" required value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs tabular-nums" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">{submitting ? 'Registering...' : 'Save Grant Award'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Donor Modal */}
      {activeModal === 'donor' && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg border border-[#e2e8f0] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
              <h2 className="text-base font-bold text-[#002045]">+ Register Donor</h2>
              <button onClick={() => setActiveModal(null)} className="text-[#74777f] font-bold">✕</button>
            </div>
            <form onSubmit={handleDonorSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-[#0d1c2e] mb-1">Organization Name *</label>
                  <input type="text" required value={donorForm.org} onChange={e => setDonorForm({ ...donorForm, org: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[#0d1c2e] mb-1">Country *</label>
                  <input type="text" required value={donorForm.country} onChange={e => setDonorForm({ ...donorForm, country: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[#0d1c2e] mb-1">Donor Type *</label>
                  <select value={donorForm.type} onChange={e => setDonorForm({ ...donorForm, type: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs">
                    <option value="BILATERAL">BILATERAL</option>
                    <option value="MULTILATERAL">MULTILATERAL</option>
                    <option value="FOUNDATION">FOUNDATION</option>
                    <option value="CORPORATE">CORPORATE</option>
                    <option value="INDIVIDUAL">INDIVIDUAL</option>
                  </select>
                </div>
                <div className="col-span-2 border-t border-[#e2e8f0] pt-2 mt-1">
                  <h3 className="font-bold text-[#002045] mb-2">Primary Contact</h3>
                </div>
                <div>
                  <label className="block font-semibold text-[#0d1c2e] mb-1">Contact Name</label>
                  <input type="text" required value={donorForm.contact} onChange={e => setDonorForm({ ...donorForm, contact: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[#0d1c2e] mb-1">Contact Title</label>
                  <input type="text" value={donorForm.title} onChange={e => setDonorForm({ ...donorForm, title: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[#0d1c2e] mb-1">Email</label>
                  <input type="email" required value={donorForm.email} onChange={e => setDonorForm({ ...donorForm, email: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[#0d1c2e] mb-1">Phone</label>
                  <input type="tel" value={donorForm.phone} onChange={e => setDonorForm({ ...donorForm, phone: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-[#0d1c2e] mb-1">Areas of Interest</label>
                  <div className="flex flex-wrap gap-2">
                    {['Cervical Cancer', 'HIV/AIDS', 'Malaria', 'WASH', 'Nutrition', 'Health Systems'].map(i => (
                      <label key={i} className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={donorForm.interests.includes(i)} onChange={() => toggleInterest(i)} /> {i}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-[#0d1c2e] mb-1">Last Communication</label>
                  <input type="date" value={donorForm.lastComm} onChange={e => setDonorForm({ ...donorForm, lastComm: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-[#0d1c2e] mb-1">Notes</label>
                  <textarea rows={2} value={donorForm.notes} onChange={e => setDonorForm({ ...donorForm, notes: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Register Donor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {activeModal === 'milestone' && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
              <h2 className="text-base font-bold text-[#002045]">+ Add Milestone</h2>
              <button onClick={() => setActiveModal(null)} className="text-[#74777f] font-bold">✕</button>
            </div>
            <form onSubmit={handleMilestoneSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Grant *</label>
                <select required value={milestoneForm.grantId} onChange={e => setMilestoneForm({ ...milestoneForm, grantId: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs">
                  <option value="">-- Select Grant --</option>
                  {grants.map((g: any) => <option key={g.id} value={g.id}>{g.grantName} ({g.donorName})</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Milestone Title *</label>
                <input type="text" required value={milestoneForm.title} onChange={e => setMilestoneForm({ ...milestoneForm, title: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Description</label>
                <textarea rows={2} value={milestoneForm.description} onChange={e => setMilestoneForm({ ...milestoneForm, description: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Due Date *</label>
                <input type="date" required value={milestoneForm.due} onChange={e => setMilestoneForm({ ...milestoneForm, due: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Target Metric *</label>
                <input type="text" required value={milestoneForm.metric} onChange={e => setMilestoneForm({ ...milestoneForm, metric: e.target.value })} placeholder="e.g. 2,500 VIA screenings" className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Save Milestone</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Milestone Progress */}
      {activeModal === 'milestone_progress' && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
              <h2 className="text-base font-bold text-[#002045]">Update Progress</h2>
              <button onClick={() => setActiveModal(null)} className="text-[#74777f] font-bold">✕</button>
            </div>
            <form onSubmit={handleMilestoneUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Progress % (0-100) *</label>
                <input type="number" min="0" max="100" required value={milestoneUpdateData.progress} onChange={e => setMilestoneUpdateData({ ...milestoneUpdateData, progress: parseInt(e.target.value) })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs tabular-nums" />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Update Notes</label>
                <input type="text" value={milestoneUpdateData.notes} onChange={e => setMilestoneUpdateData({ ...milestoneUpdateData, notes: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Track Opportunity (Pipeline) Modal */}
      {activeModal === 'pipeline' && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
              <h2 className="text-base font-bold text-[#002045]">+ Track Opportunity</h2>
              <button onClick={() => setActiveModal(null)} className="text-[#74777f] font-bold">✕</button>
            </div>
            <form onSubmit={handlePipelineSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Grant/Programme Title *</label>
                <input type="text" required value={pipelineForm.title} onChange={e => setPipelineForm({ ...pipelineForm, title: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Donor Organization *</label>
                <input type="text" required value={pipelineForm.donor} onChange={e => setPipelineForm({ ...pipelineForm, donor: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Estimated Value (₦) *</label>
                <input type="number" required value={pipelineForm.value} onChange={e => setPipelineForm({ ...pipelineForm, value: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs tabular-nums" />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Application Deadline *</label>
                <input type="date" required value={pipelineForm.deadline} onChange={e => setPipelineForm({ ...pipelineForm, deadline: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0d1c2e] mb-1">Eligibility Status *</label>
                  <select value={pipelineForm.status} onChange={e => setPipelineForm({ ...pipelineForm, status: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs">
                    <option value="ELIGIBLE">ELIGIBLE</option>
                    <option value="INELIGIBLE">INELIGIBLE</option>
                    <option value="ASSESSING">ASSESSING</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#0d1c2e] mb-1">Pipeline Stage *</label>
                  <select value={pipelineForm.stage} onChange={e => setPipelineForm({ ...pipelineForm, stage: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs">
                    <option value="IDENTIFIED">IDENTIFIED</option>
                    <option value="LOI_SUBMITTED">LOI_SUBMITTED</option>
                    <option value="PROPOSAL_SUBMITTED">PROPOSAL_SUBMITTED</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="AWARDED">AWARDED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Notes</label>
                <textarea rows={2} value={pipelineForm.notes} onChange={e => setPipelineForm({ ...pipelineForm, notes: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Save Opportunity</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Reporting Obligation Modal */}
      {activeModal === 'report' && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
              <h2 className="text-base font-bold text-[#002045]">+ Add Reporting Obligation</h2>
              <button onClick={() => setActiveModal(null)} className="text-[#74777f] font-bold">✕</button>
            </div>
            <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Grant *</label>
                <select required value={reportForm.grant} onChange={e => setReportForm({ ...reportForm, grant: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs">
                  <option value="">-- Select Grant --</option>
                  {grants.map(g => <option key={g.id} value={g.title}>{g.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Report Type *</label>
                <select value={reportForm.type} onChange={e => setReportForm({ ...reportForm, type: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs">
                  <option value="QUARTERLY">QUARTERLY</option>
                  <option value="SEMI_ANNUAL">SEMI_ANNUAL</option>
                  <option value="ANNUAL">ANNUAL</option>
                  <option value="SPECIAL">SPECIAL</option>
                  <option value="FINANCIAL_AUDIT">FINANCIAL_AUDIT</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Report Title *</label>
                <input type="text" required value={reportForm.title} onChange={e => setReportForm({ ...reportForm, title: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Due Date *</label>
                <input type="date" required value={reportForm.due} onChange={e => setReportForm({ ...reportForm, due: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Responsible Officer *</label>
                <input type="text" required value={reportForm.officer} onChange={e => setReportForm({ ...reportForm, officer: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Save Report</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Report Submitted Modal */}
      {activeModal === 'report_submit' && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
              <h2 className="text-base font-bold text-[#002045]">Mark Submitted</h2>
              <button onClick={() => setActiveModal(null)} className="text-[#74777f] font-bold">✕</button>
            </div>
            <form onSubmit={handleReportMarkSubmitted} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Submission Date *</label>
                <input type="date" required value={reportSubmitData.submitDate} onChange={e => setReportSubmitData({ ...reportSubmitData, submitDate: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Reference Number / Link</label>
                <input type="text" value={reportSubmitData.ref} onChange={e => setReportSubmitData({ ...reportSubmitData, ref: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs bg-green-700 hover:bg-green-800">Confirm Submission</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function GrantsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#74777f]">Loading Grants Application...</div>}>
      <GrantsPageContent />
    </Suspense>
  );
}
