'use client';

import type { FinanceTransaction } from '@/types/api';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AccessDenied } from '@/components/AccessDenied';

const COST_CENTRE_CATEGORIES = [
  "5001 - Outreach Field Logistics & Fuel",
  "5002 - Medical Consumables & Reagents (VIA, Speculums)",
  "5003 - Staff Salaries & Volunteer LGA Stipends",
  "5004 - Administrative & IT Cloud Infrastructure",
  "5005 - Clinical Training & Capacity Workshops",
  "5006 - Patient Navigation & Referral Subsidies",
  "5007 - Community Mobilization & Advocacy",
  "5008 - Research, Data Collection & Surveys",
  "6001 - Clinical Equipment Purchase (Ultrasound, Cryotherapy)",
  "6002 - Vehicle & Mobile Clinic Assets",
  "6003 - Office Furniture & Computer Hardware",
  "4001 - Grant Inflow - Global Fund",
  "4002 - Grant Inflow - WHO Health Assistance",
  "4003 - Grant Inflow - USAID Global Health",
  "4004 - Grant Inflow - Gates Foundation",
  "4005 - Individual & Corporate Donations",
  "1001 - Operating Cash & Bank Operations",
  "1002 - Petty Cash Fund",
  "2001 - Accounts Payable & Vendor Liabilities",
  "2002 - Tax & Pension Withholdings",
];

