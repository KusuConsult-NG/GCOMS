'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AccessDenied } from '@/components/AccessDenied';
import type { Contract, GoodsReceivedNote, PlanItem, PurchaseRequest, Rfq, RfqQuote, Vendor } from '@/types/procurement';
import { daysUntil, useToday } from '@/lib/useToday';
import { PROCUREMENT_PAGE_ROLES } from '@/components/pageAccess';

const TABS = ['orders', 'plan', 'vendors', 'rfq', 'grn', 'contracts'] as const;
type Tab = (typeof TABS)[number];

const isTab = (value: string | null): value is Tab =>
  value !== null && (TABS as readonly string[]).includes(value);

/**
 * Module scope, not component scope: as a literal inside the component this was
 * a new array on every render, so every effect listing it as a dependency would
 * re-run on every render. Hoisting it is what lets the dependency be declared
 * honestly instead of omitted.
 */
const ALLOWED_ROLES = PROCUREMENT_PAGE_ROLES;

function ProcurementPageContent() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const today = useToday();
  const [orders, setOrders] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<null | 'requisition' | 'plan' | 'vendor' | 'rfq' | 'grn' | 'contract'>(null);

  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '1',
    estimatedCost: '',
    vendor: 'JUTH Reagent Supplier',
  });
  const [submitting, setSubmitting] = useState(false);

  // States for new features
  const [planForm, setPlanForm] = useState({ category: 'Medical Consumables', description: '', quantity: '1', unitPrice: '', quarter: 'Q1', priority: 'MEDIUM' });
  const [vendorForm, setVendorForm] = useState({ name: '', category: 'Medical Reagents', taxId: '', contactPerson: '', phone: '', email: '', address: '' });
  const [rfqForm, setRfqForm] = useState({ description: '', quantity: '1', deadline: '', invitedVendors: [] as string[] });
  const [grnForm, setGrnForm] = useState({ procurementOrderId: '', deliveryNote: '', itemsReceived: '', quantity: '1', condition: 'GOOD', officer: '', inspectionDate: '', remarks: '' });
  const [contractForm, setContractForm] = useState({ vendorId: '', title: '', value: '', startDate: '', endDate: '', deliverables: '' });
  const [quoteModal, setQuoteModal] = useState<{ rfqId: string } | null>(null);
  const [quoteForm, setQuoteForm] = useState({ vendorId: '', price: '', warranty: '', score: '' });
  
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [grns, setGrns] = useState<GoodsReceivedNote[]>([]);

  // Read URL action & tab params from Sidebar links
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const actionParam = searchParams.get('action');

    if (isTab(tabParam)) {
      setActiveTab(tabParam);
    }
    if (actionParam) {
      if (actionParam === 'new-requisition') setActiveModal('requisition');
      if (actionParam === 'rfq') { setActiveTab('rfq'); setActiveModal('rfq'); }
      if (actionParam === 'grn') { setActiveTab('grn'); setActiveModal('grn'); }
    }
  }, [searchParams]);

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

  // Vendors and RFQs are their own tables. This page used to derive vendors by
  // filtering purchase requests whose itemName began with "[VENDOR_REG] " —
  // a registration was written into the requisition table as a marker string and
  // parsed back out on read, so every registered vendor also appeared as a
  // zero-cost purchase request, and nothing else in the system could see them.
  const fetchVendors = async () => {
    try {
      const res = await api.get('/operations/vendors');
      setVendors(res.data ?? []);
    } catch (err) {
      console.error('Failed to load vendors', err);
    }
  };

  const fetchPlanItems = async () => {
    try {
      const res = await api.get('/operations/plan-items');
      setPlanItems(res.data ?? []);
    } catch (err) {
      console.error('Failed to load the procurement plan', err);
    }
  };

  const fetchGrns = async () => {
    try {
      const res = await api.get('/operations/grns');
      setGrns(res.data ?? []);
    } catch (err) {
      console.error('Failed to load goods received notes', err);
    }
  };

  const fetchContracts = async () => {
    try {
      const res = await api.get('/operations/contracts');
      setContracts(res.data ?? []);
    } catch (err) {
      console.error('Failed to load contracts', err);
    }
  };

  const fetchRfqs = async () => {
    try {
      const res = await api.get('/operations/rfqs');
      setRfqs(res.data ?? []);
    } catch (err) {
      console.error('Failed to load RFQs', err);
    }
  };

  useEffect(() => {
    if (user && ALLOWED_ROLES.includes(user.role)) {
      fetchOrders();
      fetchVendors();
      fetchRfqs();
      fetchPlanItems();
      fetchGrns();
      fetchContracts();
    }
  }, [user]);

  if (user && !ALLOWED_ROLES.includes(user.role)) {
    return <AccessDenied requiredRole="Procurement Officer / Executive" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/procurement', formData);
      setActiveModal(null);
      setFormData({ itemName: '', quantity: '1', estimatedCost: '', vendor: 'JUTH Reagent Supplier' });
      fetchOrders();
    } catch (err) {
      console.error('Failed to create procurement order', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Its own table. This used to be posted as a purchase requisition with
      // "[ANNUAL PLAN] " glued onto the item name and the category, quarter and
      // priority packed into the same string, then parsed back out on read.
      await api.post('/operations/plan-items', {
        category: planForm.category,
        description: planForm.description,
        quantity: Number(planForm.quantity),
        unitPrice: Number(planForm.unitPrice),
        quarter: planForm.quarter,
        priority: planForm.priority,
      });
      setActiveModal(null);
      setPlanForm({ category: 'Medical Consumables', description: '', quantity: '1', unitPrice: '', quarter: 'Q1', priority: 'MEDIUM' });
      await fetchPlanItems();
    } catch (err) {
      console.error('Failed to add plan', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/operations/vendors', {
        name: vendorForm.name,
        category: vendorForm.category,
        taxId: vendorForm.taxId || undefined,
        email: vendorForm.email || undefined,
        phone: vendorForm.phone || undefined,
      });
      setActiveModal(null);
      setVendorForm({ name: '', category: 'Medical Reagents', taxId: '', contactPerson: '', phone: '', email: '', address: '' });
      // Re-read rather than push the local guess: the server sets the status and
      // the id, and the id is what quotes are keyed by.
      await fetchVendors();
    } catch (err) {
      console.error('Failed to register vendor', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // The reference is allocated by the server. It used to be generated here
      // as RFQ-<year>-<random 0..999> and posted up against a unique column, so
      // a collision surfaced as "that reference already exists" about a value
      // the user was shown read-only and had never chosen.
      await api.post('/operations/rfqs', {
        description: rfqForm.description,
        closingDate: rfqForm.deadline
          ? new Date(rfqForm.deadline).toISOString()
          : undefined,
      });
      setActiveModal(null);
      setRfqForm({ description: '', quantity: '1', deadline: '', invitedVendors: [] });
      await fetchRfqs();
    } catch (err) {
      console.error('Failed to generate RFQ', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddQuote = async () => {
    if (!quoteModal || !quoteForm.vendorId || !quoteForm.price) return;
    setSubmitting(true);
    try {
      await api.post('/operations/quotes', {
        rfqId: quoteModal.rfqId,
        vendorId: quoteForm.vendorId,
        price: Number(quoteForm.price),
        warranty: quoteForm.warranty || undefined,
        score: quoteForm.score ? Number(quoteForm.score) : undefined,
      });
      setQuoteModal(null);
      setQuoteForm({ vendorId: '', price: '', warranty: '', score: '' });
      await fetchRfqs();
    } catch (err) {
      console.error('Failed to record quote', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Awarding is a transaction on the server: it demotes the other quotes and
  // closes the RFQ. Doing it in local state here meant the award existed only
  // in this tab, and used status strings no other part of the system knows.
  const handleAwardQuote = async (quoteId: string) => {
    try {
      await api.patch(`/operations/quotes/${quoteId}`, { status: 'RECOMMENDED' });
      await fetchRfqs();
    } catch (err) {
      console.error('Failed to award quote', err);
    }
  };

  const handleIssueGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // The reference is allocated by the server; it used to be `GRN-${Date.now()}`
      // stuffed into the vendor column of a zero-cost purchase requisition.
      await api.post('/operations/grns', {
        procurementOrderId: grnForm.procurementOrderId,
        deliveryNote: grnForm.deliveryNote,
        itemsReceived: grnForm.itemsReceived,
        quantity: Number(grnForm.quantity),
        condition: grnForm.condition,
        inspectionDate: new Date(grnForm.inspectionDate).toISOString(),
        officer: grnForm.officer,
        remarks: grnForm.remarks || undefined,
      });
      setActiveModal(null);
      setGrnForm({ procurementOrderId: '', deliveryNote: '', itemsReceived: '', quantity: '1', condition: 'GOOD', officer: '', inspectionDate: '', remarks: '' });
      await fetchGrns();
    } catch (err) {
      console.error('Failed to issue GRN', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/operations/contracts', {
        vendorId: contractForm.vendorId,
        title: contractForm.title,
        value: Number(contractForm.value),
        startDate: new Date(contractForm.startDate).toISOString(),
        endDate: new Date(contractForm.endDate).toISOString(),
        deliverables: contractForm.deliverables || undefined,
      });
      setActiveModal(null);
      setContractForm({ vendorId: '', title: '', value: '', startDate: '', endDate: '', deliverables: '' });
      await fetchContracts();
    } catch (err) {
      console.error('Failed to add contract', err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalCost = orders.reduce((sum, o) => sum + (Number(o.estimatedCost) || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[var(--outline)] pb-5">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Enterprise Procurement & Supply Chain Software • GCOMS
          </span>
          <h1 className="text-2xl font-bold mt-1 text-[var(--on-background)]">Procurement Management & Vendor Registry</h1>
          <p className="text-[var(--muted)] text-xs mt-0.5">Manage annual procurement plans, RFQs, vendor evaluations, contracts, and Goods Received Notes (GRN).</p>
        </div>
        <div className="mt-3 lg:mt-0 flex flex-wrap gap-2">
          <button onClick={() => setActiveModal('requisition')} className="btn-primary text-xs bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]">
            + New Purchase Requisition
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex border-b border-[var(--outline)] gap-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'orders', label: 'Purchase Orders & Requisitions' },
          { id: 'plan', label: 'Annual Procurement Plan' },
          { id: 'vendors', label: 'Approved Vendor Directory & Ratings' },
          { id: 'rfq', label: 'RFQs & Vendor Quotation Comparison' },
          { id: 'grn', label: 'Goods Received Notes (GRN) & Inspections' },
          { id: 'contracts', label: 'Contract Management' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as Tab)}
            className={`py-2.5 px-4 rounded-t border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id ? 'border-[var(--secondary)] text-[var(--secondary)] bg-white font-bold' : 'border-transparent text-[var(--muted)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* MODALS */}
      {/* Modal 1: Requisition */}
      {activeModal === 'requisition' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Create Purchase Requisition</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Item Description / Consumable *</label>
                <input type="text" required value={formData.itemName} onChange={e => setFormData({ ...formData, itemName: e.target.value })} placeholder="e.g. Acetic Acid Test Kits" className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Quantity *</label>
                  <input type="number" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Estimated Cost (₦) *</label>
                  <input type="number" required value={formData.estimatedCost} onChange={e => setFormData({ ...formData, estimatedCost: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Vendor / Supplier *</label>
                <select value={formData.vendor} onChange={e => setFormData({ ...formData, vendor: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  {vendors.map((v, i) => <option key={i} value={v.name}>{v.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">{submitting ? 'Submitting...' : 'Create Order'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Plan */}
      {activeModal === 'plan' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Add to Annual Plan</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleAddPlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Category *</label>
                <select value={planForm.category} onChange={e => setPlanForm({ ...planForm, category: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  {['Medical Consumables', 'Laboratory Reagents', 'Equipment', 'Furniture', 'IT Hardware', 'Vehicles', 'Office Supplies'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Description *</label>
                <input type="text" required value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Estimated Qty *</label>
                  <input type="number" required value={planForm.quantity} onChange={e => setPlanForm({ ...planForm, quantity: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Unit Price (₦) *</label>
                  <input type="number" required value={planForm.unitPrice} onChange={e => setPlanForm({ ...planForm, unitPrice: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Budget Quarter *</label>
                  <select value={planForm.quarter} onChange={e => setPlanForm({ ...planForm, quarter: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                    {['Q1', 'Q2', 'Q3', 'Q4'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Priority *</label>
                  <select value={planForm.priority} onChange={e => setPlanForm({ ...planForm, priority: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                    {['HIGH', 'MEDIUM', 'LOW'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">Submit Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Vendor */}
      {activeModal === 'vendor' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Register Vendor</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleRegisterVendor} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Vendor Name *</label>
                <input type="text" required value={vendorForm.name} onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Business Category *</label>
                <select value={vendorForm.category} onChange={e => setVendorForm({ ...vendorForm, category: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  {['Medical Reagents', 'Laboratory Equipment', 'Consumables', 'IT Hardware', 'Office Supplies', 'Logistics & Transport', 'Construction'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Tax ID / TIN *</label>
                <input type="text" required value={vendorForm.taxId} onChange={e => setVendorForm({ ...vendorForm, taxId: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Contact Person *</label>
                  <input type="text" required value={vendorForm.contactPerson} onChange={e => setVendorForm({ ...vendorForm, contactPerson: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Phone *</label>
                  <input type="tel" required value={vendorForm.phone} onChange={e => setVendorForm({ ...vendorForm, phone: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Email *</label>
                <input type="email" required value={vendorForm.email} onChange={e => setVendorForm({ ...vendorForm, email: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Address *</label>
                <input type="text" required value={vendorForm.address} onChange={e => setVendorForm({ ...vendorForm, address: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Generate RFQ */}
      {activeModal === 'rfq' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Generate New RFQ</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleGenerateRFQ} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">RFQ Reference</label>
                <p className="w-full bg-[var(--surface-variant)] border border-[var(--outline)] rounded px-3 py-2 text-xs text-[var(--muted)]">
                  Assigned by the system when the RFQ is issued.
                </p>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Item Description *</label>
                <input type="text" required value={rfqForm.description} onChange={e => setRfqForm({ ...rfqForm, description: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Required Qty *</label>
                  <input type="number" required value={rfqForm.quantity} onChange={e => setRfqForm({ ...rfqForm, quantity: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Deadline *</label>
                  <input type="date" required value={rfqForm.deadline} onChange={e => setRfqForm({ ...rfqForm, deadline: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Invited Vendors *</label>
                <div className="space-y-1">
                  {vendors.map((v, idx) => (
                    <label key={idx} className="flex items-center gap-2">
                      <input type="checkbox" onChange={(e) => {
                        if (e.target.checked) setRfqForm({ ...rfqForm, invitedVendors: [...rfqForm.invitedVendors, v.name] });
                        else setRfqForm({ ...rfqForm, invitedVendors: rfqForm.invitedVendors.filter(name => name !== v.name) });
                      }} /> {v.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Create RFQ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Issue GRN */}
      {activeModal === 'grn' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Issue Goods Received Note</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleIssueGRN} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">PO Reference *</label>
                <select required value={grnForm.procurementOrderId} onChange={e => setGrnForm({ ...grnForm, procurementOrderId: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="">Select a purchase order…</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>{o.itemName} — {o.quantity} ordered</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Delivery Note No. *</label>
                  <input type="text" required value={grnForm.deliveryNote} onChange={e => setGrnForm({ ...grnForm, deliveryNote: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Qty Received *</label>
                  <input type="number" required value={grnForm.quantity} onChange={e => setGrnForm({ ...grnForm, quantity: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Items Received *</label>
                <textarea required rows={2} value={grnForm.itemsReceived} onChange={e => setGrnForm({ ...grnForm, itemsReceived: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Condition *</label>
                  <select value={grnForm.condition} onChange={e => setGrnForm({ ...grnForm, condition: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                    {['GOOD', 'PARTIAL', 'DAMAGED', 'REJECTED'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Inspection Date *</label>
                  <input type="date" required value={grnForm.inspectionDate} onChange={e => setGrnForm({ ...grnForm, inspectionDate: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Receiving Officer *</label>
                <input type="text" required value={grnForm.officer} onChange={e => setGrnForm({ ...grnForm, officer: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Remarks</label>
                <textarea rows={1} value={grnForm.remarks} onChange={e => setGrnForm({ ...grnForm, remarks: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">Issue GRN</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Contract */}
      {activeModal === 'contract' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Add Contract</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleAddContract} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Vendor *</label>
                <select required value={contractForm.vendorId} onChange={e => setContractForm({ ...contractForm, vendorId: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="">Select a registered vendor…</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Contract Title *</label>
                <input type="text" required value={contractForm.title} onChange={e => setContractForm({ ...contractForm, title: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Contract Value (₦) *</label>
                <input type="number" required value={contractForm.value} onChange={e => setContractForm({ ...contractForm, value: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Start Date *</label>
                  <input type="date" required value={contractForm.startDate} onChange={e => setContractForm({ ...contractForm, startDate: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">End Date *</label>
                  <input type="date" required value={contractForm.endDate} onChange={e => setContractForm({ ...contractForm, endDate: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Key Deliverables *</label>
                <textarea required rows={2} value={contractForm.deliverables} onChange={e => setContractForm({ ...contractForm, deliverables: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Add Contract</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Total Purchase Orders</span>
          <p className="text-3xl font-bold text-[var(--primary)] mt-1 tabular-nums">{orders.filter(o => o.itemName && !o.itemName.startsWith('[')).length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Total Requisition Value</span>
          <p className="text-3xl font-bold text-[var(--secondary)] mt-1 tabular-nums">₦{totalCost.toLocaleString()}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Approved Vendors</span>
          <p className="text-3xl font-bold text-[var(--risk-low-text)] mt-1 tabular-nums">{vendors.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Pending Goods Delivery</span>
          <p className="text-3xl font-bold text-[var(--risk-mod-text)] mt-1 tabular-nums">{orders.filter(o => o.itemName && !o.itemName.startsWith('[') && o.status === 'PENDING').length}</p>
        </div>
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
          <div className="p-4 border-b border-[var(--outline)] font-bold text-[var(--primary)] text-sm bg-[var(--background)]">
            Active Purchase Orders & Requisitions
          </div>
          {loading ? (
            <div className="p-8 text-center text-xs text-[var(--muted)]">Loading purchase orders...</div>
          ) : orders.filter(o => o.itemName && !o.itemName.startsWith('[')).length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--muted)]">No purchase orders created yet.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                <tr>
                  <th className="p-3">Item Description</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Cost</th>
                  <th className="p-3">Requested By</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Executive Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
                {orders.filter(o => o.itemName && !o.itemName.startsWith('[')).map((o) => (
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
      )}

      {/* TAB 2: ANNUAL PROCUREMENT PLAN */}
      {activeTab === 'plan' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
          <div className="p-4 border-b border-[var(--outline)] flex justify-between items-center bg-[var(--background)]">
            <h2 className="font-bold text-[var(--primary)] text-sm">Annual Procurement Plan</h2>
            <button onClick={() => setActiveModal('plan')} className="btn-primary text-xs bg-indigo-700 hover:bg-indigo-800">+ Add to Annual Plan</button>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
              <tr>
                <th className="p-3">Category</th>
                <th className="p-3">Description</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Unit Price</th>
                <th className="p-3">Total Cost</th>
                <th className="p-3">Quarter</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--outline)]">
              {planItems.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--primary-surface)]">
                  <td className="p-3 font-semibold text-[var(--secondary)]">{item.category}</td>
                  <td className="p-3 font-bold text-[var(--primary)]">{item.description}</td>
                  <td className="p-3 font-mono tabular-nums">{item.quantity}</td>
                  <td className="p-3 font-mono tabular-nums">₦{Number(item.unitPrice).toLocaleString()}</td>
                  {/* Derived by the server from the two columns to its left. */}
                  <td className="p-3 font-bold font-mono tabular-nums text-[var(--primary)]">₦{item.totalCost.toLocaleString()}</td>
                  <td className="p-3 font-bold">{item.quarter}</td>
                  <td className={`p-3 font-bold ${item.priority === 'HIGH' ? 'text-red-600 dark:text-red-400' : item.priority === 'LOW' ? 'text-[var(--muted)]' : 'text-amber-600 dark:text-amber-400'}`}>{item.priority}</td>
                  <td className="p-3"><span className="badge-low-risk">{item.status}</span></td>
                </tr>
              ))}
              {planItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-[var(--muted)]">No annual plan items yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: VENDORS */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] p-5 space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-[var(--outline)] pb-2">
            <h2 className="font-bold text-[var(--primary)] text-sm">Approved Vendor Directory & Tax Compliance</h2>
            <button onClick={() => setActiveModal('vendor')} className="btn-primary text-xs">+ Register Vendor</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vendors.map((v) => (
              <div key={v.id} className="p-4 bg-[var(--background)] border border-[var(--outline)] rounded space-y-2">
                <div className="flex justify-between font-bold text-[var(--primary)]">
                  <span>{v.name}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    {Number(v.rating) > 0 ? `${Number(v.rating).toFixed(1)} / 5` : 'Unrated'}
                  </span>
                </div>
                <p className="text-[var(--secondary)] font-semibold">{v.category || 'Uncategorised'}</p>
                <p className="text-[var(--on-surface-variant)] text-[11px]">Tax ID: <span className="font-mono text-[var(--on-background)]">{v.taxId || 'Not supplied'}</span></p>
                <span className="badge-low-risk">{v.status}</span>
              </div>
            ))}
            {vendors.length === 0 && (
              <p className="col-span-full p-6 text-center text-xs text-[var(--muted)] border border-dashed border-[var(--outline)] rounded">
                No vendors registered yet. Register one to invite it to an RFQ.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: RFQ */}
      {activeTab === 'rfq' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] p-5 space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-[var(--outline)] pb-2">
            <h2 className="font-bold text-[var(--primary)] text-sm">Request for Quotations (RFQ) & Technical Evaluation Matrix</h2>
            <button onClick={() => setActiveModal('rfq')} className="btn-primary text-xs">+ Generate New RFQ</button>
          </div>
          {rfqs.length === 0 && (
            <p className="p-6 text-center text-xs text-[var(--muted)] border border-dashed border-[var(--outline)] rounded">
              No RFQs issued yet. Generating one allocates the next reference in this year&apos;s sequence.
            </p>
          )}
          {rfqs.map((rfq, idx) => (
            <div key={rfq.id ?? idx} className="p-4 bg-[var(--background)] border border-[var(--outline)] rounded space-y-3">
              <div className="flex justify-between font-bold text-[var(--primary)] mb-2">
                <span>RFQ Ref: {rfq.reference} — {rfq.description}</span>
                <span className="badge-low-risk">{rfq.status}</span>
              </div>
              <div className="flex justify-end gap-2 mb-2">
                <button onClick={() => {
                  setQuoteModal({ rfqId: rfq.id });
                  setQuoteForm({ vendorId: '', price: '', warranty: '', score: '' });
                }} className="btn-secondary text-[10px] py-1">+ Add Vendor Quote</button>
              </div>
              <table className="w-full text-left border border-[var(--outline)] bg-white rounded">
                <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Bidding Vendor</th>
                    <th className="p-2">Quoted Unit Price</th>
                    <th className="p-2">Delivery Warranty</th>
                    <th className="p-2">Technical Score</th>
                    <th className="p-2">Committee Status</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--outline)]">
                  {rfq.quotes.map((q: RfqQuote, qIdx: number) => (
                    <tr key={q.id ?? qIdx} className={q.status === 'RECOMMENDED' ? 'bg-emerald-50' : ''}>
                      <td className="p-2 font-bold text-[var(--primary)]">{q.vendor?.name ?? 'Unknown vendor'} {q.status === 'RECOMMENDED' && '(WINNER)'}</td>
                      <td className="p-2 font-mono">₦{Number(q.price).toLocaleString()} / unit</td>
                      <td className="p-2">{q.warranty || '—'}</td>
                      <td className={`p-2 font-bold ${Number(q.score) > 85 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>{q.score} / 100</td>
                      <td className="p-2"><span className={q.status === 'RECOMMENDED' ? 'badge-low-risk' : 'text-[var(--muted)]'}>{q.status}</span></td>
                      <td className="p-2">
                        {q.status !== 'RECOMMENDED' && (
                          <button onClick={() => handleAwardQuote(q.id)} className="btn-primary text-[10px] py-1 px-2">Mark Winner</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rfq.quotes.length === 0 && (
                    <tr><td colSpan={6} className="p-4 text-center text-gray-500">No quotes received yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: GRN */}
      {activeTab === 'grn' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] p-5 space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-[var(--outline)] pb-2">
            <h2 className="font-bold text-[var(--primary)] text-sm">Goods Received Notes (GRN) & Physical Inspection Register</h2>
            <button onClick={() => setActiveModal('grn')} className="btn-primary text-xs">+ Issue GRN</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {grns.map((g) => (
              <div key={g.id} className="p-4 bg-[var(--background)] border border-[var(--outline)] rounded space-y-2">
                <div className="flex justify-between font-bold text-[var(--primary)]">
                  <span className="font-mono">{g.reference}</span>
                  <span className={g.condition === 'GOOD' ? 'badge-low-risk' : 'badge-high-risk'}>{g.condition}</span>
                </div>
                <p className="text-[var(--on-background)] font-semibold">{g.itemsReceived}</p>
                <p className="text-[var(--on-surface-variant)] text-[11px]">
                  Against: <strong className="text-[var(--primary)]">{g.procurementOrder?.itemName ?? 'Unknown order'}</strong>
                  {g.procurementOrder && ` (${g.quantity} of ${g.procurementOrder.quantity} ordered)`}
                </p>
                <p className="text-[var(--on-surface-variant)] text-[11px]">
                  Delivery note <span className="font-mono text-[var(--on-background)]">{g.deliveryNote}</span> · inspected {new Date(g.inspectionDate).toLocaleDateString()} by {g.officer}
                </p>
                {g.remarks && <p className="text-[var(--muted)] text-[11px] italic">{g.remarks}</p>}
              </div>
            ))}
            {grns.length === 0 && (
              <p className="col-span-full p-6 text-center text-xs text-[var(--muted)] border border-dashed border-[var(--outline)] rounded">
                No goods received notes yet. Issuing one records a delivery against a purchase order.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: CONTRACTS */}
      {activeTab === 'contracts' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
          <div className="p-4 border-b border-[var(--outline)] flex justify-between items-center bg-[var(--background)]">
            <h2 className="font-bold text-[var(--primary)] text-sm">Contract Management</h2>
            <button onClick={() => setActiveModal('contract')} className="btn-primary text-xs bg-indigo-700 hover:bg-indigo-800">+ Add Contract</button>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
              <tr>
                <th className="p-3">Reference</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Title</th>
                <th className="p-3">Value</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">End Date</th>
                <th className="p-3">Days Remaining</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--outline)]">
              {contracts.map((c) => {
                // Relative to a date captured after mount, not to the clock read
                // during render — otherwise the server and the browser disagree.
                const remaining = daysUntil(c.endDate, today);
                return (
                  <tr key={c.id} className="hover:bg-[var(--primary-surface)]">
                    <td className="p-3 font-mono text-[var(--muted)]">{c.reference}</td>
                    <td className="p-3 font-bold text-[var(--primary)]">{c.vendor?.name ?? 'Unknown vendor'}</td>
                    <td className="p-3 font-semibold text-[var(--secondary)]">{c.title}</td>
                    <td className="p-3 font-mono tabular-nums font-bold">₦{Number(c.value).toLocaleString()}</td>
                    <td className="p-3 tabular-nums">{new Date(c.startDate).toLocaleDateString()}</td>
                    <td className="p-3 tabular-nums">{new Date(c.endDate).toLocaleDateString()}</td>
                    <td className={`p-3 font-bold tabular-nums ${remaining === null ? 'text-[var(--muted)]' : remaining < 0 ? 'text-red-600 dark:text-red-400' : remaining <= 30 ? 'text-orange-600 dark:text-orange-400' : 'text-green-700 dark:text-green-400'}`}>
                      {remaining === null ? '—' : remaining < 0 ? `expired ${Math.abs(remaining)}d ago` : `${remaining} days`}
                    </td>
                    <td className="p-3"><span className="badge-low-risk">{c.status}</span></td>
                  </tr>
                );
              })}
              {contracts.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-[var(--muted)]">No contracts yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {quoteModal !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-bold text-[var(--primary)] mb-4">Add Vendor Quotation</h3>
            <div className="space-y-3">
              <div><label className="text-xs font-semibold text-[var(--primary-container)]">Vendor</label>
                <select className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" value={quoteForm.vendorId} onChange={e => setQuoteForm(p => ({...p, vendorId: e.target.value}))}>
                  <option value="">Select a registered vendor…</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                {vendors.length === 0 && (
                  <p className="text-[10px] text-[var(--muted)] mt-1">No vendors registered yet — add one on the Vendors tab first.</p>
                )}</div>
              <div><label className="text-xs font-semibold text-[var(--primary-container)]">Unit Price (₦)</label>
                <input type="number" className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" value={quoteForm.price} onChange={e => setQuoteForm(p => ({...p, price: e.target.value}))} /></div>
              <div><label className="text-xs font-semibold text-[var(--primary-container)]">Warranty</label>
                <input className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" value={quoteForm.warranty} onChange={e => setQuoteForm(p => ({...p, warranty: e.target.value}))} /></div>
              <div><label className="text-xs font-semibold text-[var(--primary-container)]">Technical Score (0-100)</label>
                <input type="number" min="0" max="100" className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" value={quoteForm.score} onChange={e => setQuoteForm(p => ({...p, score: e.target.value}))} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-primary" disabled={submitting || !quoteForm.vendorId || !quoteForm.price} onClick={handleAddQuote}>
                {submitting ? 'Saving…' : 'Add Quote'}
              </button>
              <button className="btn-secondary" onClick={() => setQuoteModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProcurementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--muted)]">Loading Procurement Application...</div>}>
      <ProcurementPageContent />
    </Suspense>
  );
}
