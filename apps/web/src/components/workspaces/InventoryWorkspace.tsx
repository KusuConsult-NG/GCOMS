'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

export function InventoryWorkspace({ user }: { user: any }) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'consumables' | 'assets' | 'movements' | 'reorder' | 'maintenance'>('consumables');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<null | 'stock' | 'asset' | 'issue' | 'reorder' | 'maintenance' | 'maintenance_complete'>(null);

  const [formData, setFormData] = useState({
    itemName: '', category: 'Medical Consumables', quantity: '100', unit: 'boxes', minThreshold: '20'
  });
  
  const [assetForm, setAssetForm] = useState({
    assetName: '', assetTag: '', category: 'MEDICAL_EQUIPMENT', serialNumber: '', acquisitionDate: '', purchaseCost: '', currentLocation: '', assignedTo: '', condition: 'GOOD'
  });

  const [movements, setMovements] = useState<any[]>([]);

  const [movementForm, setMovementForm] = useState({
    type: 'STOCK_RECEIPT', itemId: '', qty: '', from: '', to: '', ref: '', remarks: '', date: new Date().toISOString().split('T')[0], authorized: ''
  });

  const [maintenanceSchedule, setMaintenanceSchedule] = useState<any[]>([]);

  const [maintenanceForm, setMaintenanceForm] = useState({
    asset: '', type: 'PREVENTIVE', scheduledDate: '', technician: '', cost: '', description: ''
  });

  const [reorderItem, setReorderItem] = useState<any>(null);
  const [reorderForm, setReorderForm] = useState({ reorderQty: 0, vendor: '', urgency: 'STANDARD' });

  const [maintenanceCompleteData, setMaintenanceCompleteData] = useState({ id: null, actualDate: '', partsReplaced: '', findings: '', nextServiceDue: '' });

  const [submitting, setSubmitting] = useState(false);

  const fetchMovements = async () => {
    try { setMovements((await api.get('/operations/stock-movements')).data); }
    catch (err) { console.error('Failed to fetch stock movements', err); }
  };

  const fetchServiceLogs = async () => {
    try {
      const res = await api.get('/inventory/service-logs');
      setMaintenanceSchedule(res.data);
    } catch (err) { console.error('Failed to fetch service logs', err); }
  };

  useEffect(() => {
    fetchServiceLogs();
    fetchMovements();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const actionParam = searchParams.get('action');

    if (tabParam && ['consumables', 'assets', 'movements', 'reorder', 'maintenance'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
    if (actionParam) {
      if (actionParam === 'issue-stock') { setActiveTab('movements'); setActiveModal('issue'); }
      if (actionParam === 'new-asset') { setActiveTab('assets'); setActiveModal('asset'); }
    }
  }, [searchParams]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory');
      setItems(res.data);
      // Try to derive movements from inventory history
      // Until a dedicated movements endpoint exists, movements state remains local
      // This is acceptable since movements are logged against inventory items
    } catch (err) {
      console.error('Failed to fetch inventory items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/inventory', formData);
      setActiveModal(null);
      setFormData({ itemName: '', category: 'Medical Consumables', quantity: '100', unit: 'boxes', minThreshold: '20' });
      fetchInventory();
    } catch (err) {
      console.error('Failed to add inventory item', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/inventory', {
        itemName: assetForm.assetName,
        category: `ASSET - ${assetForm.category}`,
        quantity: 1,
        unit: 'unit',
        minThreshold: 0,
        assetDetails: assetForm
      });
      setActiveModal(null);
      setAssetForm({ assetName: '', assetTag: '', category: 'MEDICAL_EQUIPMENT', serialNumber: '', acquisitionDate: '', purchaseCost: '', currentLocation: '', assignedTo: '', condition: 'GOOD' });
      fetchInventory();
    } catch (err) {
      console.error('Failed to add asset', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const item = items.find(i => i.id === movementForm.itemId || i.id === parseInt(movementForm.itemId));
      const mQty = parseInt(movementForm.qty) || 0;
      if (item) {
        let newQty = parseInt(item.quantity);
        if (movementForm.type === 'STOCK_RECEIPT') newQty += mQty;
        else if (movementForm.type === 'STOCK_ISSUE' || movementForm.type === 'DISPOSAL') newQty -= mQty;
        else if (movementForm.type === 'ADJUSTMENT') newQty += mQty; 
        await api.patch(`/inventory/${item.id}`, { quantity: newQty });
      }
      setMovements([...movements, {
        id: Date.now(),
        type: movementForm.type,
        item: item ? item.itemName || item.name : 'Unknown Item',
        qty: mQty,
        from: movementForm.from,
        to: movementForm.to,
        ref: movementForm.ref,
        authorized: movementForm.authorized,
        date: movementForm.date,
        remarks: movementForm.remarks
      }]);
      setActiveModal(null);
      setMovementForm({ type: 'STOCK_RECEIPT', itemId: '', qty: '', from: '', to: '', ref: '', remarks: '', date: new Date().toISOString().split('T')[0], authorized: '' });
      fetchInventory();
    } catch (err) {
      console.error('Failed to record movement', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReorderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/inventory', {
        itemName: `[REORDER] ${reorderItem.itemName || reorderItem.name}`,
        category: reorderItem.category,
        quantity: reorderForm.reorderQty,
        unit: reorderItem.unit,
        minThreshold: reorderItem.minThreshold
      });
      setActiveModal(null);
      setReorderItem(null);
      fetchInventory();
    } catch (err) {
      console.error('Failed to raise reorder', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMaintenanceSchedule([...maintenanceSchedule, {
      id: Date.now(),
      asset: maintenanceForm.asset,
      type: maintenanceForm.type,
      scheduledDate: maintenanceForm.scheduledDate,
      technician: maintenanceForm.technician,
      cost: Number(maintenanceForm.cost),
      description: maintenanceForm.description,
      status: 'SCHEDULED'
    }]);

    // Was POSTing a fake InventoryItem named "[MAINT_SCHED] ..." into the stock
    // table and swallowing the 400, so the schedule looked saved and was gone on
    // refresh. EquipmentServiceLog is the table for this.
    api.post('/inventory/service-logs', {
      inventoryItemId: maintenanceForm.asset,
      serviceType: maintenanceForm.type === 'PREVENTIVE' ? 'PREVENTIVE_MAINTENANCE' : maintenanceForm.type,
      performedBy: maintenanceForm.technician || 'Unassigned',
      serviceDate: maintenanceForm.scheduledDate,
      nextDueDate: maintenanceForm.scheduledDate,
      cost: Number(maintenanceForm.cost) || 0,
      status: 'SCHEDULED',
      notes: maintenanceForm.description || undefined,
    })
      .then(() => fetchServiceLogs())
      .catch(err => console.error('Failed to schedule maintenance', err));

    setActiveModal(null);
    setMaintenanceForm({ asset: '', type: 'PREVENTIVE', scheduledDate: '', technician: '', cost: '', description: '' });
  };

  const handleMaintenanceComplete = (e: React.FormEvent) => {
    e.preventDefault();
    setMaintenanceSchedule(maintenanceSchedule.map(m => m.id === maintenanceCompleteData.id ? { ...m, status: 'COMPLETED' } : m));
    
    const completedAsset = maintenanceSchedule.find(m => m.id === maintenanceCompleteData.id)?.asset;
    api.patch(`/inventory/service-logs/${maintenanceCompleteData.id}`, { status: 'COMPLETED' })
      .then(() => fetchServiceLogs())
      .catch(err => console.error('Failed to complete maintenance', err));

    setActiveModal(null);
  };

  const lowStockItems = items.filter(i => {
    const qty = Number(i.quantity);
    const min = Number(i.minThreshold) || 10;
    return qty <= min;
  });

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'STOCK_RECEIPT': return 'bg-green-100 text-green-800';
      case 'STOCK_ISSUE': return 'bg-orange-100 text-orange-800';
      case 'TRANSFER': return 'bg-blue-100 text-blue-800';
      case 'ADJUSTMENT': return 'bg-purple-100 text-purple-800';
      case 'DISPOSAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const assetItems = items.filter(i => (i.category || '').toLowerCase().includes('asset') || (i.category || '').toLowerCase().includes('equipment'));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-[var(--nav-surface)] text-white p-5 rounded-lg border border-[var(--nav-surface-raised)] shadow-sm">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--secondary)] text-white uppercase tracking-wider">
            Enterprise Inventory & Logistics Software • GCOMS
          </span>
          <h1 className="text-2xl font-bold mt-1 text-white">Inventory & Fixed Asset Management</h1>
          <p className="text-slate-300 text-xs mt-0.5">Track medical reagents, field consumables, reorder alerts, and barcode-tagged equipment.</p>
        </div>
        <div className="mt-3 lg:mt-0 flex flex-wrap gap-2">
          <button onClick={() => setActiveModal('stock')} className="btn-primary text-xs bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]">
            + Add Stock Consumable
          </button>
          <button onClick={() => { setActiveTab('movements'); setActiveModal('issue'); }} className="btn-primary text-xs bg-emerald-700 hover:bg-emerald-800">
            + Record Movement
          </button>
          <button onClick={() => { setActiveTab('assets'); setActiveModal('asset'); }} className="btn-primary text-xs bg-cyan-700 hover:bg-cyan-800">
            + Register Asset
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex border-b border-[var(--outline)] gap-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'consumables', label: '🧪 Medical Consumables & Reagents' },
          { id: 'assets', label: '🏷 Equipment Asset Register' },
          { id: 'movements', label: '📦 Stock Movement Log' },
          { id: 'reorder', label: '⚠️ Reorder Threshold Alerts' },
          { id: 'maintenance', label: '🔧 Maintenance & Service Schedule' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`py-2.5 px-4 rounded-t border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id ? 'border-[var(--secondary)] text-[var(--secondary)] bg-white font-bold' : 'border-transparent text-[var(--muted)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Total Stock Items</span>
          <p className="text-3xl font-bold text-[var(--primary)] mt-1 tabular-nums">{items.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Reorder Alerts</span>
          <p className="text-3xl font-bold text-[var(--risk-high-text)] mt-1 tabular-nums">{lowStockItems.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Tagged Equipment Assets</span>
          <p className="text-3xl font-bold text-[var(--secondary)] mt-1 tabular-nums">{assetItems.length}</p>
        </div>
        <div className="clinical-card">
          <span className="text-xs font-semibold text-[var(--muted)] uppercase">Stock Movements (This Month)</span>
          <p className="text-3xl font-bold text-[var(--risk-low-text)] mt-1 tabular-nums">{movements.length}</p>
        </div>
      </div>

      {/* TAB 1: CONSUMABLES */}
      {activeTab === 'consumables' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
          <div className="p-4 border-b border-[var(--outline)] font-bold text-[var(--primary)] text-sm bg-[var(--background)]">
            🧪 Medical Consumables & Reagent Inventory
          </div>
          {loading ? (
            <div className="p-8 text-center text-xs text-[var(--muted)]">Loading inventory items...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--muted)]">No stock items recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                  <tr>
                    <th className="p-3">Item Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">In-Stock Quantity</th>
                    <th className="p-3">Reorder Threshold</th>
                    <th className="p-3">Stock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
                  {items.map((i) => (
                    <tr key={i.id} className="hover:bg-[var(--primary-surface)]">
                      <td className="p-3 font-bold text-[var(--primary)]">{i.itemName || i.name}</td>
                      <td className="p-3 text-[var(--secondary)] font-semibold">{i.category}</td>
                      <td className="p-3 font-bold font-mono tabular-nums text-[var(--primary)]">{i.quantity} {i.unit}</td>
                      <td className="p-3 text-[var(--muted)] font-mono tabular-nums">{i.minThreshold || 10} {i.unit}</td>
                      <td className="p-3">
                        <span className={Number(i.quantity) <= Number(i.minThreshold || 10) ? 'px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800' : 'badge-low-risk'}>
                          {Number(i.quantity) <= Number(i.minThreshold || 10) ? 'REORDER LOW' : 'OPTIMAL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BARCODE ASSETS */}
      {activeTab === 'assets' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-[var(--outline)] bg-[var(--background)]">
            <h2 className="font-bold text-[var(--primary)] text-sm">🏷 Equipment Asset Register</h2>
            <button onClick={() => setActiveModal('asset')} className="btn-primary text-xs bg-cyan-700 hover:bg-cyan-800">+ Register Asset</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                <tr>
                  <th className="p-3">Asset Tag</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Serial No.</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Assigned To</th>
                  <th className="p-3">Condition</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
                {assetItems.map((a, i) => {
                  const details = a.assetDetails || {};
                  return (
                    <tr key={i} className="hover:bg-[var(--primary-surface)]">
                      <td className="p-3"><span className="text-[10px] font-mono font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded border border-green-200">{details.assetTag || 'TAG-PENDING'}</span></td>
                      <td className="p-3 font-bold text-[var(--primary)]">{a.itemName || a.name}</td>
                      <td className="p-3 text-[var(--secondary)] font-semibold">{a.category}</td>
                      <td className="p-3 font-mono">{details.serialNumber || '-'}</td>
                      <td className="p-3">{details.currentLocation || '-'}</td>
                      <td className="p-3">{details.assignedTo || '-'}</td>
                      <td className="p-3">{details.condition || 'GOOD'}</td>
                      <td className="p-3"><span className="badge-low-risk">ACTIVE</span></td>
                    </tr>
                  )
                })}
                {assetItems.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-[var(--muted)]">No assets registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MOVEMENTS */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-[var(--outline)] bg-[var(--background)]">
            <h2 className="font-bold text-[var(--primary)] text-sm">📦 Stock Movement Log</h2>
            <button onClick={() => setActiveModal('issue')} className="btn-primary text-xs bg-emerald-700 hover:bg-emerald-800">+ Record Movement</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Item</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">From</th>
                  <th className="p-3">To</th>
                  <th className="p-3">Ref</th>
                  <th className="p-3">Authorized By</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-[var(--primary-surface)]">
                    <td className="p-3 whitespace-nowrap">{String(m.movementDate ?? '').slice(0, 10)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getMovementBadge(m.type)}`}>{m.type}</span>
                    </td>
                    <td className="p-3 font-bold text-[var(--primary)]">{m.inventoryItem?.itemName ?? '—'}</td>
                    <td className="p-3 font-mono tabular-nums">{m.quantity}</td>
                    <td className="p-3">{m.fromLocation ?? '—'}</td>
                    <td className="p-3">{m.toLocation ?? '—'}</td>
                    <td className="p-3 font-mono">{m.reference ?? '—'}</td>
                    <td className="p-3">{m.authorisedBy ?? '—'}</td>
                    <td className="p-3 text-[var(--muted)] max-w-xs truncate">{m.remarks ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: REORDER ALERTS */}
      {activeTab === 'reorder' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="clinical-card border-orange-200 bg-orange-50">
              <span className="text-xs font-semibold text-orange-800 uppercase">Items Low Stock</span>
              <p className="text-3xl font-bold text-orange-900 mt-1">{lowStockItems.filter(i => Number(i.quantity) > 0).length}</p>
            </div>
            <div className="clinical-card border-red-200 bg-red-50">
              <span className="text-xs font-semibold text-red-800 uppercase">Items Out of Stock</span>
              <p className="text-3xl font-bold text-red-900 mt-1">{lowStockItems.filter(i => Number(i.quantity) <= 0).length}</p>
            </div>
            <div className="clinical-card border-blue-200 bg-blue-50">
              <span className="text-xs font-semibold text-blue-800 uppercase">Est. Reorder Value</span>
              <p className="text-3xl font-bold text-blue-900 mt-1">₦{items.filter(i => (Number(i.quantity) || 0) <= (Number(i.minThreshold) || 10)).reduce((sum, i) => sum + ((Number(i.minThreshold) || 10) * 2 * (i.unitPrice || 5000)), 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
            <div className="p-4 border-b border-[var(--outline)] font-bold text-[var(--primary)] text-sm bg-red-50 text-red-900">
              ⚠️ Automated Reorder Threshold Alerts
            </div>
            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-sm font-semibold text-green-700 bg-green-50">
                ✅ All stock levels are above reorder thresholds
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {lowStockItems.map((i, idx) => {
                  const qty = Number(i.quantity);
                  const isOOS = qty <= 0;
                  return (
                    <div key={idx} className="p-4 border border-[var(--outline)] rounded-lg shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-[var(--primary)]">{i.itemName || i.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isOOS ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                          {isOOS ? 'OUT_OF_STOCK' : 'LOW_STOCK'}
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs font-mono">
                        <div>
                          <span className="text-[var(--muted)] block">Current Qty</span>
                          <span className="font-bold text-[var(--primary)]">{qty} {i.unit}</span>
                        </div>
                        <div>
                          <span className="text-[var(--muted)] block">Reorder Level</span>
                          <span className="font-bold text-[var(--primary)]">{i.minThreshold} {i.unit}</span>
                        </div>
                      </div>
                      <button onClick={() => {
                        setReorderItem(i);
                        setReorderForm({ reorderQty: (Number(i.minThreshold) || 10) * 2, vendor: '', urgency: isOOS ? 'URGENT' : 'STANDARD' });
                        setActiveModal('reorder');
                      }} className="w-full btn-primary text-xs bg-[var(--nav-surface)] hover:bg-[var(--nav-surface-raised)]">
                        Raise Reorder Requisition
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-[var(--outline)] bg-[var(--background)]">
            <h2 className="font-bold text-[var(--primary)] text-sm">🔧 Maintenance & Service Schedule</h2>
            <button onClick={() => setActiveModal('maintenance')} className="btn-primary text-xs bg-indigo-700 hover:bg-indigo-800">+ Schedule Maintenance</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                <tr>
                  <th className="p-3">Asset</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Scheduled Date</th>
                  <th className="p-3">Technician</th>
                  <th className="p-3">Cost</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
                {maintenanceSchedule.map((m) => {
                  const isOverdue = new Date(m.scheduledDate) < new Date() && m.status === 'SCHEDULED';
                  return (
                    <tr key={m.id} className={`hover:bg-[var(--primary-surface)] ${isOverdue ? 'bg-red-50' : ''}`}>
                      <td className="p-3 font-bold text-[var(--primary)]">{m.asset}</td>
                      <td className="p-3 font-semibold">{m.type}</td>
                      <td className={`p-3 ${isOverdue ? 'text-red-700 font-bold' : ''}`}>{m.scheduledDate}</td>
                      <td className="p-3">{m.technician}</td>
                      <td className="p-3 font-mono">₦{m.cost.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                          {isOverdue ? 'OVERDUE' : m.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {m.status === 'SCHEDULED' && (
                          <button onClick={() => {
                            setMaintenanceCompleteData({ id: m.id, actualDate: new Date().toISOString().split('T')[0], partsReplaced: '', findings: '', nextServiceDue: '' });
                            setActiveModal('maintenance_complete');
                          }} className="btn-secondary text-xs px-2 py-1">Mark Complete</button>
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
      {/* Add Consumable Modal */}
      {activeModal === 'stock' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Add Stock Consumable</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleStockSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Item Name *</label>
                <input type="text" required value={formData.itemName} onChange={e => setFormData({ ...formData, itemName: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Category *</label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="Medical Consumables">Medical Consumables</option>
                  <option value="Screening Kits">Screening Kits</option>
                  <option value="Reagents">Reagents</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Quantity *</label>
                  <input type="number" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Unit *</label>
                  <input type="text" required value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Reorder Limit *</label>
                  <input type="number" required value={formData.minThreshold} onChange={e => setFormData({ ...formData, minThreshold: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">{submitting ? 'Saving...' : 'Add Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {activeModal === 'asset' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">+ Register Asset</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleAssetSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Asset Name *</label>
                  <input type="text" required value={assetForm.assetName} onChange={e => setAssetForm({ ...assetForm, assetName: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Asset Tag / Barcode *</label>
                  <input type="text" required value={assetForm.assetTag} onChange={e => setAssetForm({ ...assetForm, assetTag: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" placeholder="TAG-GC-EQUIP-004" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Category *</label>
                  <select value={assetForm.category} onChange={e => setAssetForm({ ...assetForm, category: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                    <option value="MEDICAL_EQUIPMENT">MEDICAL_EQUIPMENT</option>
                    <option value="LAB_EQUIPMENT">LAB_EQUIPMENT</option>
                    <option value="VEHICLE">VEHICLE</option>
                    <option value="FURNITURE">FURNITURE</option>
                    <option value="IT_HARDWARE">IT_HARDWARE</option>
                    <option value="GENERATOR">GENERATOR</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Serial Number</label>
                  <input type="text" value={assetForm.serialNumber} onChange={e => setAssetForm({ ...assetForm, serialNumber: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Acquisition Date</label>
                  <input type="date" value={assetForm.acquisitionDate} onChange={e => setAssetForm({ ...assetForm, acquisitionDate: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Purchase Cost (₦)</label>
                  <input type="number" value={assetForm.purchaseCost} onChange={e => setAssetForm({ ...assetForm, purchaseCost: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Condition</label>
                  <select value={assetForm.condition} onChange={e => setAssetForm({ ...assetForm, condition: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                    <option value="EXCELLENT">EXCELLENT</option>
                    <option value="GOOD">GOOD</option>
                    <option value="FAIR">FAIR</option>
                    <option value="POOR">POOR</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Current Location</label>
                  <input type="text" value={assetForm.currentLocation} onChange={e => setAssetForm({ ...assetForm, currentLocation: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Assigned To</label>
                  <input type="text" value={assetForm.assignedTo} onChange={e => setAssetForm({ ...assetForm, assignedTo: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">{submitting ? 'Registering...' : 'Register Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Movement Modal */}
      {activeModal === 'issue' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">+ Record Movement</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleMovementSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Movement Type *</label>
                  <select value={movementForm.type} onChange={e => setMovementForm({ ...movementForm, type: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                    <option value="STOCK_RECEIPT">STOCK_RECEIPT</option>
                    <option value="STOCK_ISSUE">STOCK_ISSUE</option>
                    <option value="TRANSFER">TRANSFER</option>
                    <option value="ADJUSTMENT">ADJUSTMENT</option>
                    <option value="DISPOSAL">DISPOSAL</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Item *</label>
                  <select required value={movementForm.itemId} onChange={e => setMovementForm({ ...movementForm, itemId: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                    <option value="">-- Select Item --</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.itemName || i.name} ({i.quantity} in stock)</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Quantity *</label>
                  <input type="number" required value={movementForm.qty} onChange={e => setMovementForm({ ...movementForm, qty: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Date *</label>
                  <input type="date" required value={movementForm.date} onChange={e => setMovementForm({ ...movementForm, date: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">From Location *</label>
                  <input type="text" required value={movementForm.from} onChange={e => setMovementForm({ ...movementForm, from: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">To Location / Issued To *</label>
                  <input type="text" required value={movementForm.to} onChange={e => setMovementForm({ ...movementForm, to: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Reference No.</label>
                  <input type="text" value={movementForm.ref} onChange={e => setMovementForm({ ...movementForm, ref: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Authorized By *</label>
                  <input type="text" required value={movementForm.authorized} onChange={e => setMovementForm({ ...movementForm, authorized: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Purpose / Remarks</label>
                  <input type="text" value={movementForm.remarks} onChange={e => setMovementForm({ ...movementForm, remarks: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">{submitting ? 'Recording...' : 'Record Movement'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raise Reorder Modal */}
      {activeModal === 'reorder' && reorderItem && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Raise Reorder Requisition</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleReorderSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Item</label>
                <input type="text" readOnly value={reorderItem.itemName || reorderItem.name} className="w-full bg-gray-100 border border-[var(--outline)] rounded px-3 py-2 text-xs text-gray-600" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Recommended Reorder Qty *</label>
                <input type="number" required value={reorderForm.reorderQty} onChange={e => setReorderForm({ ...reorderForm, reorderQty: parseInt(e.target.value) })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Preferred Vendor</label>
                <input type="text" value={reorderForm.vendor} onChange={e => setReorderForm({ ...reorderForm, vendor: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Urgency *</label>
                <select value={reorderForm.urgency} onChange={e => setReorderForm({ ...reorderForm, urgency: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="URGENT">URGENT</option>
                  <option value="STANDARD">STANDARD</option>
                  <option value="PLANNED">PLANNED</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit Requisition'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Maintenance Modal */}
      {activeModal === 'maintenance' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">+ Schedule Maintenance</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleMaintenanceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Asset *</label>
                <input type="text" required value={maintenanceForm.asset} onChange={e => setMaintenanceForm({ ...maintenanceForm, asset: e.target.value })} placeholder="Asset Name/Tag" className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Maintenance Type *</label>
                <select value={maintenanceForm.type} onChange={e => setMaintenanceForm({ ...maintenanceForm, type: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="PREVENTIVE">PREVENTIVE</option>
                  <option value="CORRECTIVE">CORRECTIVE</option>
                  <option value="CALIBRATION">CALIBRATION</option>
                  <option value="INSPECTION">INSPECTION</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Scheduled Date *</label>
                <input type="date" required value={maintenanceForm.scheduledDate} onChange={e => setMaintenanceForm({ ...maintenanceForm, scheduledDate: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Assigned Technician *</label>
                <input type="text" required value={maintenanceForm.technician} onChange={e => setMaintenanceForm({ ...maintenanceForm, technician: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Estimated Cost (₦)</label>
                <input type="number" value={maintenanceForm.cost} onChange={e => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs tabular-nums" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Description</label>
                <textarea rows={3} value={maintenanceForm.description} onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Maintenance Complete Modal */}
      {activeModal === 'maintenance_complete' && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Mark Maintenance Complete</h2>
              <button onClick={() => setActiveModal(null)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleMaintenanceComplete} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Actual Date *</label>
                <input type="date" required value={maintenanceCompleteData.actualDate} onChange={e => setMaintenanceCompleteData({ ...maintenanceCompleteData, actualDate: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Parts Replaced</label>
                <textarea rows={2} value={maintenanceCompleteData.partsReplaced} onChange={e => setMaintenanceCompleteData({ ...maintenanceCompleteData, partsReplaced: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Findings / Notes</label>
                <input type="text" value={maintenanceCompleteData.findings} onChange={e => setMaintenanceCompleteData({ ...maintenanceCompleteData, findings: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Next Service Due (Optional)</label>
                <input type="date" value={maintenanceCompleteData.nextServiceDue} onChange={e => setMaintenanceCompleteData({ ...maintenanceCompleteData, nextServiceDue: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs bg-green-700 hover:bg-green-800">Complete Maintenance</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
