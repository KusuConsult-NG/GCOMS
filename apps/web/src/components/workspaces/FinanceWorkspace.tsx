'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function FinanceWorkspace({ user }: { user: any }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'EXPENSE',
    category: 'Outreach Logistics',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

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
    fetchTransactions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/finance', formData);
      setShowModal(false);
      setFormData({ amount: '', type: 'EXPENSE', category: 'Outreach Logistics', description: '' });
      fetchTransactions();
    } catch (err) {
      console.error('Failed to create finance transaction', err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#002045] text-white p-5 rounded-lg border border-[#1a365d] shadow-sm">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#13696a] text-white uppercase">Finance & Ledger Control</span>
          <h1 className="text-2xl font-bold mt-1 text-white">Finance Officer Workspace</h1>
          <p className="text-xs text-slate-300">Welcome, {user.firstName} {user.lastName} • Real-time ledger, expense requests, and donor disbursement tracking.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs mt-3 md:mt-0">
          + Log New Transaction
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
              <h2 className="text-base font-bold text-[#002045]">Log Financial Transaction</h2>
              <button onClick={() => setShowModal(false)} className="text-[#74777f] font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Transaction Type *</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs"
                >
                  <option value="EXPENSE">EXPENSE (Disbursement / Payment)</option>
                  <option value="INCOME">INCOME (Grant Inflow / Donation)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Budget Category *</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs"
                >
                  <option value="Outreach Logistics">Outreach Field Logistics</option>
                  <option value="Medical Consumables">Medical Consumables & Reagents</option>
                  <option value="Volunteer Stipends">Volunteer Monthly Stipends</option>
                  <option value="Equipment Purchase">Equipment & Machinery Purchase</option>
                  <option value="Grant Disbursement">Grant Fund Inflow</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Amount (₦) *</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g. 1500000"
                  className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Description / Line Item *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Fuel and vehicle hire for Barkin Ladi community screening drive..."
                  className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">
                  {submitting ? 'Recording...' : 'Submit Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Total Transactions</span>
          <p className="text-3xl font-bold text-[#002045] mt-1 tabular-nums">{transactions.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Total Expenses</span>
          <p className="text-3xl font-bold text-[#ba1a1a] mt-1 tabular-nums">₦{totalExpense.toLocaleString()}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Total Income / Grants</span>
          <p className="text-3xl font-bold text-[#22543d] mt-1 tabular-nums">₦{totalIncome.toLocaleString()}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Net Ledger Position</span>
          <p className="text-3xl font-bold text-[#13696a] mt-1 tabular-nums">₦{(totalIncome - totalExpense).toLocaleString()}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
        <div className="p-4 border-b border-[#e2e8f0] font-bold text-[#002045] text-sm bg-[#f8f9ff]">
          💳 Real Financial Ledger Entries
        </div>
        {loading ? (
          <div className="p-8 text-center text-xs text-[#74777f]">Loading transactions from database...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#74777f]">No financial transactions recorded yet. Click "+ Log New Transaction" to create one.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
              <tr>
                <th className="p-3">Category</th>
                <th className="p-3">Description</th>
                <th className="p-3">Type</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Requested By</th>
                <th className="p-3">Date</th>
                <th className="p-3">Approval Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0d1c2e]">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#e5eeff]">
                  <td className="p-3 font-bold text-[#002045]">{tx.category}</td>
                  <td className="p-3 text-[#43474e]">{tx.description}</td>
                  <td className="p-3 font-semibold">
                    <span className={tx.type === 'INCOME' ? 'text-[#22543d]' : 'text-[#ba1a1a]'}>{tx.type}</span>
                  </td>
                  <td className="p-3 font-bold font-mono tabular-nums text-[#002045]">₦{Number(tx.amount).toLocaleString()}</td>
                  <td className="p-3 text-[#74777f]">{tx.requestedBy ? `${tx.requestedBy.firstName} ${tx.requestedBy.lastName}` : 'System'}</td>
                  <td className="p-3 text-[#74777f] tabular-nums">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  <td className="p-3"><span className="badge-low-risk">{tx.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
