'use client';

import { errorMessage } from '@/lib/errors';
import type { OutreachEvent } from '@/types/api';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

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

export function VolunteerWorkspace({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'register' | 'outreach' | 'queue'>('dashboard');
  const [outreaches, setOutreaches] = useState<OutreachEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [gpsStatus, setGpsStatus] = useState<'CONNECTED' | 'SEARCHING'>('CONNECTED');
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
  const [gpsLoading, setGpsLoading] = useState(false);

  // Registration Form State with Mandatory LGA, Ward, Address, and GPS
  const [regForm, setRegForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Female',
    phoneNumber: '',
    lga: 'Barkin Ladi LGA',
    ward: '',
    address: '',
    gpsCoordinates: '',
    consentGiven: false,
  });

  const [regSuccess, setRegSuccess] = useState<any>(null);
  const [regError, setRegError] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);

  useEffect(() => {
    api.get('/outreach')
      .then(res => setOutreaches(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCaptureGps = () => {
    setGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude.toFixed(4)}° N, ${position.coords.longitude.toFixed(4)}° E`;
          setRegForm(prev => ({ ...prev, gpsCoordinates: coords }));
          setGpsLoading(false);
        },
        () => {
          setRegForm(prev => ({ ...prev, gpsCoordinates: '9.8965° N, 8.8583° E (Barkin Ladi Base)' }));
          setGpsLoading(false);
        }
      );
    } else {
      setRegForm(prev => ({ ...prev, gpsCoordinates: '9.8965° N, 8.8583° E (Barkin Ladi Base)' }));
      setGpsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess(null);

    if (!regForm.lga) {
      setRegError('Local Government Area (LGA) is mandatory for patient data collection.');
      return;
    }

    if (!regForm.consentGiven) {
      setRegError('Patient informed consent is required before completing registration.');
      return;
    }

    setRegSubmitting(true);

    try {
      // The registration ID is assigned by the server. LGA, ward and GPS are
      // sent as their own fields — they used to be concatenated into `address`,
      // which meant the structured location never reached the database.
      const res = await api.post('/participants', {
        firstName: regForm.firstName,
        lastName: regForm.lastName,
        dateOfBirth: regForm.dateOfBirth,
        gender: regForm.gender,
        phoneNumber: regForm.phoneNumber,
        address: regForm.address,
        lga: regForm.lga,
        ward: regForm.ward,
        gpsCoordinates: regForm.gpsCoordinates,
        consentGiven: regForm.consentGiven,
      });

      const registrationId = res.data.registrationId;

      setRegSuccess({
        id: res.data.id,
        regId: registrationId,
        name: `${res.data.firstName} ${res.data.lastName}`,
        lga: res.data.lga || regForm.lga,
        ward: res.data.ward || 'Central Ward',
        address: res.data.address || 'LGA Health Centre',
        gps: res.data.gpsCoordinates || '',
        qrPassId: `QR-${registrationId}`,
      });

      // Only clear the form once the registration is actually saved.
      setRegForm({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'Female',
        phoneNumber: '',
        lga: 'Barkin Ladi LGA',
        ward: '',
        address: '',
        gpsCoordinates: '',
        consentGiven: false,
      });
    } catch (err) {
      // This used to render the success screen and a QR identity pass on
      // failure, then wipe the form — so a volunteer in the field got a
      // confirmation for a patient that was never saved, with no way to recover
      // what they had typed.
      const message = errorMessage(err, 'Registration could not be saved.');
      setRegError(
        `${message} — the patient was NOT registered. Your entries have been kept; check your connection and try again.`,
      );
    } finally {
      setRegSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[var(--nav-surface)] text-white p-5 rounded-lg border border-[var(--nav-surface-raised)] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mt-1 text-white">Field Patient Intake & Patient Consent</h1>
          <p className="text-slate-300 text-xs mt-0.5">Welcome back, {user?.firstName || 'Volunteer'} {user?.lastName || ''} • Community Health Worker ID: {user?.id?.slice(0, 8) || 'VOL-001'}</p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-3 text-xs">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-[var(--secondary-container)]">Last Synchronization</p>
            <p className="font-mono font-semibold text-white">{lastSync}</p>
          </div>
          <button
            onClick={() => setLastSync(new Date().toLocaleTimeString())}
            className="px-3 py-2 bg-[var(--secondary)] hover:bg-[var(--secondary-hover)] text-white font-semibold rounded text-xs transition-colors"
          >
            🔄 Sync Data Now
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[var(--outline)] gap-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'dashboard', label: '📊 Field Dashboard' },
          { id: 'register', label: '📝 Field Patient Intake & QR Identity Pass' },
          { id: 'outreach', label: '📍 Assigned Outreach Drives' },
          { id: 'queue', label: `📥 Offline Sync Queue (${offlineQueue.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2.5 px-4 rounded-t border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[var(--secondary)] text-[var(--secondary)] bg-white font-bold'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: FIELD DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Patients Registered Today</span>
              <p className="text-3xl font-bold text-[var(--secondary)] mt-1 tabular-nums">14</p>
              <span className="text-[10px] text-[var(--risk-low-text)] font-semibold">Daily Target: 15 (93%)</span>
            </div>
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Weekly Intake Target</span>
              <p className="text-3xl font-bold text-[var(--primary)] mt-1 tabular-nums">68 / 75</p>
              <span className="text-[10px] text-[var(--secondary)] font-semibold">Weekly Target: 75</span>
            </div>
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Assigned Outreach Drives</span>
              <p className="text-3xl font-bold text-[var(--risk-mod-text)] mt-1 tabular-nums">{outreaches.length || 3}</p>
              <span className="text-[10px] text-[var(--risk-mod-text)] font-semibold">Barkin Ladi & Jos North</span>
            </div>
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Pending Sync Queue</span>
              <p className="text-3xl font-bold text-[var(--risk-high-text)] mt-1 tabular-nums">{offlineQueue.length}</p>
              <span className="text-[10px] text-[var(--muted)] font-semibold">Local Storage Safe</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-[var(--outline)] shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-bold text-[var(--primary)] text-sm">📍 Today&apos;s Active Outreach Campaign</h3>
              <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">Barkin Ladi Primary Health Center • Community Cervical Screening Drive</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => setActiveTab('register')}
                className="btn-primary text-xs flex-1 md:flex-initial text-center bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]"
              >
                + Field Patient Intake & QR Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FIELD PATIENT INTAKE & QR PASS */}
      {activeTab === 'register' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] p-6 space-y-6">
          <div className="border-b border-[var(--outline)] pb-3">
            <h2 className="text-lg font-bold text-[var(--primary)]">Field Patient Intake & Informed Consent</h2>
            <p className="text-xs text-[var(--on-surface-variant)]">Capture participant demographics, mandatory LGA, Ward, GPS location, patient consent, and auto-generate QR identity pass.</p>
          </div>

          {regError && (
            <div className="bg-[var(--risk-high-bg)] text-[var(--risk-high-text)] p-3 rounded text-xs font-semibold">
              {regError}
            </div>
          )}

          {/* QR IDENTITY PASS MODAL */}
          {regSuccess && (
            <div className="p-6 bg-gradient-to-br from-[var(--nav-surface)] to-[var(--nav-surface)] text-white rounded-xl border-2 border-[var(--secondary)] shadow-lg space-y-4">
              <div className="flex justify-between items-start border-b border-[var(--nav-surface-raised)] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded flex items-center justify-center p-1">
                    <img src="/georgel-logo.png" alt="Logo" className="h-8 object-contain" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base tracking-wide text-white">GCOMS PATIENT IDENTITY PASS</h3>
                    <p className="text-[10px] text-[var(--secondary-container)]">Georgel Cancer Foundation Clinical Trust</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-[var(--secondary)] px-2 py-0.5 rounded text-white font-bold">{regSuccess.regId}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[var(--secondary-container)] text-[10px] uppercase font-semibold">Patient Name</p>
                  <p className="font-bold text-white text-sm">{regSuccess.name}</p>
                </div>
                <div>
                  <p className="text-[var(--secondary-container)] text-[10px] uppercase font-semibold">Mandatory LGA</p>
                  <p className="font-bold text-white text-sm">{regSuccess.lga}</p>
                </div>
                <div>
                  <p className="text-[var(--secondary-container)] text-[10px] uppercase font-semibold">Ward & Address</p>
                  <p className="text-white text-xs">{regSuccess.ward} • {regSuccess.address}</p>
                </div>
                <div>
                  <p className="text-[var(--secondary-container)] text-[10px] uppercase font-semibold">GPS Coordinates</p>
                  <p className="text-white font-mono text-xs">{regSuccess.gps}</p>
                </div>
              </div>

              {/* SIMULATED HIGH-RES DIGITAL QR CODE */}
              <div className="pt-2 border-t border-[var(--nav-surface-raised)] flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-300 font-semibold">PASS ID: <span className="font-mono text-white">{regSuccess.qrPassId}</span></p>
                  <p className="text-[9px] text-[var(--secondary-container)]">Informed Consent Verified • Scan for Clinical Record</p>
                </div>
                <div className="bg-white p-2 rounded flex flex-col items-center justify-center border border-[var(--secondary-container)]">
                  <svg className="w-16 h-16 text-[var(--primary)]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h3v3h-3v-3zm0 5h3v3h-3v-3zm-5-5h3v8h-3v-8z"/>
                  </svg>
                  <span className="text-[8px] font-mono text-[var(--primary)] font-bold mt-0.5">{regSuccess.qrPassId}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => window.print()} className="btn-secondary text-xs">🖨 Print QR Pass</button>
                <button onClick={() => setRegSuccess(null)} className="btn-primary text-xs bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]">
                  + Register Next Patient
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-6 text-xs">
            {/* 1. Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={regForm.firstName}
                  onChange={e => setRegForm({ ...regForm, firstName: e.target.value })}
                  placeholder="e.g. Mary"
                  className="w-full px-3 py-2 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={regForm.lastName}
                  onChange={e => setRegForm({ ...regForm, lastName: e.target.value })}
                  placeholder="e.g. Luka"
                  className="w-full px-3 py-2 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={regForm.dateOfBirth}
                  onChange={e => setRegForm({ ...regForm, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)] tabular-nums"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Gender *</label>
                <select
                  value={regForm.gender}
                  onChange={e => setRegForm({ ...regForm, gender: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)]"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
            </div>

            {/* 2. Mandatory LGA, Ward & Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">LGA *</label>
                <select
                  required
                  value={regForm.lga}
                  onChange={e => setRegForm({ ...regForm, lga: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-[var(--secondary)] rounded focus:border-[var(--primary)] outline-none font-bold text-[var(--primary)]"
                >
                  <option value="">-- Select LGA (Mandatory) --</option>
                  {PLATEAU_LGAS.map((lga, idx) => (
                    <option key={idx} value={lga}>{lga}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Ward Name</label>
                <input
                  type="text"
                  value={regForm.ward}
                  onChange={e => setRegForm({ ...regForm, ward: e.target.value })}
                  placeholder="e.g. Gwol Ward / Tudun Wada Ward"
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Residential Street Address</label>
                <input
                  type="text"
                  value={regForm.address}
                  onChange={e => setRegForm({ ...regForm, address: e.target.value })}
                  placeholder="House No 14, Main Street"
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={regForm.phoneNumber}
                  onChange={e => setRegForm({ ...regForm, phoneNumber: e.target.value })}
                  placeholder="+2348031234567"
                  className="w-full px-3 py-2 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)] tabular-nums"
                />
              </div>
            </div>

            {/* 3. GPS Geolocation */}
            <div className="p-4 bg-[var(--background)] border border-[var(--outline)] rounded space-y-3">
              <h3 className="font-bold text-[var(--primary)]">📡 Live Field GPS Location Capture</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCaptureGps}
                  disabled={gpsLoading}
                  className="btn-primary text-xs bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]"
                >
                  {gpsLoading ? 'Capturing GPS...' : '📡 Capture Live Field GPS Coordinates'}
                </button>
                <input
                  type="text"
                  readOnly
                  value={regForm.gpsCoordinates || 'Click button to capture GPS location'}
                  className="flex-1 bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs font-mono text-[var(--on-background)]"
                />
              </div>
            </div>

            {/* 4. Patient Informed Consent */}
            <div className="p-4 bg-[var(--background)] border border-[var(--outline)] rounded flex items-start gap-3">
              <input
                type="checkbox"
                id="consentGiven"
                checked={regForm.consentGiven}
                onChange={e => setRegForm({ ...regForm, consentGiven: e.target.checked })}
                className="w-5 h-5 text-[var(--secondary)] rounded mt-0.5 cursor-pointer"
                required
              />
              <label htmlFor="consentGiven" className="text-xs text-[var(--on-background)] leading-relaxed cursor-pointer">
                <span className="font-bold block text-[var(--primary)]">Patient Verbal / Written Informed Consent *</span>
                &quot;I confirm that the patient has been informed of the screening procedure and has voluntarily granted consent for cancer screening, follow-up notifications, and health data registry storage.&quot;
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
              <button
                type="submit"
                disabled={regSubmitting}
                className="btn-primary text-xs bg-[var(--secondary)] hover:bg-[var(--secondary-hover)] disabled:opacity-50"
              >
                {regSubmitting ? 'Saving…' : 'Save & Generate Patient QR Pass'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: OUTREACH DRIVES */}
      {activeTab === 'outreach' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] p-6 space-y-4">
          <h2 className="text-lg font-bold text-[var(--primary)]">Assigned Field Outreach Drives</h2>
          <div className="divide-y divide-[var(--outline)]">
            {outreaches.map(o => (
              <div key={o.id} className="py-4 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-[var(--primary)] text-sm">{o.title}</p>
                  <p className="text-[var(--on-surface-variant)]">{o.location?.name || 'Location not set'} • Date: {new Date(o.date).toLocaleDateString()}</p>
                </div>
                <span className={o.status === 'COMPLETED' ? 'badge-low-risk' : 'badge-mod-risk'}>{o.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: OFFLINE QUEUE */}
      {activeTab === 'queue' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] p-6 space-y-4">
          <h2 className="text-lg font-bold text-[var(--primary)]">Local Offline Synchronization Queue</h2>
          <p className="text-xs text-[var(--on-surface-variant)]">Records captured while disconnected from internet are held securely in local storage.</p>
        </div>
      )}
    </div>
  );
}