function FinancePageContent() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const allowedRoles = ['EXECUTIVE', 'BOARD', 'SYSTEM_ADMIN', 'ADMIN', 'FINANCE'];

  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'vouchers' | 'advances' | 'budgets' | 'accounts' | 'statements'>('ledger');
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [voucherFilter, setVoucherFilter] = useState('ALL');
  const [statementPeriod, setStatementPeriod] = useState('ALL');

  // Active Action Modal State
  const [activeModal, setActiveModal] = useState<null | 'journal' | 'requisition' | 'advance' | 'retirement' | 'budget' | 'inflow'>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [journalForm, setJournalForm] = useState({ amount: '', type: 'EXPENSE', category: COST_CENTRE_CATEGORIES[0], description: '' });
  const [reqForm, setReqForm] = useState({ vendorName: 'JUTH Reagent Supplier', amount: '', invoiceNo: '', category: COST_CENTRE_CATEGORIES[1], description: '', receiptUrl: '' });
  const [advanceForm, setAdvanceForm] = useState({ staffName: '', lgaDestination: 'Barkin Ladi LGA', amount: '', purpose: '', retirementDate: '' });
  const [inflowForm, setInflowForm] = useState({ donorName: 'Global Fund for Health', grantRef: 'GF-2026-NIG-001', amount: '', bankAccount: 'Primary Operating Bank (1001)', description: '' });
  
  // New Forms
  const [budgetForm, setBudgetForm] = useState({ department: 'Finance', lineItem: '', amount: '', period: 'Q1 2026', justification: '' });
  const [retirementForm, setRetirementForm] = useState({ staffName: '', advanceRef: '', lgaDestination: '', advanceAmount: '', actualSpent: '', narrative: '' });

  // Read URL params (from Sidebar expanded links)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const actionParam = searchParams.get('action');

    if (tabParam && ['ledger', 'vouchers', 'advances', 'budgets', 'accounts', 'statements'].includes(tabParam)) {
      setActiveSubTab(tabParam as Parameters<typeof setActiveSubTab>[0]);
    }
    if (actionParam && ['journal', 'requisition', 'advance', 'retirement', 'budget', 'inflow'].includes(actionParam)) {
      setActiveModal(actionParam as Parameters<typeof setActiveModal>[0]);
    }
  }, [searchParams]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/finance');
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to load finance transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && allowedRoles.includes(user.role)) {
      fetchTransactions();
    }
  }, [user]);

  if (user && !allowedRoles.includes(user.role)) {
    return <AccessDenied requiredRole="Finance Officer / Executive" />;
  }

  // Submit Handlers
  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/finance', journalForm);
      setActiveModal(null);
      setJournalForm({ amount: '', type: 'EXPENSE', category: COST_CENTRE_CATEGORIES[0], description: '' });
      fetchTransactions();
    } catch (err) {
      console.error('Failed to post journal', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRaiseRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/finance', {
        amount: reqForm.amount,
        type: 'EXPENSE',
        category: reqForm.category,
        description: `PV [${reqForm.invoiceNo || 'INV'}] - Vendor: ${reqForm.vendorName} • ${reqForm.description}`,
      });
      setActiveModal(null);
      setReqForm({ vendorName: 'JUTH Reagent Supplier', amount: '', invoiceNo: '', category: COST_CENTRE_CATEGORIES[1], description: '', receiptUrl: '' });
      fetchTransactions();
    } catch (err) {
      console.error('Failed to raise requisition', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/finance', {
        amount: advanceForm.amount,
        type: 'EXPENSE',
        category: '5001 - Outreach Field Logistics & Fuel',
        description: `Travel Advance for ${advanceForm.staffName} (${advanceForm.lgaDestination}) • Purpose: ${advanceForm.purpose}`,
      });
      setActiveModal(null);
      setAdvanceForm({ staffName: '', lgaDestination: 'Barkin Ladi LGA', amount: '', purpose: '', retirementDate: '' });
      fetchTransactions();
    } catch (err) {
      console.error('Failed to request advance', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterInflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/finance', {
        amount: inflowForm.amount,
        type: 'INCOME',
        category: `4001 - Grant Inflow (${inflowForm.donorName})`,
        description: `Grant Ref: ${inflowForm.grantRef} • Destination: ${inflowForm.bankAccount} • ${inflowForm.description}`,
      });
      setActiveModal(null);
      setInflowForm({ donorName: 'Global Fund for Health', grantRef: 'GF-2026-NIG-001', amount: '', bankAccount: 'Primary Operating Bank (1001)', description: '' });
      fetchTransactions();
    } catch (err) {
      console.error('Failed to register grant inflow', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/finance', {
        type: 'BUDGET_REQUEST',
        category: budgetForm.department,
        amount: budgetForm.amount,
        description: `${budgetForm.lineItem} | Period: ${budgetForm.period} | ${budgetForm.justification}`
      });
      setActiveModal(null);
      setBudgetForm({ department: 'Finance', lineItem: '', amount: '', period: 'Q1 2026', justification: '' });
      fetchTransactions();
    } catch (err) {
      console.error('Failed to create budget', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetireAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const advAmt = Number(retirementForm.advanceAmount) || 0;
      const actAmt = Number(retirementForm.actualSpent) || 0;
      const surplus = advAmt - actAmt;
      await api.post('/finance', {
        type: 'RETIREMENT',
        category: '1002 - Petty Cash Fund',
        amount: String(actAmt),
        description: `Advance Retirement: ${retirementForm.staffName} | Advance: ₦${advAmt} | Spent: ₦${actAmt} | Surplus: ₦${surplus} | ${retirementForm.narrative}`
      });
      setActiveModal(null);
      setRetirementForm({ staffName: '', advanceRef: '', lgaDestination: '', advanceAmount: '', actualSpent: '', narrative: '' });
      fetchTransactions();
    } catch (err) {
      console.error('Failed to retire advance', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprovalAction = async (tx: FinanceTransaction, action: 'APPROVE' | 'REJECT') => {
    try {
      await api.post('/finance', {
        type: 'APPROVAL_ACTION',
        category: 'PV_APPROVAL',
        amount: '0',
        description: `PV ${action}D: ${tx.id || ''} - ${tx.description}`
      });
      fetchTransactions();
    } catch (err) {
      console.error('Failed to process approval action', err);
    }
  };

  const handleBudgetApproval = async (tx: FinanceTransaction) => {
    try {
      await api.post('/finance', {
        type: 'BUDGET_APPROVAL',
        category: tx.category,
        amount: tx.amount,
        description: `APPROVED: ${tx.description}`
      });
      fetchTransactions();
    } catch (err) {
      console.error('Failed to approve budget', err);
    }
  };

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const filteredTx = filterCategory === 'ALL'
    ? transactions
    : transactions.filter(t => t.type === filterCategory);

  const budgetRequests = transactions.filter(t => typeof t.type === 'string' && t.type.includes('BUDGET_REQUEST'));
  const approvedBudgetTotal = budgetRequests
    .filter(t => t.status === 'APPROVED' || transactions.some(a => a.type === 'BUDGET_APPROVAL' && typeof a.description === 'string' && a.description.includes(t.description)))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const budgetUtilized = totalExpense;
  const remainingBudget = approvedBudgetTotal - budgetUtilized;

  const getStatementTxs = () => {
    let txs = transactions;
    if (statementPeriod !== 'ALL') {
      const now = new Date();
      txs = transactions.filter(t => {
        const txDate = new Date(t.createdAt);
        if (statementPeriod === 'YEAR') return txDate.getFullYear() === now.getFullYear();
        if (statementPeriod === 'QUARTER') return txDate.getFullYear() === now.getFullYear() && Math.floor(txDate.getMonth() / 3) === Math.floor(now.getMonth() / 3);
        return true;
      });
    }
    return txs;
  };
  const statementTxs = getStatementTxs();
  const statementIncome = statementTxs.filter(t => t.type === 'INCOME');
  const statementExpense = statementTxs.filter(t => t.type === 'EXPENSE' || t.type === 'RETIREMENT');

  const operatingExpenses = statementExpense.filter(t => String(t.category).startsWith('5'));
  const capitalExpenses = statementExpense.filter(t => String(t.category).startsWith('6'));

  const totalStatementIncome = statementIncome.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalOperatingExp = operatingExpenses.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalCapitalExp = capitalExpenses.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalStatementExpense = totalOperatingExp + totalCapitalExp;
  const statementSurplus = totalStatementIncome - totalStatementExpense;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Application Header */}
      <div className="bg-[var(--nav-surface)] text-white p-5 rounded-lg border border-[var(--nav-surface-raised)] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--secondary)] text-white uppercase tracking-wider">
            Enterprise Financial Operations Application • GCOMS
          </span>
          <h1 className="text-2xl font-bold mt-1 text-white">Financial Operations Suite & General Ledger</h1>
          <p className="text-slate-300 text-xs mt-0.5">Manage payment requisitions, cash advances, grant inflows, payment vouchers, and financial statements directly via sidebar navigation.</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
           <button onClick={() => setActiveModal('retirement')} className="btn-primary text-xs">+ Retire Advance</button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex border-b border-[var(--outline)] gap-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'ledger', label: '💳 Double-Entry General Ledger' },
          { id: 'budgets', label: '📊 Budgets' },
          { id: 'vouchers', label: '💸 Accounts Payable & Payment Vouchers (PV)' },
          { id: 'advances', label: '✈️ Cash Advances & Retirement Workflow' },
          { id: 'accounts', label: '🏛 Chart of Accounts & Cost Centres' },
          { id: 'statements', label: '📑 Income Statement & Balance Sheet' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id as Parameters<typeof setActiveSubTab>[0])}
            className={`py-2.5 px-4 rounded-t border-b-2 transition-all whitespace-nowrap ${
              activeSubTab === t.id ? 'border-[var(--secondary)] text-[var(--secondary)] bg-white font-bold' : 'border-transparent text-[var(--muted)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* MODAL 1: RAISE PAYMENT REQUISITION */}
      {activeModal === 'requisition' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Raise Payment Requisition (Payment Voucher)</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleRaiseRequisition} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Vendor / Payee Name *</label>
                <select
                  value={reqForm.vendorName}
                  onChange={e => setReqForm({ ...reqForm, vendorName: e.target.value })}
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                >
                  <option value="JUTH Reagent Supplier">Jos University Teaching Hospital Supplies</option>
                  <option value="MedPharma West Africa">MedPharma West Africa Ltd</option>
                  <option value="Plateau Medical Logistics">Plateau Medical Logistics Agency</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Invoice / Ref No.</label>
                  <input
                    type="text"
                    value={reqForm.invoiceNo}
                    onChange={e => setReqForm({ ...reqForm, invoiceNo: e.target.value })}
                    placeholder="INV-9921"
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Amount (₦) *</label>
                  <input
                    type="number"
                    required
                    value={reqForm.amount}
                    onChange={e => setReqForm({ ...reqForm, amount: e.target.value })}
                    placeholder="e.g. 2400000"
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs font-mono tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Cost Centre Category *</label>
                <select
                  value={reqForm.category}
                  onChange={e => setReqForm({ ...reqForm, category: e.target.value })}
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                >
                  {COST_CENTRE_CATEGORIES.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Payment Justification *</label>
                <textarea
                  required
                  rows={2}
                  value={reqForm.description}
                  onChange={e => setReqForm({ ...reqForm, description: e.target.value })}
                  placeholder="State operational purpose of payment..."
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REQUEST CASH ADVANCE */}
      {activeModal === 'advance' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Request Travel / Field Cash Advance</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleRequestAdvance} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Recipient Staff Officer Name *</label>
                <input
                  type="text"
                  required
                  value={advanceForm.staffName}
                  onChange={e => setAdvanceForm({ ...advanceForm, staffName: e.target.value })}
                  placeholder="e.g. John Danladi (Field Officer)"
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Target LGA Destination *</label>
                  <select
                    value={advanceForm.lgaDestination}
                    onChange={e => setAdvanceForm({ ...advanceForm, lgaDestination: e.target.value })}
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                  >
                    <option value="Barkin Ladi LGA">Barkin Ladi LGA</option>
                    <option value="Jos North LGA">Jos North LGA</option>
                    <option value="Mangu LGA">Mangu LGA</option>
                    <option value="Kanke LGA">Kanke LGA</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Advance Amount (₦) *</label>
                  <input
                    type="number"
                    required
                    value={advanceForm.amount}
                    onChange={e => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                    placeholder="e.g. 850000"
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs font-mono tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Travel / Field Duty Purpose *</label>
                <textarea
                  required
                  rows={2}
                  value={advanceForm.purpose}
                  onChange={e => setAdvanceForm({ ...advanceForm, purpose: e.target.value })}
                  placeholder="Describe field drive logistics..."
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Request Advance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REGISTER GRANT INFLOW */}
      {activeModal === 'inflow' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Register Donor Grant Fund Inflow</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleRegisterInflow} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Donor Organization *</label>
                <select
                  value={inflowForm.donorName}
                  onChange={e => setInflowForm({ ...inflowForm, donorName: e.target.value })}
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                >
                  <option value="Global Fund for Health">Global Fund for Health</option>
                  <option value="World Health Organization (WHO)">World Health Organization (WHO)</option>
                  <option value="USAID Global Health Initiative">USAID Global Health Initiative</option>
                  <option value="Bill & Melinda Gates Foundation">Bill & Melinda Gates Foundation</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Grant Award Ref</label>
                  <input
                    type="text"
                    value={inflowForm.grantRef}
                    onChange={e => setInflowForm({ ...inflowForm, grantRef: e.target.value })}
                    placeholder="GF-2026-NIG-001"
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Inflow Amount (₦) *</label>
                  <input
                    type="number"
                    required
                    value={inflowForm.amount}
                    onChange={e => setInflowForm({ ...inflowForm, amount: e.target.value })}
                    placeholder="e.g. 50000000"
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs font-mono tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Inflow Description *</label>
                <textarea
                  required
                  rows={2}
                  value={inflowForm.description}
                  onChange={e => setInflowForm({ ...inflowForm, description: e.target.value })}
                  placeholder="State grant installment notes..."
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">
                  {submitting ? 'Registering...' : 'Register Inflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: POST JOURNAL */}
      {activeModal === 'journal' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Post Double-Entry Journal Entry</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handlePostJournal} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Transaction Type *</label>
                <select
                  value={journalForm.type}
                  onChange={e => setJournalForm({ ...journalForm, type: e.target.value })}
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                >
                  <option value="EXPENSE">EXPENSE (Disbursement / Payment Voucher)</option>
                  <option value="INCOME">INCOME (Grant Inflow / Donation)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Cost Centre Category *</label>
                <select
                  value={journalForm.category}
                  onChange={e => setJournalForm({ ...journalForm, category: e.target.value })}
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                >
                  {COST_CENTRE_CATEGORIES.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Amount (₦) *</label>
                <input
                  type="number"
                  required
                  value={journalForm.amount}
                  onChange={e => setJournalForm({ ...journalForm, amount: e.target.value })}
                  placeholder="e.g. 2500000"
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Line Item Description *</label>
                <textarea
                  required
                  rows={2}
                  value={journalForm.description}
                  onChange={e => setJournalForm({ ...journalForm, description: e.target.value })}
                  placeholder="Describe operational purpose of entry..."
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">
                  {submitting ? 'Posting...' : 'Post Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: NEW BUDGET LINE */}
      {activeModal === 'budget' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">New Budget Line Request</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateBudget} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Department *</label>
                <select
                  value={budgetForm.department}
                  onChange={e => setBudgetForm({ ...budgetForm, department: e.target.value })}
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                >
                  {['Finance', 'Procurement', 'HR', 'Grants', 'Projects', 'Inventory', 'Clinical', 'Admin'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Line Item Description *</label>
                <input
                  type="text"
                  required
                  value={budgetForm.lineItem}
                  onChange={e => setBudgetForm({ ...budgetForm, lineItem: e.target.value })}
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Requested Amount (₦) *</label>
                  <input
                    type="number"
                    required
                    value={budgetForm.amount}
                    onChange={e => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Budget Period *</label>
                  <select
                    value={budgetForm.period}
                    onChange={e => setBudgetForm({ ...budgetForm, period: e.target.value })}
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                  >
                    <option value="Q1 2026">Q1 2026</option>
                    <option value="Q2 2026">Q2 2026</option>
                    <option value="Q3 2026">Q3 2026</option>
                    <option value="Q4 2026">Q4 2026</option>
                    <option value="FY 2026-2027">FY 2026-2027</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Justification *</label>
                <textarea
                  required
                  rows={2}
                  value={budgetForm.justification}
                  onChange={e => setBudgetForm({ ...budgetForm, justification: e.target.value })}
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: RETIRE ADVANCE */}
      {activeModal === 'retirement' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Retire Cash Advance</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleRetireAdvance} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Staff Name *</label>
                  <input
                    type="text"
                    required
                    value={retirementForm.staffName}
                    onChange={e => setRetirementForm({ ...retirementForm, staffName: e.target.value })}
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">LGA Destination *</label>
                  <input
                    type="text"
                    required
                    value={retirementForm.lgaDestination}
                    onChange={e => setRetirementForm({ ...retirementForm, lgaDestination: e.target.value })}
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Advance Reference / Description *</label>
                <input
                  type="text"
                  required
                  value={retirementForm.advanceRef}
                  onChange={e => setRetirementForm({ ...retirementForm, advanceRef: e.target.value })}
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Advance (₦) *</label>
                  <input
                    type="number"
                    required
                    value={retirementForm.advanceAmount}
                    onChange={e => setRetirementForm({ ...retirementForm, advanceAmount: e.target.value })}
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Spent (₦) *</label>
                  <input
                    type="number"
                    required
                    value={retirementForm.actualSpent}
                    onChange={e => setRetirementForm({ ...retirementForm, actualSpent: e.target.value })}
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Refund (₦)</label>
                  <input
                    type="text"
                    readOnly
                    value={(Number(retirementForm.advanceAmount || 0) - Number(retirementForm.actualSpent || 0)).toLocaleString()}
                    className="w-full bg-gray-100 border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums text-gray-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Retirement Narrative *</label>
                <textarea
                  required
                  rows={2}
                  value={retirementForm.narrative}
                  onChange={e => setRetirementForm({ ...retirementForm, narrative: e.target.value })}
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Retire Advance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Approved Annual Budget</span>
          <p className="text-3xl font-bold text-[var(--primary)] mt-1 tabular-nums">₦{approvedBudgetTotal.toLocaleString()}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Total Disbursements</span>
          <p className="text-3xl font-bold text-[var(--risk-high-text)] mt-1 tabular-nums">₦{totalExpense.toLocaleString()}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Total Grant Inflows</span>
          <p className="text-3xl font-bold text-[var(--risk-low-text)] mt-1 tabular-nums">₦{totalIncome.toLocaleString()}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Net Cash Balance</span>
          <p className="text-3xl font-bold text-[var(--secondary)] mt-1 tabular-nums">₦{(totalIncome - totalExpense).toLocaleString()}</p>
        </div>
      </div>

      {/* SUB-TAB 1: GENERAL LEDGER */}
      {activeSubTab === 'ledger' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
          <div className="p-4 border-b border-[var(--outline)] flex flex-col md:flex-row justify-between items-start md:items-center gap-2 bg-[var(--background)]">
            <div>
              <h2 className="font-bold text-[var(--primary)] text-sm">💳 Real-Time Double-Entry General Ledger</h2>
              <p className="text-[11px] text-[var(--muted)]">Complete audit trail of all posted debit and credit journal vouchers.</p>
            </div>
            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="bg-white border border-[var(--outline)] rounded px-3 py-1.5 text-xs text-[var(--on-background)]"
              >
                <option value="ALL">All Transaction Types</option>
                <option value="INCOME">INCOME Inflows Only</option>
                <option value="EXPENSE">EXPENSE Vouchers Only</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[var(--muted)]">Loading general ledger...</div>
          ) : filteredTx.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--muted)]">No ledger entries match selected filter.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                <tr>
                  <th className="p-3">Cost Code / Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Posting Type</th>
                  <th className="p-3">Amount (₦)</th>
                  <th className="p-3">Posted By</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Executive Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
                {filteredTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[var(--primary-surface)]">
                    <td className="p-3 font-bold text-[var(--primary)]">{tx.category}</td>
                    <td className="p-3 text-[var(--on-surface-variant)]">{tx.description}</td>
                    <td className="p-3 font-semibold">
                      <span className={tx.type === 'INCOME' ? 'text-[var(--risk-low-text)]' : 'text-[var(--risk-high-text)]'}>{tx.type}</span>
                    </td>
                    <td className="p-3 font-bold font-mono tabular-nums text-[var(--primary)]">₦{Number(tx.amount).toLocaleString()}</td>
                    <td className="p-3 text-[var(--muted)]">{tx.requestedBy ? `${tx.requestedBy.firstName} ${tx.requestedBy.lastName}` : 'System'}</td>
                    <td className="p-3 text-[var(--muted)] tabular-nums">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td className="p-3"><span className="badge-low-risk">{tx.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* SUB-TAB: BUDGETS */}
      {activeSubTab === 'budgets' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Total Approved Budget</span>
              <p className="text-2xl font-bold text-[var(--primary)] mt-1 tabular-nums">₦{approvedBudgetTotal.toLocaleString()}</p>
            </div>
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Budget Utilized</span>
              <p className="text-2xl font-bold text-[var(--risk-high-text)] mt-1 tabular-nums">₦{budgetUtilized.toLocaleString()}</p>
            </div>
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Remaining Balance</span>
              <p className="text-2xl font-bold text-[var(--secondary)] mt-1 tabular-nums">₦{remainingBudget.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
            <div className="p-4 border-b border-[var(--outline)] flex justify-between items-center bg-[var(--background)]">
              <h2 className="font-bold text-[var(--primary)] text-sm">📊 Budget Lines & Approvals</h2>
              <button onClick={() => setActiveModal('budget')} className="btn-primary text-xs">+ New Budget Line</button>
            </div>
            <div className="p-4 bg-gray-50 border-b border-[var(--outline)]">
              <h3 className="font-bold text-[var(--primary)] text-xs mb-2">Pending Approvals</h3>
              <div className="space-y-2">
                {budgetRequests.filter(t => t.status === 'PENDING').length === 0 ? (
                  <p className="text-xs text-gray-500">No pending budget requests.</p>
                ) : (
                  budgetRequests.filter(t => t.status === 'PENDING').map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded text-xs">
                      <div>
                        <span className="font-bold text-[var(--primary)]">{t.category}</span> - {t.description}
                        <div className="text-gray-500 mt-1">Requested: ₦{Number(t.amount).toLocaleString()}</div>
                      </div>
                      <button onClick={() => handleBudgetApproval(t)} className="btn-primary text-xs bg-green-600 hover:bg-green-700">✓ Approve</button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                <tr>
                  <th className="p-3">Department</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Requested Amount (₦)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--outline)]">
                {budgetRequests.map(t => (
                  <tr key={t.id} className="hover:bg-[var(--primary-surface)]">
                    <td className="p-3 font-bold text-[var(--primary)]">{t.category}</td>
                    <td className="p-3 text-[var(--on-surface-variant)]">{t.description}</td>
                    <td className="p-3 font-bold font-mono tabular-nums text-[var(--primary)]">₦{Number(t.amount).toLocaleString()}</td>
                    <td className="p-3"><span className="badge-low-risk">{t.status}</span></td>
                  </tr>
                ))}
                {budgetRequests.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-xs text-[var(--muted)]">No budget lines found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB: VOUCHERS */}
      {activeSubTab === 'vouchers' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
          <div className="p-4 border-b border-[var(--outline)] flex flex-col md:flex-row justify-between items-start md:items-center gap-2 bg-[var(--background)]">
            <div>
              <h2 className="font-bold text-[var(--primary)] text-sm">💸 Payment Voucher Approval Queue</h2>
            </div>
            <div className="flex gap-2 text-xs">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
                <button
                  key={f}
                  onClick={() => setVoucherFilter(f)}
                  className={`px-3 py-1.5 rounded border ${voucherFilter === f ? 'bg-[var(--nav-surface)] text-white' : 'bg-white text-gray-700 border-gray-300'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
              <tr>
                <th className="p-3">PV Reference</th>
                <th className="p-3">Vendor / Payee & Desc</th>
                <th className="p-3">Cost Centre</th>
                <th className="p-3">Amount (₦)</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--outline)]">
              {transactions
                .filter(t => t.type === 'EXPENSE' || (typeof t.type === 'string' && t.type.includes('APPROVAL_ACTION')))
                .filter(t => voucherFilter === 'ALL' || t.status === voucherFilter)
                .map(t => (
                <tr key={t.id} className="hover:bg-[var(--primary-surface)]">
                  <td className="p-3 font-mono font-bold text-[var(--primary)]">{t.id}</td>
                  <td className="p-3 text-[var(--on-surface-variant)]">{t.description}</td>
                  <td className="p-3 text-[var(--secondary)] font-semibold">{t.category}</td>
                  <td className="p-3 font-bold font-mono tabular-nums text-[var(--primary)]">₦{Number(t.amount).toLocaleString()}</td>
                  <td className="p-3"><span className="badge-low-risk">{t.status}</span></td>
                  <td className="p-3">
                    {t.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <button onClick={() => handleApprovalAction(t, 'APPROVE')} className="bg-green-600 text-white px-2 py-1 rounded text-[10px] hover:bg-green-700">✓ Approve</button>
                        <button onClick={() => handleApprovalAction(t, 'REJECT')} className="bg-red-600 text-white px-2 py-1 rounded text-[10px] hover:bg-red-700">✗ Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-TAB 4: CHART OF ACCOUNTS & COST CENTRES */}
      {activeSubTab === 'accounts' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] p-5 space-y-4 text-xs">
          <h2 className="font-bold text-[var(--primary)] text-sm border-b border-[var(--outline)] pb-2">🏛 Standardized Chart of Accounts & Cost Centre Matrix</h2>
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
              <tr>
                <th className="p-3">Cost Code</th>
                <th className="p-3">Cost Centre Name</th>
                <th className="p-3">Account Classification</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
              {COST_CENTRE_CATEGORIES.map((c, idx) => {
                const parts = c.split(' - ');
                return (
                  <tr key={idx} className="hover:bg-[var(--primary-surface)]">
                    <td className="p-3 font-mono font-bold text-[var(--primary)]">{parts[0]}</td>
                    <td className="p-3 font-bold text-[var(--on-background)]">{parts[1]}</td>
                    <td className="p-3 text-[var(--secondary)] font-semibold">
                      {parts[0].startsWith('1') ? 'ASSET' : parts[0].startsWith('2') ? 'LIABILITY' : parts[0].startsWith('4') ? 'REVENUE' : parts[0].startsWith('6') ? 'CAPITAL ASSET' : 'OPERATING EXPENSE'}
                    </td>
                    <td className="p-3"><span className="badge-low-risk">ACTIVE</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-TAB: STATEMENTS */}
      {activeSubTab === 'statements' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] p-5 space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-[var(--outline)] pb-2">
            <h2 className="font-bold text-[var(--primary)] text-sm">📑 Income Statement (Profit & Loss Account)</h2>
            <select value={statementPeriod} onChange={e => setStatementPeriod(e.target.value)} className="border border-[var(--outline)] rounded px-3 py-1">
              <option value="ALL">All Time</option>
              <option value="YEAR">Current Year</option>
              <option value="QUARTER">Current Quarter</option>
            </select>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-[var(--risk-low-text)] mb-2 uppercase border-b border-gray-100 pb-1">Revenue / Inflows</h3>
              <div className="space-y-1">
                {statementIncome.length === 0 ? (
                  <p className="text-gray-500 italic">No revenue recorded.</p>
                ) : (
                  statementIncome.map(t => (
                    <div key={t.id} className="flex justify-between text-gray-700 py-1">
                      <span>{t.category}</span>
                      <span className="font-mono tabular-nums">₦{Number(t.amount).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between font-bold text-[var(--primary)] pt-2 mt-2 border-t border-gray-200">
                <span>Total Revenue</span>
                <span className="font-mono tabular-nums">₦{totalStatementIncome.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-[var(--risk-mod-text)] mb-2 uppercase border-b border-gray-100 pb-1">Operating Expenses</h3>
              <div className="space-y-1">
                {operatingExpenses.length === 0 ? (
                  <p className="text-gray-500 italic">No operating expenses recorded.</p>
                ) : (
                  operatingExpenses.map(t => (
                    <div key={t.id} className="flex justify-between text-gray-700 py-1">
                      <span>{t.category}</span>
                      <span className="font-mono tabular-nums">₦{Number(t.amount).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between font-bold text-[var(--primary)] pt-2 mt-2 border-t border-gray-200">
                <span>Total Operating Expenses</span>
                <span className="font-mono tabular-nums">₦{totalOperatingExp.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-[var(--risk-mod-text)] mb-2 uppercase border-b border-gray-100 pb-1">Capital Expenses</h3>
              <div className="space-y-1">
                {capitalExpenses.length === 0 ? (
                  <p className="text-gray-500 italic">No capital expenses recorded.</p>
                ) : (
                  capitalExpenses.map(t => (
                    <div key={t.id} className="flex justify-between text-gray-700 py-1">
                      <span>{t.category}</span>
                      <span className="font-mono tabular-nums">₦{Number(t.amount).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between font-bold text-[var(--primary)] pt-2 mt-2 border-t border-gray-200">
                <span>Total Capital Expenses</span>
                <span className="font-mono tabular-nums">₦{totalCapitalExp.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between font-bold text-lg pt-4 mt-4 border-t-2 border-[var(--primary)] text-[var(--primary)]">
              <span>Net Surplus / (Deficit)</span>
              <span className={`font-mono tabular-nums ${statementSurplus < 0 ? 'text-red-600' : 'text-green-700'}`}>
                {statementSurplus < 0 ? '-' : ''}₦{Math.abs(statementSurplus).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FinancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--muted)]">Loading Finance Application...</div>}>
      <FinancePageContent />
    </Suspense>
  );
}
