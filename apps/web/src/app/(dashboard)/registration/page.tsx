'use client';

import { errorMessage } from '@/lib/errors';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { MARK_SRC } from '@/lib/deployment';
import { isRetryable } from '@/lib/offlineQueue';
import { useOfflineRegistrations } from '@/lib/useOfflineRegistrations';
import { useAuthStore } from '@/store/authStore';
import { PLATEAU_LGAS } from '@/lib/clinicalVocabulary';
import { PatientQrPass } from '@/components/PatientQrPass';

/** The blank intake form, so a completed or queued capture can be cleared. */
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

export default function RegistrationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(emptyForm);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  /**
 * The confirmation card shown after a successful registration. Not a
 * Participant: it also carries the identity-pass id and the date of birth as
 * typed, which the response does not echo back.
 */
type RegistrationConfirmation = {
  id: string;
  registrationId: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  lga: string;
  ward: string;
  address: string;
  gps: string;
  createdAt: string;
};

  const [registeredPatient, setRegisteredPatient] =
    useState<RegistrationConfirmation | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [queuedNotice, setQueuedNotice] = useState('');

  /**
   * The same offline queue the volunteer workspace uses, and the same replay.
   *
   * This form is "Field intake & consent" in the volunteer section of the
   * sidebar — the same patients, on the same phones, in the same LGAs. It had
   * no queue: a registration that could not be sent was refused with "check
   * your connection and try again", which on a device with no signal means the
   * volunteer stands still or loses the capture.
   */
  const user = useAuthStore((state) => state.user);
  const {
    hold,
    sync: syncQueue,
    syncing,
    hasPending,
    queue,
  } = useOfflineRegistrations({ id: user?.id ?? '' , firstName: user?.firstName, lastName: user?.lastName, email: user?.email });

  /**
   * Identifies one capture across every attempt to send it, so that retrying a
   * submission whose response was lost returns the record the first attempt
   * created instead of registering the patient twice. Held until the
   * registration is saved, then dropped so the next patient starts a new one.
   */
  const captureKey = useRef<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  /**
   * A failed fix leaves the field empty and says why. It used to fill in the
   * Barkin Ladi base coordinates instead, so declining the permission prompt
   * produced a registration stamped with a location it was never taken at —
   * indistinguishable downstream from a real one. The column is nullable, so no
   * location is a supported record rather than a blocked one.
   */
  const handleCaptureGps = () => {
    if (!('geolocation' in navigator)) {
      setFormData(prev => ({ ...prev, gpsCoordinates: '' }));
      setGpsError('This device offers no location service. The registration can be saved without one.');
      return;
    }

    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude.toFixed(4)}° N, ${position.coords.longitude.toFixed(4)}° E`;
        setFormData(prev => ({ ...prev, gpsCoordinates: coords }));
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
        setFormData(prev => ({ ...prev, gpsCoordinates: '' }));
        setGpsError(`${reason} You can save the registration without coordinates, or retry.`);
        setGpsLoading(false);
      },
      // Without a timeout the request can hang indefinitely, which left the
      // button reading "Capturing GPS Satellite Signal..." forever.
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.lga) {
      setError('Local Government Area (LGA) is mandatory for patient intake.');
      return;
    }

    if (!formData.consentGiven) {
      setError('Patient informed consent must be confirmed before proceeding.');
      return;
    }

    setLoading(true);
    setQueuedNotice('');

    if (!captureKey.current) captureKey.current = crypto.randomUUID();

    // The registration ID comes back from the server. LGA, ward and GPS are
    // sent as their own fields rather than concatenated into `address`.
    const payload = {
      idempotencyKey: captureKey.current,
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      phoneNumber: formData.phoneNumber,
      address: formData.address,
      lga: formData.lga,
      ward: formData.ward,
      gpsCoordinates: formData.gpsCoordinates,
      consentGiven: formData.consentGiven,
    };

    try {
      const res = await api.post('/participants', payload);

      setRegisteredPatient({
        id: res.data.id,
        registrationId: res.data.registrationId,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        gender: res.data.gender,
        dob: formData.dateOfBirth,
        lga: res.data.lga || formData.lga,
        ward: res.data.ward || '',
        address: res.data.address || '',
        gps: res.data.gpsCoordinates || '',
        createdAt: new Date().toLocaleDateString(),
      });
      // Saved, so the next patient is a new capture.
      captureKey.current = null;
    } catch (err) {
      // This previously rendered the success screen and a QR identity pass when
      // the request failed, so a field worker got a confirmation for a patient
      // that was never saved.
      if (isRetryable(err)) {
        // Held on the device rather than refused, so the next patient can be
        // seen. No identity pass: the pass carries a registration id and only
        // the server issues one, so until this syncs the patient is not
        // registered and the notice says exactly that.
        const held = await hold(payload);
        setFormData(emptyForm);
        // The queued payload carries the key, so the replay is the same capture
        // rather than a new one.
        captureKey.current = null;
        setQueuedNotice(
          `No connection, so this registration is held on this device — ${held.count} now waiting. ` +
            'The patient is not registered until it syncs, and no identity pass can be issued before then.' +
            (held.persistent
              ? ''
              : ' This device cannot store it safely, so it will be lost if you reload — sync before closing.'),
        );
      } else {
        // The server understood the request and refused it. Holding onto it
        // would only mean failing again later.
        const message = errorMessage(err, 'Registration failed.');
        setError(
          `${message} — the patient was NOT registered. Your entries have been kept; correct them and try again.`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--outline)] pb-5">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Field Volunteer Mobile Portal • GCOMS
          </span>
          <h1 className="text-2xl font-bold mt-1 text-[var(--on-background)]">Field Patient Intake & Patient Consent</h1>
          <p className="text-[var(--muted)] text-xs mt-0.5">Capture participant demographics, mandatory LGA, Ward, GPS location, patient consent, and auto-generate QR identity pass.</p>
        </div>
        <button onClick={() => router.push('/patients')} className="btn-secondary text-xs mt-3 md:mt-0 bg-white/10 hover:bg-white/20 text-[var(--on-background)]">
          ← View Patient Directory
        </button>
      </div>

      {/* QR IDENTITY PASS SUCCESS MODAL */}
      {registeredPatient && (
        <div className="fixed inset-0 bg-[var(--nav-surface)]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-2xl border border-[var(--outline)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--outline)] pb-3">
              <span className="badge-low-risk text-xs">REGISTRATION COMPLETE</span>
              <button onClick={() => setRegisteredPatient(null)} className="text-[var(--muted)] font-bold text-lg">✕</button>
            </div>

            {/* DIGITAL QR IDENTITY PASS CARD */}
            <div className="p-6 bg-gradient-to-br from-[var(--nav-surface)] to-[var(--nav-surface)] text-white rounded-xl border-2 border-[var(--secondary)] shadow-lg space-y-4">
              <div className="flex justify-between items-start border-b border-[var(--nav-surface-raised)] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded flex items-center justify-center p-1">
                    <Image src={MARK_SRC} alt="Logo" width={32} height={32} className="h-8 object-contain" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base tracking-wide text-white">GCOMS PATIENT IDENTITY PASS</h3>
                    <p className="text-[10px] text-[var(--secondary-container)]">Georgel Cancer Foundation Clinical Trust</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-[var(--secondary)] px-2 py-0.5 rounded text-white font-bold">{registeredPatient.registrationId}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[var(--secondary-container)] text-[10px] uppercase font-semibold">Patient Name</p>
                  <p className="font-bold text-white text-sm">{registeredPatient.firstName} {registeredPatient.lastName}</p>
                </div>
                <div>
                  <p className="text-[var(--secondary-container)] text-[10px] uppercase font-semibold">Mandatory LGA</p>
                  <p className="font-bold text-white text-sm">{registeredPatient.lga}</p>
                </div>
                <div>
                  <p className="text-[var(--secondary-container)] text-[10px] uppercase font-semibold">Ward & Address</p>
                  <p className="text-white text-xs">{[registeredPatient.ward, registeredPatient.address].filter(Boolean).join(' • ') || 'Not recorded'}</p>
                </div>
                <div>
                  <p className="text-[var(--secondary-container)] text-[10px] uppercase font-semibold">GPS Coordinates</p>
                  <p className="text-white font-mono text-xs">{registeredPatient.gps || 'Not captured'}</p>
                </div>
              </div>

              {/* The code encodes the registration id, which is what every
                  clinical record is keyed by. It used to be a decorative SVG
                  icon — the same picture for every patient, encoding nothing,
                  captioned "Scan for Clinical Record". */}
              <div className="pt-2 border-t border-[var(--nav-surface-raised)] flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-300 font-semibold">PASS ID: <span className="font-mono text-white">{registeredPatient.registrationId}</span></p>
                  <p className="text-[9px] text-[var(--secondary-container)]">Informed Consent Verified • Scan for Clinical Record</p>
                </div>
                <PatientQrPass registrationId={registeredPatient.registrationId} size={72} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="btn-secondary text-xs"
              >
                Print QR Pass
              </button>
              <button
                onClick={() => {
                  setRegisteredPatient(null);
                  setFormData({
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
                }}
                className="btn-primary text-xs bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]"
              >
                + Register Next Participant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM CARD */}
      <div className="clinical-card space-y-6">
        {error && (
          <div className="bg-[var(--risk-high-bg)] border border-[var(--risk-high-text)]/20 text-[var(--risk-high-text)] p-3.5 rounded text-xs font-semibold">
            {error}
          </div>
        )}

        {/*
          * A warning, not a confirmation. The record is on the phone and the
          * patient is not registered, which is the opposite of what a green
          * "saved" notice would say.
          */}
        {queuedNotice && (
          <div
            role="status"
            className="bg-[var(--risk-mod-bg)] border border-[var(--risk-mod-text)]/20 text-[var(--risk-mod-text)] p-3.5 rounded text-xs font-semibold"
          >
            {queuedNotice}
          </div>
        )}

        {/*
          * Held captures replay by themselves when the connection returns, so
          * this is for the case the browser never fires an `online` event —
          * signal that comes back without a transition the page can see.
          */}
        {hasPending && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-subtle)] border border-[var(--outline)] p-3 rounded text-xs">
            <span className="text-[var(--on-surface-variant)]">
              {queue.length === 1
                ? '1 registration is waiting on this device.'
                : `${queue.length} registrations are waiting on this device.`}
            </span>
            <button
              type="button"
              onClick={() => { void syncQueue(); }}
              disabled={syncing}
              className="btn-primary text-xs disabled:opacity-50"
            >
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Section 1: Demographics */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--secondary)] border-b border-[var(--outline)] pb-2 mb-4">
              1. Participant Identity & Demographics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)]"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)]"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)] tabular-nums"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)]"
                  required
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contact, Mandatory LGA, Ward & Address */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--secondary)] border-b border-[var(--outline)] pb-2 mb-4">
              2. Geographic Location, Ward & Address Data
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* MANDATORY LGA DROPDOWN */}
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">LGA *</label>
                <select
                  name="lga"
                  value={formData.lga}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-[var(--secondary)] rounded focus:border-[var(--primary)] outline-none font-bold text-[var(--primary)]"
                  required
                >
                  <option value="">-- Select LGA (Mandatory) --</option>
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
                  name="ward"
                  value={formData.ward}
                  onChange={handleChange}
                  placeholder="e.g. Gwol Ward / Tudun Wada Ward"
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)]"
                />
              </div>

              {/* RESIDENTIAL STREET ADDRESS */}
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Residential Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="House No 14, Main Street, LGA"
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+2348031234567"
                  className="w-full px-3.5 py-2.5 bg-white border border-[var(--outline)] rounded focus:border-[var(--secondary)] outline-none text-[var(--on-background)] tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Section 3: GPS Geolocation */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--secondary)] border-b border-[var(--outline)] pb-2 mb-4">
              3. Live Field GPS Geolocation Capture
            </h2>
            <div className="flex items-center gap-3 bg-[var(--background)] p-4 rounded border border-[var(--outline)]">
              <button
                type="button"
                onClick={handleCaptureGps}
                disabled={gpsLoading}
                className="btn-primary text-xs bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]"
              >
                {gpsLoading ? 'Capturing GPS Satellite Signal...' : 'Capture Live Field GPS Coordinates'}
              </button>
              <input
                type="text"
                readOnly
                name="gpsCoordinates"
                value={formData.gpsCoordinates || (gpsError ? 'Not captured' : 'Click button to capture GPS location')}
                className="flex-1 bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs font-mono text-[var(--on-background)]"
              />
            </div>
            {gpsError && (
              <p role="status" className="text-xs text-[var(--risk-high-text)] font-semibold">{gpsError}</p>
            )}
          </div>

          {/* Section 4: Patient Consent Box */}
          <div className="p-4 bg-[var(--background)] border border-[var(--outline)] rounded flex items-start gap-3">
            <input
              type="checkbox"
              name="consentGiven"
              id="consentGiven"
              checked={formData.consentGiven}
              onChange={handleChange}
              className="w-5 h-5 text-[var(--secondary)] rounded mt-0.5 cursor-pointer"
              required
            />
            <label htmlFor="consentGiven" className="text-xs text-[var(--on-background)] leading-relaxed cursor-pointer">
              <span className="font-bold block text-[var(--primary)]">Patient Informed Consent Confirmation *</span>
              &quot;I confirm that informed consent has been obtained from the participant for cervical cancer screening, VIA evaluation, follow-up communication, and secure digital records processing under GCOMS Clinical Trust.&quot;
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/patients')}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs disabled:opacity-50 bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]"
            >
              {loading ? 'Submitting Intake...' : 'Submit & Generate QR Identity Pass'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
