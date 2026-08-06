'use client';

import type { PurchaseRequest } from '@/types/procurement';
import type { AnalyticsSummary, ApprovalRequest, FinanceTransaction, Grant, InventoryItem, Project, SessionUser } from '@/types/api';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

export function ExecutiveWorkspace({ user }: { user: SessionUser }) {
  const [analytics, setAnalytics] = useState<Partial<AnalyticsSummary>>({});
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [procurementOrders, setProcurementOrders] = useState<PurchaseRequest[]>([]);
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalFilter, setApprovalFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [lgaData, setLgaData] = useState([
    // TODO: replace with live LGA analytics endpoint when available
    { lga: 'Barkin Ladi', status: 'Active Campaign', referrals: 45, score: '88%' },
    { lga: 'Mangu', status: 'Expanding', referrals: 30, score: '72%' },
    { lga: 'Bassa', status: 'Optimal Capacity', referrals: 120, score: '95%' },
    { lga: 'Riyom', status: 'Scheduled', referrals: 12, score: '65%' },
    { lga: 'Kanke', status: 'Active Campaign', referrals: 55, score: '81%' },
    { lga: 'Pankshin', status: 'Needs Attention', referrals: 8, score: '45%' },
  ]);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/summary').catch(() => ({ data: {} })),
      api.get('/approvals').catch(() => ({ data: [] })),
      api.get('/grants').catch(() => ({ data: [] })),
      api.get('/projects').catch(() => ({ data: [] })),
      api.get('/procurement').catch(() => ({ data: [] })),
      api.get('/finance').catch(() => ({ data: [] })),
      api.get('/inventory').catch(() => ({ data: [] })),
    ]).then(([analyticsRes, approvalsRes, grantsRes, projectsRes, procurementRes, financeRes, inventoryRes]) => {
      setAnalytics(analyticsRes.data || {});
      setApprovals(approvalsRes.data || []);
      setGrants(grantsRes.data || []);
      setProjects(projectsRes.data || []);
      setProcurementOrders(procurementRes.data || []);
      setFinanceTransactions(financeRes.data || []);
      setInventoryItems(inventoryRes.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (item: ApprovalRequest) => {
    try {
      try {
        await api.patch(`/approvals/${item.id}`, { status: 'APPROVED', comment: 'Approved by Executive' });
      } catch (err) {
        await api.post('/approvals', { ...item, action: 'APPROVE' });
      }
      setApprovals(prev => prev.map(a => a.id === item.id ? { ...a, status: 'APPROVED' } : a));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (item: ApprovalRequest) => {
    try {
      try {
        await api.patch(`/approvals/${item.id}`, { status: 'REJECTED', comment: 'Rejected by Executive' });
      } catch (err) {
        await api.post('/approvals', { ...item, action: 'REJECT' });
      }
      setApprovals(prev => prev.map(a => a.id === item.id ? { ...a, status: 'REJECTED' } : a));
    } catch (err) {
      console.error(err);
    }
  };

  const totalGrantValue = grants.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
  const pendingProcurement = procurementOrders.filter(o => o.status === 'PENDING').length;
  
  const totalIncome = financeTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalExpense = financeTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const financialBalance = totalIncome - totalExpense;

  const lowStockCount = inventoryItems.filter(i => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK').length;
  const pendingApprovalsCount = approvals.filter(a => a.status === 'PENDING').length;
  
  const inStockCount = inventoryItems.filter(i => i.status === 'IN_STOCK').length;
  const stockHealth = inventoryItems.length ? Math.round((inStockCount / inventoryItems.length) * 100) : 0;

  const filteredApprovals = approvalFilter === 'ALL' ? approvals : approvals.filter(a => a.status === approvalFilter);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Section 1: Enterprise Command Centre Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[var(--nav-surface)] text-white p-6 rounded-lg border border-[var(--nav-surface-raised)] shadow-md">
        <div>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[var(--secondary)] text-white uppercase tracking-wider">
            Executive Command Centre • GCOMS
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1 text-white">Enterprise-Wide Operations Dashboard</h1>
          <p className="text-slate-300 text-xs mt-0.5">Real-time visibility across all departments and programmes</p>
        </div>

        <div className="mt-4 md:mt-0 flex gap-2">
          <button onClick={() => window.location.href = '/reports'} className="btn-primary text-xs">
            Export Report
          </button>
          <button onClick={() => window.location.href = '/strategy'} className="btn-secondary text-xs">
            Strategic Review
          </button>
        </div>
      </div>

      {/* Section 2: Live KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Active Grant Portfolio</span>
          <p className="text-2xl font-bold text-[var(--primary)] mt-1">{grants.length}</p>
          <p className="text-[10px] text-[var(--on-surface-variant)]">Total: ₦{totalGrantValue.toLocaleString()}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Active Projects</span>
          <p className="text-2xl font-bold text-[var(--secondary)] mt-1 tabular-nums">{projects.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Pending Procurement Orders</span>
          <p className="text-2xl font-bold text-[var(--risk-high-text)] mt-1 tabular-nums">{pendingProcurement}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Financial Balance</span>
          <p className="text-2xl font-bold text-[var(--risk-low-text)] mt-1 tabular-nums">₦{financialBalance.toLocaleString()}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Low Stock Alerts</span>
          <p className="text-2xl font-bold text-[var(--risk-mod-text)] mt-1 tabular-nums">{lowStockCount}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Pending Approvals</span>
          <p className="text-2xl font-bold text-[var(--risk-high-text)] mt-1 tabular-nums">{pendingApprovalsCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 3: Executive Approval Queue */}
          <div className="bg-white rounded-lg border border-[var(--outline)] p-5 space-y-4 shadow-sm">
            <div className="border-b border-[var(--outline)] pb-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <h3 className="font-bold text-[var(--primary)] text-sm">Executive Approval Queue</h3>
              <div className="flex gap-1 text-xs">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
                  <button key={f} onClick={() => setApprovalFilter(f as Parameters<typeof setApprovalFilter>[0])} className={`px-2 py-1 rounded ${approvalFilter === f ? 'bg-[var(--secondary)] text-white' : 'bg-gray-100 text-gray-600'}`}>{f}</button>
                ))}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                  <tr>
                    <th className="p-2">Reference/Title</th>
                    <th className="p-2">Module</th>
                    <th className="p-2">Requested By</th>
                    <th className="p-2">Details</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--outline)]">
                  {filteredApprovals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">
                        {approvalFilter === 'PENDING' ? '✅ No pending approvals. All departments are up to date.' : 'No approvals found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredApprovals.map(a => (
                      <tr key={a.id} className="hover:bg-[var(--primary-surface)]">
                        <td className="p-2 font-medium">{a.title}</td>
                        {/* An approval names the module it belongs to; there is
                            no separate department, and no amount — that lives on
                            the underlying record. Both columns rendered blank. */}
                        <td className="p-2">{a.resourceType}</td>
                        <td className="p-2">{a.requestedBy ? `${a.requestedBy.firstName} ${a.requestedBy.lastName}` : '—'}</td>
                        <td className="p-2 max-w-xs truncate" title={a.description ?? ''}>{a.description || '—'}</td>
                        <td className="p-2 tabular-nums">{new Date(a.createdAt).toLocaleDateString()}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.status === 'APPROVED' ? 'bg-green-100 text-green-800' : a.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{a.status}</span>
                        </td>
                        <td className="p-2 flex gap-1">
                          {a.status === 'PENDING' && (
                            <>
                              <button onClick={() => handleApprove(a)} className="btn-primary text-[10px] py-1 px-2">Approve</button>
                              <button onClick={() => handleReject(a)} className="btn-secondary text-[10px] py-1 px-2 bg-red-50 text-red-600 border-red-200">Reject</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Programme Heat Map */}
          <div className="bg-white rounded-lg border border-[var(--outline)] p-5 space-y-4 shadow-sm">
            <div className="border-b border-[var(--outline)] pb-2">
              <h3 className="font-bold text-[var(--primary)] text-sm">Programme Heat Map (Regional Performance)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                  <tr>
                    <th className="p-2">LGA</th>
                    <th className="p-2">Outreach Status</th>
                    <th className="p-2">Clinical Referrals</th>
                    <th className="p-2">Programme Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--outline)]">
                  {lgaData.map((r, i) => (
                    <tr key={i} className="hover:bg-[var(--primary-surface)]">
                      <td className="p-2 font-bold text-[var(--primary)]">{r.lga}</td>
                      <td className="p-2"><span className="badge-low-risk">{r.status}</span></td>
                      <td className="p-2">{r.referrals}</td>
                      <td className="p-2 font-mono">{r.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Section 4: Cross-Department Analytics */}
          <div className="bg-white rounded-lg border border-[var(--outline)] p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-[var(--primary)] text-sm border-b border-[var(--outline)] pb-2">Cross-Department Analytics</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 bg-[var(--background)] border border-[var(--outline)] rounded">
                <p className="text-[10px] font-bold text-[var(--muted)] uppercase">Finance</p>
                <div className="flex justify-between mt-1 text-xs">
                  <span>Income: ₦{totalIncome.toLocaleString()}</span>
                  <span>Exp: ₦{totalExpense.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-3 bg-[var(--background)] border border-[var(--outline)] rounded">
                <p className="text-[10px] font-bold text-[var(--muted)] uppercase">Grants</p>
                <div className="flex justify-between mt-1 text-xs">
                  <span>Active: {grants.length}</span>
                  <span>Value: ₦{totalGrantValue.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-3 bg-[var(--background)] border border-[var(--outline)] rounded">
                <p className="text-[10px] font-bold text-[var(--muted)] uppercase">Projects</p>
                <p className="mt-1 text-xs font-bold text-[var(--primary)]">Total: {projects.length}</p>
              </div>
              <div className="p-3 bg-[var(--background)] border border-[var(--outline)] rounded">
                <p className="text-[10px] font-bold text-[var(--muted)] uppercase">Inventory</p>
                <p className="mt-1 text-xs font-bold text-[var(--primary)]">Stock Health: {stockHealth}%</p>
              </div>
            </div>
          </div>

          {/* Section 6: Quick Navigation Links */}
          <div className="bg-white rounded-lg border border-[var(--outline)] p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-[var(--primary)] text-sm border-b border-[var(--outline)] pb-2">Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Finance', icon: '💰', link: '/finance', stat: `Bal: ₦${financialBalance.toLocaleString()}` },
                { name: 'Procurement', icon: '🛒', link: '/procurement', stat: `${pendingProcurement} pending` },
                { name: 'HR', icon: '👥', link: '/hr', stat: 'Staff' },
                { name: 'Grants', icon: '🤝', link: '/grants', stat: `${grants.length} active` },
                { name: 'Projects', icon: '📋', link: '/projects', stat: `${projects.length} active` },
                { name: 'Inventory', icon: '📦', link: '/inventory', stat: `${stockHealth}% health` },
                { name: 'Governance', icon: '⚖️', link: '/governance', stat: 'Policies' },
                { name: 'Clinical', icon: '🏥', link: '/clinical', stat: 'Records' },
              ].map(d => (
                <a key={d.name} href={d.link} className="flex flex-col p-3 bg-[var(--background)] border border-[var(--outline)] rounded hover:border-[var(--secondary)] hover:bg-[var(--primary-surface)] transition-colors cursor-pointer group">
                  <div className="flex justify-between items-center">
                    <span className="text-lg">{d.icon}</span>
                    <span className="text-xs text-gray-400 group-hover:text-[var(--secondary)]">→</span>
                  </div>
                  <p className="font-bold text-[var(--primary)] text-[11px] mt-1">{d.name}</p>
                  <p className="text-[9px] text-[var(--muted)] mt-0.5 truncate">{d.stat}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
