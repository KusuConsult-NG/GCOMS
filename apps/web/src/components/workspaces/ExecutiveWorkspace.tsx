'use client';

import type { PurchaseRequest } from '@/types/procurement';
import type { ApprovalRequest, FinanceTransaction, Grant, InventoryItem, LgaCoverage, Project } from '@/types/api';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import {
  ArrowRight,
  Banknote,
  FolderKanban,
  HeartPulse,
  Landmark,
  Package,
  ScrollText,
  Users,
  Warehouse,
} from 'lucide-react';

export function ExecutiveWorkspace() {
  const router = useRouter();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [procurementOrders, setProcurementOrders] = useState<PurchaseRequest[]>([]);
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [approvalFilter, setApprovalFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [lgaCoverage, setLgaCoverage] = useState<LgaCoverage[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/approvals').catch(() => ({ data: [] })),
      api.get('/grants').catch(() => ({ data: [] })),
      api.get('/projects').catch(() => ({ data: [] })),
      api.get('/procurement').catch(() => ({ data: [] })),
      api.get('/finance').catch(() => ({ data: [] })),
      api.get('/inventory').catch(() => ({ data: [] })),
      api.get('/analytics/lga').catch(() => ({ data: [] })),
    ]).then(([approvalsRes, grantsRes, projectsRes, procurementRes, financeRes, inventoryRes, lgaRes]) => {
      setApprovals(approvalsRes.data || []);
      setGrants(grantsRes.data || []);
      setProjects(projectsRes.data || []);
      setProcurementOrders(procurementRes.data || []);
      setFinanceTransactions(financeRes.data || []);
      setInventoryItems(inventoryRes.data || []);
      setLgaCoverage(lgaRes.data || []);
    }).catch(console.error);
  }, []);

  const handleApprove = async (item: ApprovalRequest) => {
    try {
      try {
        await api.patch(`/approvals/${item.id}`, { status: 'APPROVED', comment: 'Approved by Executive' });
      } catch {
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
      } catch {
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--outline)] pb-5">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Executive Command Centre • GCOMS
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1 text-[var(--on-background)]">Enterprise-Wide Operations Dashboard</h1>
          <p className="text-[var(--muted)] text-xs mt-0.5">Real-time visibility across all departments and programmes</p>
        </div>

        <div className="mt-4 md:mt-0 flex gap-2">
          <button onClick={() => router.push('/reports')} className="btn-primary text-xs">
            Export Report
          </button>
          <button onClick={() => router.push('/strategy')} className="btn-secondary text-xs">
            Strategic Review
          </button>
        </div>
      </div>

      {/* Section 2: Live KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Active grant portfolio"
          value={grants.length}
          detail={`Total: ₦${totalGrantValue.toLocaleString()}`}
        />
        <StatCard label="Active projects" value={projects.length} />
        <StatCard label="Pending procurement orders" value={pendingProcurement} />
        <StatCard
          label="Financial balance"
          value={`₦${financialBalance.toLocaleString()}`}
        />
        {/* Colour here is a state, not a category: nothing is wrong until a
            count is above zero. */}
        <StatCard
          label="Low stock alerts"
          value={lowStockCount}
          tone={lowStockCount > 0 ? 'warning' : 'neutral'}
        />
        <StatCard
          label="Pending approvals"
          value={pendingApprovalsCount}
          tone={pendingApprovalsCount > 0 ? 'critical' : 'neutral'}
        />
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
                        {approvalFilter === 'PENDING' ? 'No pending approvals. All departments are up to date.' : 'No approvals found.'}
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

          {/* Section 5: Coverage by LGA */}
          <div className="bg-white rounded-lg border border-[var(--outline)] p-5 space-y-4 shadow-sm">
            <div className="border-b border-[var(--outline)] pb-2">
              <h3 className="font-bold text-[var(--primary)] text-sm">Coverage by Local Government Area</h3>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">
                Registered participants and what has happened to them since. Counts only.
              </p>
            </div>
            {lgaCoverage.length === 0 ? (
              /* An empty table with headers reads as "every LGA has zero". This
                 says which of the two it is. */
              <p className="text-xs text-[var(--muted)] py-4">
                No registrations carry an LGA yet, so there is nothing to break down.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                    <tr>
                      <th className="p-2">LGA</th>
                      <th className="p-2 text-right">Participants</th>
                      <th className="p-2 text-right">Screened</th>
                      <th className="p-2 text-right">Positive</th>
                      <th className="p-2 text-right">Referrals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--outline)]">
                    {lgaCoverage.map(r => (
                      <tr key={r.lga} className="hover:bg-[var(--primary-surface)]">
                        <td className="p-2 font-bold text-[var(--primary)]">{r.lga}</td>
                        <td className="p-2 text-right tabular-nums">{r.participants.toLocaleString()}</td>
                        <td className="p-2 text-right tabular-nums">{r.screenings.toLocaleString()}</td>
                        {/* The one figure that is a clinical signal rather than a
                            volume, so it is the one that carries colour — and only
                            when there is something to carry. */}
                        <td className={`p-2 text-right tabular-nums ${r.positiveScreenings > 0 ? 'font-bold text-[var(--risk-high-text)]' : ''}`}>
                          {r.positiveScreenings.toLocaleString()}
                        </td>
                        <td className="p-2 text-right tabular-nums">
                          {r.referrals.toLocaleString()}
                          {r.pendingReferrals > 0 && (
                            <span className="text-[var(--muted)]"> ({r.pendingReferrals} pending)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                { name: 'Finance', Icon: Banknote, link: '/finance', stat: `Bal: ₦${financialBalance.toLocaleString()}` },
                { name: 'Procurement', Icon: Package, link: '/procurement', stat: `${pendingProcurement} pending` },
                { name: 'HR', Icon: Users, link: '/hr', stat: 'Staff' },
                { name: 'Grants', Icon: ScrollText, link: '/grants', stat: `${grants.length} active` },
                { name: 'Projects', Icon: FolderKanban, link: '/projects', stat: `${projects.length} active` },
                { name: 'Inventory', Icon: Warehouse, link: '/inventory', stat: `${stockHealth}% health` },
                { name: 'Governance', Icon: Landmark, link: '/governance', stat: 'Policies' },
                { name: 'Clinical', Icon: HeartPulse, link: '/clinical', stat: 'Records' },
              ].map(d => (
                <a key={d.name} href={d.link} className="flex flex-col p-3 bg-[var(--background)] border border-[var(--outline)] rounded hover:border-[var(--secondary)] hover:bg-[var(--primary-surface)] transition-colors cursor-pointer group">
                  <div className="flex justify-between items-center">
                    <d.Icon className="h-4 w-4 text-[var(--secondary)]" aria-hidden />
                    <ArrowRight className="h-3.5 w-3.5 text-[var(--muted)] transition-colors group-hover:text-[var(--secondary)]" aria-hidden />
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
