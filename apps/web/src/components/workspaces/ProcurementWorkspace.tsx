'use client';

import type { PurchaseRequest } from '@/types/procurement';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function ProcurementWorkspace({ user }: { user: any }) {
  const [orders, setOrders] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '1',
    estimatedCost: '',
    vendor: 'JUTH Reagent Supplier',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/procurement');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load procurement orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/procurement', formData);
      setShowModal(false);
      setFormData({ itemName: '', quantity: '1', estimatedCost: '', vendor: 'JUTH Reagent Supplier' });
      fetchOrders();
    } catch (err) {
      console.error('Failed to create procurement order', err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalCost = orders.reduce((sum, o) => sum + (Number(o.estimatedCost) || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[var(--nav-surface)] text-white p-5 rounded-lg border border-[var(--nav-surface-raised)] shadow-sm">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--secondary)] text-white uppercase">Supply Chain & Procurement</span>
          <h1 className="text-2xl font-bold mt-1 text-white">Procurement Officer Workspace</h1>
          <p className="text-xs text-slate-300">Purchase requests, vendor RFQs, purchase orders, contracts, and goods delivery notes.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs mt-3 md:mt-0">
          + Create Purchase Order
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Create Procurement Order</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Item Name / Supply *</label>
                <input
                  type="text"
                  required
                  value={formData.itemName}
                  onChange={e => setFormData({ ...formData, itemName: e.target.value })}
                  placeholder="e.g. VIA Cervical Screening Acetic Acid Test Kits"
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Estimated Cost (₦) *</label>
                  <input
                    type="number"
                    required
                    value={formData.estimatedCost}
                    onChange={e => setFormData({ ...formData, estimatedCost: e.target.value })}
                    placeholder="e.g. 2500000"
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Vendor / Supplier *</label>
                <select
                  value={formData.vendor}
                  onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                >
                  <option value="JUTH Reagent Supplier">Jos University Teaching Hospital Medical Supplies</option>
                  <option value="Plateau State Medical Logistics">Plateau State Medical Logistics Agency</option>
                  <option value="MedPharma West Africa">MedPharma West Africa Ltd</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Total Purchase Orders</span>
          <p className="text-3xl font-bold text-[var(--primary)] mt-1 tabular-nums">{orders.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Total Procurement Value</span>
          <p className="text-3xl font-bold text-[var(--secondary)] mt-1 tabular-nums">₦{totalCost.toLocaleString()}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Approved Vendors</span>
          <p className="text-3xl font-bold text-[var(--risk-low-text)] mt-1 tabular-nums">18</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Pending Goods Delivery</span>
          <p className="text-3xl font-bold text-[var(--risk-mod-text)] mt-1 tabular-nums">{orders.filter(o => o.status === 'PENDING').length}</p>
        </div>
      </div>

      {/* Procurement Orders Table */}
      <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
        <div className="p-4 border-b border-[var(--outline)] font-bold text-[var(--primary)] text-sm bg-[var(--background)]">
          📦 Live Procurement Purchase Orders
        </div>
        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--muted)]">Loading procurement orders from database...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--muted)]">No purchase orders logged yet. Click &quot;+ Create Purchase Order&quot; to create one.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
              <tr>
                <th className="p-3">Item Name</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Estimated Cost</th>
                <th className="p-3">Requested By</th>
                <th className="p-3">Order Date</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-[var(--primary-surface)]">
                  <td className="p-3 font-bold text-[var(--primary)]">{o.itemName}</td>
                  <td className="p-3 font-mono tabular-nums">{o.quantity} units</td>
                  <td className="p-3 text-[var(--secondary)] font-semibold">{o.vendor}</td>
                  <td className="p-3 font-bold font-mono tabular-nums text-[var(--primary)]">₦{Number(o.estimatedCost).toLocaleString()}</td>
                  <td className="p-3 text-[var(--muted)]">{o.requestedBy ? `${o.requestedBy.firstName} ${o.requestedBy.lastName}` : 'System'}</td>
                  <td className="p-3 text-[var(--muted)] tabular-nums">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="p-3"><span className="badge-low-risk">{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
