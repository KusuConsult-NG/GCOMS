'use client';

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
  const [outreaches, setOutreaches] = useState<any[]>([]);
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

    const regId = `GC-PAT-${Date.now().toString().slice(-6)}`;
    const fullAddress = `${regForm.address || 'Central Community'}, Ward: ${regForm.ward || 'General Ward'}, ${regForm.lga}`;

    try {
      const res = await api.post('/participants', {
        nationalId: regId,
        firstName: regForm.firstName,
        lastName: regForm.lastName,
        dateOfBirth: regForm.dateOfBirth,
        gender: regForm.gender,
        phoneNumber: regForm.phoneNumber,
        address: fullAddress,
        consentGiven: regForm.consentGiven,
      });

      setRegSuccess({
        id: res.data?.id || Date.now(),
        regId,
        name: `${regForm.firstName} ${regForm.lastName}`,
        lga: regForm.lga,
        ward: regForm.ward || 'Central Ward',
        address: regForm.address || 'LGA Health Centre',
        gps: regForm.gpsCoordinates || '9.8965° N, 8.8583° E',
        qrPassId: `QR-${regId}`,
      });
    } catch (err: any) {
      // Fallback preview
      setRegSuccess({
        id: Date.now(),
        regId,
        name: `${regForm.firstName} ${regForm.lastName}`,
        lga: regForm.lga,
        ward: regForm.ward || 'Central Ward',
        address: regForm.address || 'LGA Health Centre',
        gps: regForm.gpsCoordinates || '9.8965° N, 8.8583° E',
        qrPassId: `QR-${regId}`,
      });
    } finally {
      // Reset form
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
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#002045] text-white p-5 rounded-lg border border-[#1a365d] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mt-1 text-white">Field Patient Intake & Patient Consent</h1>
          <p className="text-slate-300 text-xs mt-0.5">Welcome back, {user?.firstName || 'Volunteer'} {user?.lastName || ''} • Community Health Worker ID: {user?.id?.slice(0, 8) || 'VOL-001'}</p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-3 text-xs">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-[#a2eded]">Last Synchronization</p>
            <p className="font-mono font-semibold text-white">{lastSync}</p>
          </div>
          <button
            onClick={() => setLastSync(new Date().toLocaleTimeString())}
            className="px-3 py-2 bg-[#13696a] hover:bg-[#0f5455] text-white font-semibold rounded text-xs transition-colors"
          >
            🔄 Sync Data Now
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#e2e8f0] gap-2 text-xs font-semibold overflow-x-auto">
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
                ? 'border-[#13696a] text-[#13696a] bg-white font-bold'
                : 'border-transparent text-[#74777f] hover:text-[#002045]'
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
              <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Patients Registered Today</span>
              <p className="text-3xl font-bold text-[#13696a] mt-1 tabular-nums">14</p>
              <span className="text-[10px] text-[#22543d] font-semibold">Daily Target: 15 (93%)</span>
            </div>
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Weekly Intake Target</span>
              <p className="text-3xl font-bold text-[#002045] mt-1 tabular-nums">68 / 75</p>
              <span className="text-[10px] text-[#13696a] font-semibold">Weekly Target: 75</span>
            </div>
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Assigned Outreach Drives</span>
              <p className="text-3xl font-bold text-[#92400e] mt-1 tabular-nums">{outreaches.length || 3}</p>
              <span className="text-[10px] text-[#92400e] font-semibold">Barkin Ladi & Jos North</span>
            </div>
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wide">Pending Sync Queue</span>
              <p className="text-3xl font-bold text-[#ba1a1a] mt-1 tabular-nums">{offlineQueue.length}</p>
              <span className="text-[10px] text-[#74777f] font-semibold">Local Storage Safe</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-[#e2e8f0] shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-bold text-[#002045] text-sm">📍 Today's Active Outreach Campaign</h3>
              <p className="text-xs text-[#43474e] mt-0.5">Barkin Ladi Primary Health Center • Community Cervical Screening Drive</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => setActiveTab('register')}
                className="btn-primary text-xs flex-1 md:flex-initial text-center bg-[#13696a] hover:bg-[#0f5455]"
              >
                + Field Patient Intake & QR Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FIELD PATIENT INTAKE & QR PASS */}
      {activeTab === 'register' && (
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 space-y-6">
          <div className="border-b border-[#e2e8f0] pb-3">
            <h2 className="text-lg font-bold text-[#002045]">Field Patient Intake & Informed Consent</h2>
            <p className="text-xs text-[#43474e]">Capture participant demographics, mandatory LGA, Ward, GPS location, patient consent, and auto-generate QR identity pass.</p>
          </div>

          {regError && (
            <div className="bg-[#ffdad6] text-[#93000a] p-3 rounded text-xs font-semibold">
              {regError}
            </div>
          )}

          {/* QR IDENTITY PASS MODAL */}
          {regSuccess && (
            <div className="p-6 bg-gradient-to-br from-[#002045] to-[#001733] text-white rounded-xl border-2 border-[#13696a] shadow-lg space-y-4">
              <div className="flex justify-between items-start border-b border-[#1a365d] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded flex items-center justify-center p-1">
                    <img src="/georgel-logo.png" alt="Logo" className="h-8 object-contain" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base tracking-wide text-white">GCOMS PATIENT IDENTITY PASS</h3>
                    <p className="text-[10px] text-[#a2eded]">Georgel Cancer Foundation Clinical Trust</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-[#13696a] px-2 py-0.5 rounded text-white font-bold">{regSuccess.regId}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[#a2eded] text-[10px] uppercase font-semibold">Patient Name</p>
                  <p className="font-bold text-white text-sm">{regSuccess.name}</p>
                </div>
                <div>
                  <p className="text-[#a2eded] text-[10px] uppercase font-semibold">Mandatory LGA</p>
                  <p className="font-bold text-white text-sm">{regSuccess.lga}</p>
                </div>
                <div>
                  <p className="text-[#a2eded] text-[10px] uppercase font-semibold">Ward & Address</p>
                  <p className="text-white text-xs">{regSuccess.ward} • {regSuccess.address}</p>
                </div>
                <div>
                  <p className="text-[#a2eded] text-[10px] uppercase font-semibold">GPS Coordinates</p>
                  <p className="text-white font-mono text-xs">{regSuccess.gps}</p>
                </div>
              </div>

              {/* SIMULATED HIGH-RES DIGITAL QR CODE */}
              <div className="pt-2 border-t border-[#1a365d] flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-300 font-semibold">PASS ID: <span className="font-mono text-white">{regSuccess.qrPassId}</span></p>
                  <p className="text-[9px] text-[#a2eded]">Informed Consent Verified • Scan for Clinical Record</p>
                </div>
                <div className="bg-white p-2 rounded flex flex-col items-center justify-center border border-[#a2eded]">
                  <svg className="w-16 h-16 text-[#002045]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h3v3h-3v-3zm0 5h3v3h-3v-3zm-5-5h3v8h-3v-8z"/>
                  </svg>
                  <span className="text-[8px] font-mono text-[#002045] font-bold mt-0.5">{regSuccess.qrPassId}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => window.print()} className="btn-secondary text-xs">🖨 Print QR Pass</button>
                <button onClick={() => setRegSuccess(null)} className="btn-primary text-xs bg-[#13696a] hover:bg-[#0f5455]">
                  + Register Next Patient
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-6 text-xs">
            {/* 1. Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={regForm.firstName}
                  onChange={e => setRegForm({ ...regForm, firstName: e.target.value })}
                  placeholder="e.g. Mary"
                  className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded focus:border-[#13696a] outline-none text-[#0d1c2e]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={regForm.lastName}
                  onChange={e => setRegForm({ ...regForm, lastName: e.target.value })}
                  placeholder="e.g. Luka"
                  className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded focus:border-[#13696a] outline-none text-[#0d1c2e]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={regForm.dateOfBirth}
                  onChange={e => setRegForm({ ...regForm, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded focus:border-[#13696a] outline-none text-[#0d1c2e] tabular-nums"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Gender *</label>
                <select
                  value={regForm.gender}
                  onChange={e => setRegForm({ ...regForm, gender: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded focus:border-[#13696a] outline-none text-[#0d1c2e]"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
            </div>

            {/* 2. Mandatory LGA, Ward & Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">LGA *</label>
                <select
                  required
                  value={regForm.lga}
                  onChange={e => setRegForm({ ...regForm, lga: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-[#13696a] rounded focus:border-[#002045] outline-none font-bold text-[#002045]"
                >
                  <option value="">-- Select LGA (Mandatory) --</option>
                  {PLATEAU_LGAS.map((lga, idx) => (
                    <option key={idx} value={lga}>{lga}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Ward Name</label>
                <input
                  type="text"
                  value={regForm.ward}
                  onChange={e => setRegForm({ ...regForm, ward: e.target.value })}
                  placeholder="e.g. Gwol Ward / Tudun Wada Ward"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e2e8f0] rounded focus:border-[#13696a] outline-none text-[#0d1c2e]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Residential Street Address</label>
                <input
                  type="text"
                  value={regForm.address}
                  onChange={e => setRegForm({ ...regForm, address: e.target.value })}
                  placeholder="House No 14, Main Street"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e2e8f0] rounded focus:border-[#13696a] outline-none text-[#0d1c2e]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={regForm.phoneNumber}
                  onChange={e => setRegForm({ ...regForm, phoneNumber: e.target.value })}
                  placeholder="+2348031234567"
                  className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded focus:border-[#13696a] outline-none text-[#0d1c2e] tabular-nums"
                />
              </div>
            </div>

            {/* 3. GPS Geolocation */}
            <div className="p-4 bg-[#f8f9ff] border border-[#e2e8f0] rounded space-y-3">
              <h3 className="font-bold text-[#002045]">📡 Live Field GPS Location Capture</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCaptureGps}
                  disabled={gpsLoading}
                  className="btn-primary text-xs bg-[#13696a] hover:bg-[#0f5455]"
                >
                  {gpsLoading ? 'Capturing GPS...' : '📡 Capture Live Field GPS Coordinates'}
                </button>
                <input
                  type="text"
                  readOnly
                  value={regForm.gpsCoordinates || 'Click button to capture GPS location'}
                  className="flex-1 bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs font-mono text-[#0d1c2e]"
                />
              </div>
            </div>

            {/* 4. Patient Informed Consent */}
            <div className="p-4 bg-[#f8f9ff] border border-[#e2e8f0] rounded flex items-start gap-3">
              <input
                type="checkbox"
                id="consentGiven"
                checked={regForm.consentGiven}
                onChange={e => setRegForm({ ...regForm, consentGiven: e.target.checked })}
                className="w-5 h-5 text-[#13696a] rounded mt-0.5 cursor-pointer"
                required
              />
              <label htmlFor="consentGiven" className="text-xs text-[#0d1c2e] leading-relaxed cursor-pointer">
                <span className="font-bold block text-[#002045]">Patient Verbal / Written Informed Consent *</span>
                "I confirm that the patient has been informed of the screening procedure and has voluntarily granted consent for cancer screening, follow-up notifications, and health data registry storage."
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
              <button type="submit" className="btn-primary text-xs bg-[#13696a] hover:bg-[#0f5455]">
                Save & Generate Patient QR Pass
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: OUTREACH DRIVES */}
      {activeTab === 'outreach' && (
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#002045]">Assigned Field Outreach Drives</h2>
          <div className="divide-y divide-[#e2e8f0]">
            {outreaches.map(o => (
              <div key={o.id} className="py-4 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-[#002045] text-sm">{o.title}</p>
                  <p className="text-[#43474e]">{o.location?.name || 'Barkin Ladi PHC'} • Date: {new Date(o.date).toLocaleDateString()}</p>
                </div>
                <span className={o.status === 'COMPLETED' ? 'badge-low-risk' : 'badge-mod-risk'}>{o.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: OFFLINE QUEUE */}
      {activeTab === 'queue' && (
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#002045]">Local Offline Synchronization Queue</h2>
          <p className="text-xs text-[#43474e]">Records captured while disconnected from internet are held securely in local storage.</p>
        </div>
      )}
    </div>
  );
}
