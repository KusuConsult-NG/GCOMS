'use client';

import { api } from '@/lib/api';
import React, { useState, useEffect } from 'react';

const PLATEAU_LGAS = [
  'Barkin Ladi LGA',
  'Bassa LGA',
  'Bokkos LGA',
  'Jos East LGA',
  'Jos North LGA',
  'Jos South LGA',
  'Kanam LGA',
  'Kanke LGA',
  'Langtang North LGA',
  'Langtang South LGA',
  'Mangu LGA',
  'Mikang LGA',
  'Pankshin LGA',
  'Quan\'Pan LGA',
  'Riyom LGA',
  'Shendam LGA',
  'Wase LGA',
];

export default function VolunteersPage() {
  // Volunteer rosters live in VolunteerProfile. This page made no API calls at
  // all — every name on it was invented.
  const [volunteers, setVolunteers] = useState<any[]>([]);

  useEffect(() => {
    api.get('/operations/volunteers')
      .then(res => setVolunteers(res.data.map((v: any) => ({
        id: v.id,
        firstName: v.user?.firstName ?? '',
        lastName: v.user?.lastName ?? '',
        email: v.user?.email ?? '',
        phone: '',
        lga: v.lga,
        ward: v.ward ?? '',
        address: v.address ?? '',
        status: v.status,
      }))))
      .catch(err => console.error('Failed to fetch volunteers', err));
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    lga: 'Barkin Ladi LGA',
    ward: '',
    address: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lga) {
      alert('Local Government Area (LGA) is mandatory!');
      return;
    }
    setVolunteers([
      {
        id: Date.now(),
        ...formData,
        status: 'Active',
      },
      ...volunteers,
    ]);
    setShowModal(false);
    setFormData({ firstName: '', lastName: '', email: '', phone: '', lga: 'Barkin Ladi LGA', ward: '', address: '' });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[var(--primary)] text-white p-5 rounded-lg border border-[var(--primary-container)]">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--secondary)] text-white uppercase tracking-wider">
            Field Volunteer & CHW Data Collection
          </span>
          <h1 className="text-2xl font-bold mt-1 text-white">Volunteer Operations & LGA Registry</h1>
          <p className="text-slate-300 text-xs mt-0.5">Mandatory LGA, Ward, and Address registration for field health workers.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs mt-3 md:mt-0 bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]">
          + Register New Field Volunteer
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[var(--primary)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <h2 className="text-base font-bold text-[var(--primary)]">Field Volunteer Data Collection</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--muted)] font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="e.g. Grace"
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="e.g. Gyang"
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* MANDATORY LGA SELECTION */}
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">LGA *</label>
                <select
                  required
                  value={formData.lga}
                  onChange={e => setFormData({ ...formData, lga: e.target.value })}
                  className="w-full bg-white border-2 border-[var(--secondary)] rounded px-3 py-2 text-xs font-bold text-[var(--primary)]"
                >
                  <option value="">-- Select LGA (Required) --</option>
                  {PLATEAU_LGAS.map((lga, idx) => (
                    <option key={idx} value={lga}>{lga}</option>
                  ))}
                </select>
              </div>

              {/* WARD */}
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Ward Name</label>
                <input
                  type="text"
                  value={formData.ward}
                  onChange={e => setFormData({ ...formData, ward: e.target.value })}
                  placeholder="e.g. Gwol Ward"
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                />
              </div>

              {/* ADDRESS */}
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Residential Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. House No 14, Main Street"
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08030000000"
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="volunteer@gcoms.org"
                    className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]">
                  Save Volunteer Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
        <div className="p-4 border-b border-[var(--outline)] font-bold text-[var(--primary)] text-sm bg-[var(--background)]">
          🩺 Registered Volunteers with Mandatory LGA & Location Identifiers
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
            <tr>
              <th className="p-3">Volunteer Name</th>
              <th className="p-3">Mandatory LGA</th>
              <th className="p-3">Ward</th>
              <th className="p-3">Residential Address</th>
              <th className="p-3">Contact Phone</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
            {volunteers.map((v) => (
              <tr key={v.id} className="hover:bg-[var(--primary-surface)]">
                <td className="p-3 font-bold text-[var(--primary)]">{v.firstName} {v.lastName}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-[var(--secondary)] text-white text-[10px] font-bold">
                    {v.lga}
                  </span>
                </td>
                <td className="p-3 font-semibold text-[var(--on-background)]">{v.ward || '—'}</td>
                <td className="p-3 text-[var(--on-surface-variant)]">{v.address || '—'}</td>
                <td className="p-3 font-mono text-[var(--muted)]">{v.phone}</td>
                <td className="p-3"><span className="badge-low-risk">{v.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
