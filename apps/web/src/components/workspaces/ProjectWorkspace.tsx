'use client';

import type { Project, ProjectTask, Risk } from '@/types/api';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

export function ProjectWorkspace() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks' | 'risks' | 'budget' | 'changes'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<null | 'project' | 'task' | 'risk' | 'expense' | 'change'>(null);

  const [formData, setFormData] = useState({
    title: '',
    budget: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Tasks live in the ProjectTask table. This used to be a hardcoded array:
  // six real rows sat in the database with no endpoint able to read them.
  const [tasks, setTasks] = useState<ProjectTask[]>([]);

  const [risks, setRisks] = useState<Risk[]>([]);

  /**
   * Change requests have no table yet, so these live in the tab and are lost on
   * reload — flagged in the UI rather than presented as saved.
   */
  const [changeRequests, setChangeRequests] = useState<
    Array<{
      id: string;
      project: string;
      title: string;
      type: string;
      currentState: string;
      proposedChange: string;
      justification: string;
      impact: string;
      requestedBy: string;
      status: string;
    }>
  >([]);

  // Form States
  const [taskForm, setTaskForm] = useState({ title: '', projectId: '', assignee: '', dueDate: '', priority: 'MEDIUM', status: 'PENDING', description: '' });
  const [riskForm, setRiskForm] = useState({ title: '', projectId: '', category: 'OPERATIONAL', likelihood: 'MEDIUM', impact: 'MEDIUM', mitigation: '', owner: '', status: 'OPEN' });
  const [expenseForm, setExpenseForm] = useState({ project: '', description: '', amount: '', date: '', category: 'Administration' });
  const [changeForm, setChangeForm] = useState({ project: '', title: '', type: 'SCOPE_CHANGE', currentState: '', proposedChange: '', justification: '', impact: '', requestedBy: '' });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const actionParam = searchParams.get('action');

    if (tabParam && ['projects', 'tasks', 'risks', 'budget', 'changes'].includes(tabParam)) {
      setActiveTab(tabParam as Parameters<typeof setActiveTab>[0]);
    }
    if (actionParam) {
      if (actionParam === 'new-project') setActiveModal('project');
      if (actionParam === 'new-task') { setActiveTab('tasks'); setActiveModal('task'); }
    }
  }, [searchParams]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRisks = async () => {
    try { setRisks((await api.get('/operations/risks')).data); }
    catch (err) { console.error('Failed to fetch risks', err); }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get('/projects/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchTasks();
    fetchRisks();
  }, []);

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/projects', formData);
      setActiveModal(null);
      setFormData({ title: '', budget: '', startDate: new Date().toISOString().split('T')[0], endDate: '2026-12-31', description: '' });
      fetchProjects();
    } catch (err) {
      console.error('Failed to create project', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/projects/tasks', {
        projectId: taskForm.projectId,
        title: taskForm.title,
        assignee: taskForm.assignee || undefined,
        dueDate: taskForm.dueDate || undefined,
        priority: taskForm.priority,
        status: taskForm.status,
        description: taskForm.description || undefined,
      });
      setActiveModal(null);
      setTaskForm({ title: '', projectId: '', assignee: '', dueDate: '', priority: 'MEDIUM', status: 'PENDING', description: '' });
      await fetchTasks();
    } catch (err) {
      console.error('Failed to create task', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: string) => {
    // Optimistic, then reconciled with the server response.
    setTasks(tasks.map(t => (t.id === taskId ? { ...t, status } : t)));
    try {
      await api.patch(`/projects/tasks/${taskId}`, { status });
      await fetchTasks();
    } catch (err) {
      console.error('Failed to update task status', err);
      await fetchTasks();
    }
  };

  // Was local state with `id: Date.now()` and the score computed here from a
  // lookup table. The server derives score from likelihood x impact, so two
  // copies of that rule could drift; there is now one, and the risk persists.
  const handleRiskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/operations/risks', {
        projectId: riskForm.projectId,
        title: riskForm.title,
        category: riskForm.category,
        likelihood: riskForm.likelihood,
        impact: riskForm.impact,
        mitigation: riskForm.mitigation || undefined,
        owner: riskForm.owner || undefined,
      });
      setActiveModal(null);
      setRiskForm({ title: '', projectId: '', category: 'OPERATIONAL', likelihood: 'MEDIUM', impact: 'MEDIUM', mitigation: '', owner: '', status: 'OPEN' });
      await fetchRisks();
    } catch (err) {
      console.error('Failed to record risk', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/projects', {
        title: `[EXPENSE] ${expenseForm.project}`,
        description: expenseForm.description,
        budget: expenseForm.amount,
        startDate: expenseForm.date,
        endDate: expenseForm.date
      });
      setActiveModal(null);
      setExpenseForm({ project: '', description: '', amount: '', date: '', category: 'Administration' });
      fetchProjects();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangeRequests([
      ...changeRequests,
      { ...changeForm, status: 'PENDING_APPROVAL', id: `${changeForm.project}-${changeForm.title}` },
    ]);
    setActiveModal(null);
    setChangeForm({ project: '', title: '', type: 'SCOPE_CHANGE', currentState: '', proposedChange: '', justification: '', impact: '', requestedBy: '' });
  };

  const totalBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[var(--outline)] pb-5">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Enterprise Project Management Software • GCOMS
          </span>
          <h1 className="text-2xl font-bold mt-1 text-[var(--on-background)]">Project Lifecycles & Operational Tasks</h1>
          <p className="text-[var(--muted)] text-xs mt-0.5">Manage operational projects, task milestones, resource allocations, and risk logs.</p>
        </div>
        <div className="mt-3 lg:mt-0 flex flex-wrap gap-2">
          <button onClick={() => setActiveModal('project')} className="btn-primary text-xs bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]">
            + Create Operational Project
          </button>
          <button onClick={() => setActiveModal('task')} className="btn-primary text-xs bg-[var(--primary-dark)] border border-amber-800/40 text-amber-300">
            + Create Task Assignment
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex border-b border-[var(--outline)] gap-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'projects', label: 'Project Portfolio Directory' },
          { id: 'tasks', label: 'Task & Milestone Kanban Board' },
          { id: 'risks', label: 'Risk & Issue Register' },
          { id: 'budget', label: 'Budget Monitoring' },
          { id: 'changes', label: 'Change Requests' },
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

      {/* Modals */}
      {activeModal === 'project' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Create Operational Project</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleProjectSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Project Title *</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Project Budget (₦) *</label>
                <input type="number" required value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Start Date *</label>
                  <input type="date" required value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">End Date *</label>
                  <input type="date" required value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">{submitting ? 'Creating...' : 'Save Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'task' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4 h-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Add Task</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleTaskSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Task Title *</label>
                <input type="text" required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Assigned Project *</label>
                <select required value={taskForm.projectId} onChange={e => setTaskForm({ ...taskForm, projectId: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="">Select Project</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Assigned To *</label>
                <input type="text" required value={taskForm.assignee} onChange={e => setTaskForm({ ...taskForm, assignee: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Due Date *</label>
                  <input type="date" required value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Priority *</label>
                  <select required value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Initial Status *</label>
                <select required value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Description</label>
                <textarea rows={3} value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'risk' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4 h-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Register Risk</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleRiskSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Risk Title *</label>
                <input type="text" required value={riskForm.title} onChange={e => setRiskForm({ ...riskForm, title: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Project *</label>
                <select required value={riskForm.projectId} onChange={e => setRiskForm({ ...riskForm, projectId: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="">Select Project</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                  <option value="Plateau Rural Health Initiative">Plateau Rural Health Initiative</option>
                  <option value="Community Awareness Expansion">Community Awareness Expansion</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Category *</label>
                <select required value={riskForm.category} onChange={e => setRiskForm({ ...riskForm, category: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="SUPPLY_CHAIN">SUPPLY CHAIN</option>
                  <option value="FINANCIAL">FINANCIAL</option>
                  <option value="OPERATIONAL">OPERATIONAL</option>
                  <option value="SECURITY">SECURITY</option>
                  <option value="COMPLIANCE">COMPLIANCE</option>
                  <option value="ENVIRONMENTAL">ENVIRONMENTAL</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Likelihood *</label>
                  <select required value={riskForm.likelihood} onChange={e => setRiskForm({ ...riskForm, likelihood: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Impact *</label>
                  <select required value={riskForm.impact} onChange={e => setRiskForm({ ...riskForm, impact: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Risk Owner *</label>
                <input type="text" required value={riskForm.owner} onChange={e => setRiskForm({ ...riskForm, owner: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Status *</label>
                <select required value={riskForm.status} onChange={e => setRiskForm({ ...riskForm, status: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="OPEN">OPEN</option>
                  <option value="MITIGATING">MITIGATING</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Mitigation Strategy</label>
                <textarea rows={2} required value={riskForm.mitigation} onChange={e => setRiskForm({ ...riskForm, mitigation: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Register Risk</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'expense' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Record Expenditure</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleExpenseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Project *</label>
                <select required value={expenseForm.project} onChange={e => setExpenseForm({ ...expenseForm, project: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="">Select Project</option>
                  {projects.map((p, i) => <option key={i} value={p.projectName}>{p.projectName}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Expense Description *</label>
                <input type="text" required value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Amount ₦ *</label>
                  <input type="number" required value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Date *</label>
                  <input type="date" required value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Category *</label>
                <select required value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="Personnel">Personnel</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Training">Training</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">{submitting ? 'Recording...' : 'Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'change' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4 h-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Raise Change Request</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleChangeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Project *</label>
                <select required value={changeForm.project} onChange={e => setChangeForm({ ...changeForm, project: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="">Select Project</option>
                  {projects.map((p, i) => <option key={i} value={p.projectName}>{p.projectName}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Change Title *</label>
                <input type="text" required value={changeForm.title} onChange={e => setChangeForm({ ...changeForm, title: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Change Type *</label>
                <select required value={changeForm.type} onChange={e => setChangeForm({ ...changeForm, type: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="SCOPE_CHANGE">SCOPE CHANGE</option>
                  <option value="BUDGET_INCREASE">BUDGET INCREASE</option>
                  <option value="TIMELINE_EXTENSION">TIMELINE EXTENSION</option>
                  <option value="RESOURCE_CHANGE">RESOURCE CHANGE</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Current State</label>
                <textarea required rows={2} value={changeForm.currentState} onChange={e => setChangeForm({ ...changeForm, currentState: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"></textarea>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Proposed Change</label>
                <textarea required rows={2} value={changeForm.proposedChange} onChange={e => setChangeForm({ ...changeForm, proposedChange: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"></textarea>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Justification</label>
                <textarea required rows={2} value={changeForm.justification} onChange={e => setChangeForm({ ...changeForm, justification: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"></textarea>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Impact Assessment</label>
                <textarea required rows={2} value={changeForm.impact} onChange={e => setChangeForm({ ...changeForm, impact: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"></textarea>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Requested By *</label>
                <input type="text" required value={changeForm.requestedBy} onChange={e => setChangeForm({ ...changeForm, requestedBy: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Raise Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Total Active Projects</span>
          <p className="text-3xl font-bold text-[var(--primary)] mt-1 tabular-nums">{projects.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Combined Project Budget</span>
          <p className="text-3xl font-bold text-[var(--secondary)] mt-1 tabular-nums">₦{totalBudget.toLocaleString()}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Total Tasks</span>
          <p className="text-3xl font-bold text-[var(--risk-low-text)] mt-1 tabular-nums">{tasks.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Open Risks</span>
          <p className="text-3xl font-bold text-[var(--risk-mod-text)] mt-1 tabular-nums">{risks.filter(r => r.status === 'OPEN').length}</p>
        </div>
      </div>

      {/* TAB 1: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
          <div className="p-4 border-b border-[var(--outline)] font-bold text-[var(--primary)] text-sm bg-[var(--background)]">
            Registered Projects Roster
          </div>
          {loading ? (
            <div className="p-8 text-center text-xs text-[var(--muted)]">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--muted)]">No operational projects registered yet.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                <tr>
                  <th className="p-3">Project Title</th>
                  <th className="p-3">Budget</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--primary-surface)]">
                    <td className="p-3 font-bold text-[var(--primary)]">{p.projectName}</td>
                    <td className="p-3 font-bold font-mono tabular-nums text-[var(--secondary)]">₦{Number(p.budget).toLocaleString()}</td>
                    <td className="p-3 text-[var(--muted)] tabular-nums">
                      {new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-3"><span className="badge-low-risk">{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 2: TASKS KANBAN */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setActiveModal('task')} className="btn-primary text-xs bg-[var(--primary-dark)] border border-amber-800/40 text-amber-300">
              + Add Task
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map(status => {
              const colTasks = tasks.filter(t => t.status === status);
              const headers: Record<string, string> = { PENDING: 'TO DO', IN_PROGRESS: 'IN PROGRESS', COMPLETED: 'COMPLETED' };
              const headerColors: Record<string, string> = { PENDING: 'text-[var(--primary)]', IN_PROGRESS: 'text-[var(--secondary)]', COMPLETED: 'text-[var(--risk-low-text)]' };
              return (
                <div key={status} className="bg-white p-4 rounded-lg border border-[var(--outline)] space-y-3">
                  <h3 className={`font-bold ${headerColors[status]} border-b pb-2 flex justify-between`}>
                    <span>{headers[status]}</span> <span className="text-[var(--muted)]">{colTasks.length}</span>
                  </h3>
                  {colTasks.map(task => (
                    <div key={task.id} className="p-3 bg-[var(--background)] border rounded space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-bold text-[var(--primary)]">{task.title}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${task.priority === 'HIGH' ? 'bg-red-100 text-red-700' : task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--muted)] font-semibold">{task.project?.projectName}</p>
                      <p className="text-[10px] text-[var(--on-surface-variant)]">Assignee: {task.assignee || 'Unassigned'}</p>
                      <p className="text-[10px] text-[var(--on-surface-variant)]">Due: {task.dueDate ? String(task.dueDate).slice(0, 10) : '—'}</p>
                      <select 
                        value={task.status}
                        onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                        className="mt-2 w-full text-[10px] p-1 border rounded"
                      >
                        <option value="PENDING">Move to TO DO</option>
                        <option value="IN_PROGRESS">Move to IN PROGRESS</option>
                        <option value="COMPLETED">Move to COMPLETED</option>
                      </select>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: RISKS */}
      {activeTab === 'risks' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
          <div className="p-4 border-b border-[var(--outline)] flex justify-between items-center bg-[var(--background)]">
            <div className="font-bold text-[var(--primary)] text-sm">Risk Register</div>
            <button onClick={() => setActiveModal('risk')} className="btn-primary text-xs bg-red-800 hover:bg-red-900">
              + Register Risk
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[800px]">
              <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                <tr>
                  <th className="p-3">Risk Title</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">L / I / Score</th>
                  <th className="p-3">Mitigation & Owner</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
                {risks.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--primary-surface)] align-top">
                    <td className="p-3 font-bold text-[var(--primary)] w-48">{r.title}</td>
                    <td className="p-3 text-[var(--muted)] w-40">{r.project?.projectName ?? '—'}</td>
                    <td className="p-3">{r.category}</td>
                    <td className="p-3 whitespace-nowrap">
                      <div>L: {r.likelihood}</div>
                      <div>I: {r.impact}</div>
                      <div className="font-bold mt-1 text-red-700">Score: {r.score}</div>
                    </td>
                    <td className="p-3 w-64">
                      <p>{r.mitigation}</p>
                      <p className="mt-1 text-[var(--muted)] font-semibold">Owner: {r.owner ?? 'Unassigned'}</p>
                    </td>
                    <td className="p-3">
                      <select 
                        value={r.status}
                        onChange={(e) => setRisks(risks.map(risk => risk.id === r.id ? { ...risk, status: e.target.value } : risk))}
                        className="text-[10px] p-1 border rounded w-full"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="MITIGATING">MITIGATING</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BUDGET */}
      {activeTab === 'budget' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
          <div className="p-4 border-b border-[var(--outline)] flex justify-between items-center bg-[var(--background)]">
            <div className="font-bold text-[var(--primary)] text-sm">Budget Monitoring</div>
            <button onClick={() => setActiveModal('expense')} className="btn-primary text-xs bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]">
              + Record Expenditure
            </button>
          </div>
          {projects.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--muted)]">No operational projects registered yet.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                <tr>
                  <th className="p-3">Project Name</th>
                  <th className="p-3">Approved Budget</th>
                  <th className="p-3">Utilized (Est. 45%)</th>
                  <th className="p-3">Remaining</th>
                  <th className="p-3 w-1/4">Utilization %</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
                {projects.map((p) => {
                  const b = Number(p.budget) || 0;
                  const u = b * 0.45;
                  const r = b - u;
                  const pct = 45;
                  return (
                    <tr key={p.id} className="hover:bg-[var(--primary-surface)]">
                      <td className="p-3 font-bold text-[var(--primary)]">{p.projectName}</td>
                      <td className="p-3 tabular-nums">₦{b.toLocaleString()}</td>
                      <td className="p-3 tabular-nums text-red-700">₦{u.toLocaleString()}</td>
                      <td className="p-3 tabular-nums text-emerald-700">₦{r.toLocaleString()}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-[var(--secondary)] h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                          <span>{pct}%</span>
                        </div>
                      </td>
                      <td className="p-3"><span className="badge-low-risk">ON_TRACK</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 5: CHANGES */}
      {activeTab === 'changes' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
          <div className="p-4 border-b border-[var(--outline)] flex justify-between items-center bg-[var(--background)]">
            <div className="font-bold text-[var(--primary)] text-sm">Change Requests</div>
            <button onClick={() => setActiveModal('change')} className="btn-primary text-xs bg-[var(--primary-dark)] text-white">
              + Raise Change Request
            </button>
          </div>
          {changeRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--muted)]">No change requests raised yet.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                <tr>
                  <th className="p-3">Project</th>
                  <th className="p-3">Change Title</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Requested By</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
                {changeRequests.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--primary-surface)]">
                    <td className="p-3">{c.project}</td>
                    <td className="p-3 font-bold">{c.title}</td>
                    <td className="p-3">{c.type}</td>
                    <td className="p-3">{c.requestedBy}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${c.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-800' : c.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 space-x-2">
                      {c.status === 'PENDING_APPROVAL' && (
                        <>
                          <button onClick={() => setChangeRequests(changeRequests.map(x => x.id === c.id ? { ...x, status: 'APPROVED' } : x))} className="text-emerald-700 font-bold hover:underline">Approve</button>
                          <button onClick={() => setChangeRequests(changeRequests.map(x => x.id === c.id ? { ...x, status: 'REJECTED' } : x))} className="text-red-700 font-bold hover:underline">Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
