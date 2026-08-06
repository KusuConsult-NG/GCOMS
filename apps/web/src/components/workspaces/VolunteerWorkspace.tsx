'use client';

import { errorMessage } from '@/lib/errors';
import {
  enqueue,
  isRetryable,
  isStale,
  markRejected,
  readQueue,
  removeFromQueue,
  type QueuedRegistration,
} from '@/lib/offlineQueue';
import type { OutreachEvent, SessionUser } from '@/types/api';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useToday } from '@/lib/useToday';

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

export function VolunteerWorkspace({ user }: { user: SessionUser }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'register' | 'outreach' | 'queue'>('dashboard');
  const [outreaches, setOutreaches] = useState<OutreachEvent[]>([]);
  // Registrations captured while offline, replayed when the connection returns.
  const [offlineQueue, setOfflineQueue] = useState<QueuedRegistration[]>([]);
  // False when the device cannot encrypt, in which case the queue lives only as
  // long as the tab does. The volunteer is told rather than finding out.
  const [queuePersistent, setQueuePersistent] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState('');
  const [lastSync, setLastSync] = useState('');
  const today = useToday();
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

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

/**
 * The confirmation card after a field registration. Not a Participant: it also
 * holds the identity-pass id and the GPS fix taken at intake.
 */
type RegistrationConfirmation = {
  id: string;
  regId: string;
  name: string;
  lga: string;
  ward: string;
  address: string;
  gps: string;
  qrPassId: string;
};

  const [regSuccess, setRegSuccess] =
    useState<RegistrationConfirmation | null>(null);
  const [regError, setRegError] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [queuedNotice, setQueuedNotice] = useState('');

  useEffect(() => {
    api.get('/outreach')
      .then(res => setOutreaches(res.data))
      .catch(console.error);
  }, []);

  /**
   * A failed fix leaves the field empty and says why.
   *
   * It used to substitute the Barkin Ladi base coordinates — so a volunteer who
   * declined the permission prompt, or stood somewhere without a signal, filed a
   * registration stamped with a location it was never taken at. Nothing
   * downstream could tell that apart from a real fix, because it is not marked
   * as anything: it is a plausible coordinate pair in the right state.
   *
   * The column is nullable and the API maps an empty string to null, so an
   * intake with no location is a supported record rather than a blocked one.
   */
  const handleCaptureGps = () => {
    if (!('geolocation' in navigator)) {
      setRegForm(prev => ({ ...prev, gpsCoordinates: '' }));
      setGpsError('This device offers no location service. The registration can be saved without one.');
      return;
    }

    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude.toFixed(4)}° N, ${position.coords.longitude.toFixed(4)}° E`;
        setRegForm(prev => ({ ...prev, gpsCoordinates: coords }));
        setGpsError('');
        setGpsLoading(false);
      },
      (error) => {
        const reason =
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was declined.'
            : error.code === error.TIMEOUT
              ? 'Timed out before a fix was found.'
              : 'No location fix available here.';
        setRegForm(prev => ({ ...prev, gpsCoordinates: '' }));
        setGpsError(`${reason} You can save the registration without coordinates, or retry.`);
        setGpsLoading(false);
      },
      // Without a timeout the request can hang indefinitely, which left the
      // button reading "Capturing GPS..." forever on a device with no fix.
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  // Re-entrancy is tracked in a ref rather than the state flag so that
  // syncQueue keeps a stable identity; the effects below depend on it, and a
  // function that changed every time `syncing` did would re-run them mid-sync.
  const syncingRef = useRef(false);

  /**
   * Identifies one capture across every attempt to send it.
   *
   * Generated when a registration is first submitted and held until that
   * registration is saved, so a retry — from the queue or by hand — carries the
   * key the first attempt used. The API returns the record it already created
   * for that key instead of registering the patient twice.
   */
  const captureKey = useRef<string | null>(null);

  /**
   * Replays the queue oldest first.
   *
   * Stops at the first record that fails for a reason that would fail again —
   * no connection means the next one has no better chance, and continuing would
   * only spend the battery. A record the server rejects outright is kept and
   * flagged instead, so the volunteer can correct or discard it rather than
   * having it disappear.
   */
  const syncQueue = useCallback(async () => {
    if (syncingRef.current) return;
    let state = await readQueue();
    // Records captured by someone else on this shared device are left alone.
    // The server files a registration against whoever is signed in, so syncing
    // them here would put this account's name on another volunteer's work.
    const pending = state.items.filter(
      (item) => !item.rejectedReason && item.capturedById === user.id,
    );
    if (!pending.length) return;

    syncingRef.current = true;
    setSyncing(true);
    setSyncNote('');
    let sent = 0;

    for (const item of pending) {
      try {
        await api.post('/participants', item.payload);
        state = await removeFromQueue(item.localId);
        sent += 1;
      } catch (err) {
        if (isRetryable(err)) {
          setSyncNote(
            sent > 0
              ? `${sent} sent. The rest are still waiting for a connection.`
              : 'Still no connection to the server. The queue is untouched.',
          );
          break;
        }
        state = await markRejected(
          item.localId,
          errorMessage(err, 'The server rejected this record.'),
        );
      }
    }

    setOfflineQueue(state.items);
    setQueuePersistent(state.persistent);
    if (sent > 0) setLastSync(new Date().toLocaleTimeString());
    syncingRef.current = false;
    setSyncing(false);
  }, [user.id]);

  /**
   * Load what the device is holding, and send it if there is a connection.
   *
   * The `online` event alone is not enough: it only fires on a transition. A
   * volunteer who captures records with no signal, closes the app, and opens it
   * again somewhere with one gets no such transition, and the queue would sit
   * there until someone thought to press Sync.
   */
  useEffect(() => {
    void readQueue().then(({ items, persistent }) => {
      setOfflineQueue(items);
      setQueuePersistent(persistent);
      if (
        navigator.onLine &&
        items.some((item) => !item.rejectedReason && item.capturedById === user.id)
      ) {
        void syncQueue();
      }
    });
  }, [syncQueue, user.id]);

  // The browser tells us when the connection comes back; that is the moment to
  // try, rather than making the volunteer notice and press something.
  useEffect(() => {
    const onOnline = () => { void syncQueue(); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [syncQueue]);

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
    setQueuedNotice('');

    // The registration ID is assigned by the server. LGA, ward and GPS are
    // sent as their own fields — they used to be concatenated into `address`,
    // which meant the structured location never reached the database.
    if (!captureKey.current) captureKey.current = crypto.randomUUID();

    const payload = {
      idempotencyKey: captureKey.current,
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
    };

    const emptyForm = {
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
    };

    try {
      const res = await api.post('/participants', payload);

      const registrationId = res.data.registrationId;

      setRegSuccess({
        id: res.data.id,
        regId: registrationId,
        name: `${res.data.firstName} ${res.data.lastName}`,
        lga: res.data.lga || regForm.lga,
        ward: res.data.ward || '',
        address: res.data.address || '',
        gps: res.data.gpsCoordinates || '',
        qrPassId: `QR-${registrationId}`,
      });

      // Only clear the form once the registration is actually saved.
      setRegForm(emptyForm);
      captureKey.current = null;
    } catch (err) {
      // A registration that could not be sent is held on the device rather than
      // refused, so the volunteer can carry on to the next patient. No identity
      // pass is shown for it: the pass carries a registration id, and only the
      // server issues one. Until this syncs, the patient is not registered, and
      // the notice says so rather than implying a save.
      if (isRetryable(err)) {
        const state = await enqueue(payload, new Date().toISOString(), {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`.trim() || user.email,
        });
        setOfflineQueue(state.items);
        setQueuePersistent(state.persistent);
        setRegForm(emptyForm);
        // The queued payload carries the key, so the replay is the same capture
        // rather than a new one.
        captureKey.current = null;
        setQueuedNotice(
          `No connection, so this registration is held on this device — ${state.items.length} now waiting. ` +
          'The patient is not registered until it syncs, and no identity pass can be issued before then.' +
          (state.persistent
            ? ''
            : ' This device cannot store it safely, so it will be lost if you reload — sync before closing.'),
        );
      } else {
        // The server understood the request and refused it, so holding onto it
        // would only mean failing again later. This used to render the success
        // screen and a QR identity pass here, then wipe the form.
        const message = errorMessage(err, 'Registration could not be saved.');
        setRegError(
          `${message} — the patient was NOT registered. Your entries have been kept; correct them and try again.`,
        );
      }
    } finally {
      setRegSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--outline)] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mt-1 text-[var(--on-background)]">Field Patient Intake & Patient Consent</h1>
          <p className="text-[var(--muted)] text-xs mt-0.5">Welcome back, {user?.firstName || 'Volunteer'} {user?.lastName || ''} • Community Health Worker ID: {user?.id?.slice(0, 8) || 'VOL-001'}</p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-3 text-xs">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-[var(--secondary-container)]">Last Synchronization</p>
            <p className="font-mono font-semibold text-[var(--on-background)]">{lastSync || 'Never'}</p>
          </div>
          <button
            onClick={() => setLastSync(new Date().toLocaleTimeString())}
            className="px-3 py-2 bg-[var(--secondary)] hover:bg-[var(--secondary-hover)] text-[var(--on-background)] font-semibold rounded text-xs transition-colors"
          >
            Sync Data Now
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[var(--outline)] gap-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Field Dashboard' },
          { id: 'register', label: 'Field Patient Intake & QR Identity Pass' },
          { id: 'outreach', label: 'Assigned Outreach Drives' },
          { id: 'queue', label: `Offline Sync Queue (${offlineQueue.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Parameters<typeof setActiveTab>[0])}
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
              <h3 className="font-bold text-[var(--primary)] text-sm">Today&apos;s Active Outreach Campaign</h3>
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

          {queuedNotice && (
            <div role="status" className="bg-[var(--warning-bg,var(--background))] border border-[var(--outline)] text-[var(--on-background)] p-3 rounded text-xs font-semibold">
              {queuedNotice}
            </div>
          )}

          {/* QR IDENTITY PASS MODAL */}
          {regSuccess && (
            <div className="p-6 bg-gradient-to-br from-[var(--nav-surface)] to-[var(--nav-surface)] text-white rounded-xl border-2 border-[var(--secondary)] shadow-lg space-y-4">
              <div className="flex justify-between items-start border-b border-[var(--nav-surface-raised)] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded flex items-center justify-center p-1">
                    <Image src="/georgel-logo.png" alt="Logo" width={32} height={32} className="h-8 object-contain" />
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
                  <p className="text-white text-xs">{[regSuccess.ward, regSuccess.address].filter(Boolean).join(' • ') || 'Not recorded'}</p>
                </div>
                <div>
                  <p className="text-[var(--secondary-container)] text-[10px] uppercase font-semibold">GPS Coordinates</p>
                  <p className="text-white font-mono text-xs">{regSuccess.gps || 'Not captured'}</p>
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
                <button onClick={() => window.print()} className="btn-secondary text-xs">Print QR Pass</button>
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
              <h3 className="font-bold text-[var(--primary)]">Live Field GPS Location Capture</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCaptureGps}
                  disabled={gpsLoading}
                  className="btn-primary text-xs bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]"
                >
                  {gpsLoading ? 'Capturing GPS...' : 'Capture Live Field GPS Coordinates'}
                </button>
                <input
                  type="text"
                  readOnly
                  value={regForm.gpsCoordinates || (gpsError ? 'Not captured' : 'Click button to capture GPS location')}
                  className="flex-1 bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs font-mono text-[var(--on-background)]"
                />
              </div>
              {gpsError && (
                <p role="status" className="text-xs text-[var(--risk-high-text)] font-semibold">{gpsError}</p>
              )}
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[var(--primary)]">Local Offline Synchronization Queue</h2>
              <p className="text-xs text-[var(--on-surface-variant)]">
                Registrations captured while the server was unreachable, encrypted on this device
                until they sync. Encryption is not a substitute for a screen lock: the device still
                holds patient data.
              </p>
              {!queuePersistent && (
                <p role="status" className="text-xs font-semibold text-[var(--risk-high-text)] mt-1">
                  This device cannot encrypt stored data, so nothing here has been written to disk.
                  Reloading loses it — sync before closing this tab.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => { void syncQueue(); }}
              disabled={
                syncing ||
                !offlineQueue.some(
                  (item) => !item.rejectedReason && item.capturedById === user.id,
                )
              }
              className="btn-primary text-xs bg-[var(--secondary)] hover:bg-[var(--secondary-hover)] disabled:opacity-50"
            >
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
          </div>

          {syncNote && (
            <p role="status" className="text-xs font-semibold text-[var(--on-surface-variant)]">{syncNote}</p>
          )}

          {!offlineQueue.length && (
            <p className="text-xs text-[var(--on-surface-variant)] py-6 text-center">
              Nothing waiting. Every registration captured on this device has reached the server.
            </p>
          )}

          <div className="space-y-2">
            {offlineQueue.map((item) => (
              <div
                key={item.localId}
                className="border border-[var(--outline)] rounded p-3 flex flex-wrap items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-[var(--on-background)]">
                    {item.payload.firstName} {item.payload.lastName}
                  </p>
                  <p className="text-[11px] text-[var(--on-surface-variant)]">
                    {[item.payload.lga, item.payload.ward].filter(Boolean).join(' • ')}
                    {' — captured '}
                    {new Date(item.capturedAt).toLocaleString()}
                  </p>
                  {item.rejectedReason ? (
                    <p className="text-[11px] font-semibold text-[var(--risk-high-text)] mt-1">
                      Rejected by the server: {item.rejectedReason} This will not be retried.
                    </p>
                  ) : item.capturedById !== user.id ? (
                    <p className="text-[11px] font-semibold text-[var(--on-surface-variant)] mt-1">
                      Captured by {item.capturedByName}. Only they can sync it — the
                      server would otherwise record it as yours.
                    </p>
                  ) : today && isStale(item, today.getTime()) ? (
                    <p className="text-[11px] font-semibold text-[var(--risk-high-text)] mt-1">
                      Waiting over a day. Not registered yet, and patient details are
                      sitting on this device until it syncs.
                    </p>
                  ) : (
                    <p className="text-[11px] text-[var(--on-surface-variant)] mt-1">
                      Waiting to sync. Not registered yet.
                    </p>
                  )}
                </div>
                {item.capturedById === user.id && (
                  <button
                    type="button"
                    onClick={() => { void removeFromQueue(item.localId).then((s) => setOfflineQueue(s.items)); }}
                    className="btn-secondary text-[11px]"
                  >
                    Discard
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
