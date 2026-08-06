'use client';

import { errorMessage } from '@/lib/errors';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

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

export default function RegistrationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
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
  qrPassId: string;
  createdAt: string;
};

  const [registeredPatient, setRegisteredPatient] =
    useState<RegistrationConfirmation | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

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

    if (!captureKey.current) captureKey.current = crypto.randomUUID();

    try {
      // The registration ID comes back from the server. LGA, ward and GPS are
      // sent as their own fields rather than concatenated into `address`.
      const res = await api.post('/participants', {
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
      });

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
        qrPassId: `QR-${res.data.registrationId}`,
        createdAt: new Date().toLocaleDateString(),
      });
      // Saved, so the next patient is a new capture.
      captureKey.current = null;
    } catch (err) {
      // This previously rendered the success screen and a QR identity pass when
      // the request failed, so a field worker got a confirmation for a patient
      // that was never saved.
      const message = errorMessage(err, 'Registration failed.');
      setError(
        `${message} — the patient was NOT registered. Your entries have been kept; check your connection and try again.`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[var(--nav-surface)] text-white p-5 rounded-lg border border-[var(--nav-surface-raised)] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--secondary)] text-white uppercase tracking-wider">
            Field Volunteer Mobile Portal • GCOMS
          </span>
          <h1 className="text-2xl font-bold mt-1 text-white">Field Patient Intake & Patient Consent</h1>
          <p className="text-slate-300 text-xs mt-0.5">Capture participant demographics, mandatory LGA, Ward, GPS location, patient consent, and auto-generate QR identity pass.</p>
        </div>
        <button onClick={() => router.push('/patients')} className="btn-secondary text-xs mt-3 md:mt-0 bg-white/10 hover:bg-white/20 text-white">
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
                    <Image src="/georgel-logo.png" alt="Logo" width={32} height={32} className="h-8 object-contain" />
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

              {/* SIMULATED HIGH-RES DIGITAL QR CODE */}
              <div className="pt-2 border-t border-[var(--nav-surface-raised)] flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-300 font-semibold">PASS ID: <span className="font-mono text-white">{registeredPatient.qrPassId}</span></p>
                  <p className="text-[9px] text-[var(--secondary-container)]">Informed Consent Verified • Scan for Clinical Record</p>
                </div>
                <div className="bg-white p-2 rounded flex flex-col items-center justify-center border border-[var(--secondary-container)]">
                  <svg className="w-16 h-16 text-[var(--primary)]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h3v3h-3v-3zm0 5h3v3h-3v-3zm-5-5h3v8h-3v-8z"/>
                  </svg>
                  <span className="text-[8px] font-mono text-[var(--primary)] font-bold mt-0.5">{registeredPatient.qrPassId}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="btn-secondary text-xs"
              >
                🖨 Print QR Pass
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
                {gpsLoading ? 'Capturing GPS Satellite Signal...' : '📡 Capture Live Field GPS Coordinates'}
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
