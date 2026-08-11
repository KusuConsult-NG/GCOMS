'use client';

import { errorMessage } from '@/lib/errors';
import type { FollowUp, PatientAssignment, Referral, Screening, SessionUser, Vitals } from '@/types/api';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { CANCER_TYPES, FOLLOW_UP_TYPES } from '@/lib/clinicalVocabulary';

export function ClinicalWorkspace({ user }: { user: SessionUser }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'encounters' | 'vitals' | 'followups' | 'reports'>('dashboard');
  const [assignments, setAssignments] = useState<PatientAssignment[]>([]);
  const [upcomingFu, setUpcomingFu] = useState<FollowUp[]>([]);
  const [missedFu, setMissedFu] = useState<FollowUp[]>([]);

  // Clinical Encounter Form
  const [encounterForm, setEncounterForm] = useState({
    participantId: '',
    notes: '',
    prognosis: 'Good',
    cancerType: 'Cervical Cancer (VIA / Pap)',
    diagnosis: '',
    treatmentPlan: '',
    bpSystolic: 120,
    bpDiastolic: 80,
    pulseRate: 72,
    temperature: 36.6,
    weightKg: 65,
    heightCm: 165,
    oxygenSat: 98,
  });

  const [savingEncounter, setSavingEncounter] = useState(false);
  const [encounterMessage, setEncounterMessage] = useState('');

  // Vitals Tab State
  const [vitalsParticipantId, setVitalsParticipantId] = useState('');
  const [patientVitals, setPatientVitals] = useState<Vitals[]>([]);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    participantId: '',
    bpSystolic: 120,
    bpDiastolic: 80,
    pulseRate: 72,
    temperature: 36.6,
    weightKg: 65,
    heightCm: 165,
    oxygenSat: 98,
    respRate: 16,
    notes: '',
  });

  // Follow-ups Tab State
  const [allFollowUps, setAllFollowUps] = useState<FollowUp[]>([]);
  const [showFuModal, setShowFuModal] = useState(false);
  const [fuForm, setFuForm] = useState({
    participantId: '',
    followUpType: FOLLOW_UP_TYPES[0] as string,
    scheduledDate: '',
    notes: '',
  });


  // Hardcoded Data for Reports
  // Was a hardcoded array of four invented patients (NG-PL-101, "CIN-2",
  // "JUTH Oncology"). It rendered for every clinician regardless of caseload, so
  // a nurse with no patients was shown four fabricated referrals — inventing
  // clinical data and bypassing PHI scoping at the same time.
  const [referralTracking, setReferralTracking] = useState<Referral[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);

  const fetchDashboardData = () => {
    Promise.all([
      api.get('/clinical-encounters/assignments'),
      api.get('/follow-ups/upcoming?days=7'),
      api.get('/follow-ups/missed'),
    ]).then(([aRes, uRes, mRes]) => {
      setAssignments(aRes.data);
      setUpcomingFu(uRes.data);
      setMissedFu(mRes.data);
      if (aRes.data.length > 0) {
        setEncounterForm(prev => ({ ...prev, participantId: aRes.data[0].participantId }));
        setVitalsParticipantId(aRes.data[0].participantId);
        setVitalsForm(prev => ({ ...prev, participantId: aRes.data[0].participantId }));
        setFuForm(prev => ({ ...prev, participantId: aRes.data[0].participantId }));
      }
    }).catch(console.error);
  };

  const fetchFollowUps = () => {
    api.get('/follow-ups').then(res => setAllFollowUps(res.data)).catch(console.error);
    api.get('/screenings').then(res => setScreenings(res.data)).catch(console.error);
  };

  // Scoped by the API to the caller's caseload, so a clinician sees their own
  // referrals rather than everyone's.
  const fetchReferrals = () => {
    api
      .get('/referrals')
      .then(res => setReferralTracking(res.data))
      .catch(err => console.error('Failed to fetch referrals', err));
  };

  useEffect(() => {
    fetchDashboardData();
    fetchReferrals();
  }, []);

  useEffect(() => {
    if (activeTab === 'followups') {
      fetchFollowUps();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'vitals' && vitalsParticipantId) {
      api.get(`/vitals/participant/${vitalsParticipantId}`)
        .then(res => setPatientVitals(res.data))
        .catch(err => {
          console.error(err);
          setPatientVitals([]);
        });
    }
  }, [activeTab, vitalsParticipantId]);

  const handleEncounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEncounter(true);
    setEncounterMessage('');

    try {
      await api.post('/clinical-encounters', {
        participantId: encounterForm.participantId,
        notes: `Diagnosis: ${encounterForm.diagnosis || 'Evaluation'}. Notes: ${encounterForm.notes}. Treatment Plan: ${encounterForm.treatmentPlan}`,
        prognosis: encounterForm.prognosis,
        // The form marks this required and it was never sent. There was no DTO
        // field and no column either, so `whitelist: true` would have stripped
        // it regardless: a clinician chose a classification, the screen said the
        // encounter had been logged, and the record had none.
        cancerType: encounterForm.cancerType,
      });

      await api.post('/vitals', {
        participantId: encounterForm.participantId,
        bpSystolic: Number(encounterForm.bpSystolic),
        bpDiastolic: Number(encounterForm.bpDiastolic),
        pulseRate: Number(encounterForm.pulseRate),
        temperature: Number(encounterForm.temperature),
        weightKg: Number(encounterForm.weightKg),
        heightCm: Number(encounterForm.heightCm),
        oxygenSat: Number(encounterForm.oxygenSat),
      });

      setEncounterMessage('Clinical encounter & vital signs logged successfully!');
      setEncounterForm(prev => ({ ...prev, notes: '', diagnosis: '', treatmentPlan: '' }));
    } catch (err) {
      setEncounterMessage(errorMessage(err, 'Failed to save clinical encounter.'));
    } finally {
      setSavingEncounter(false);
    }
  };

  const handleVitalsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/vitals', {
        participantId: vitalsForm.participantId,
        bpSystolic: Number(vitalsForm.bpSystolic),
        bpDiastolic: Number(vitalsForm.bpDiastolic),
        pulseRate: Number(vitalsForm.pulseRate),
        temperature: Number(vitalsForm.temperature),
        weightKg: Number(vitalsForm.weightKg),
        heightCm: Number(vitalsForm.heightCm),
        oxygenSat: Number(vitalsForm.oxygenSat),
        // Respiratory rate is one of the five standard vital signs and had no
        // column, so it was typed and discarded — as were the notes, which are
        // the context that makes a reading interpretable ("taken after
        // walking", "cuff too small").
        respiratoryRate: Number(vitalsForm.respRate),
        notes: vitalsForm.notes || undefined,
      });
      setShowVitalsModal(false);
      if (vitalsForm.participantId === vitalsParticipantId) {
        api.get(`/vitals/participant/${vitalsParticipantId}`)
          .then(res => setPatientVitals(res.data))
          .catch(console.error);
      }
    } catch (err) {
      alert(errorMessage(err, 'Failed to save vitals'));
    }
  };

  const handleFuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      /*
       * `type` and `assignedTo` were sent and dropped. Neither was declared on
       * CreateFollowUpDto, so the validation whitelist removed both: the
       * required "Follow-Up Type" was recorded nowhere, and the assigned
       * clinician was a free-text name with no column and no way to match it to
       * an account. The type now has a column; the assignment is the clinician
       * recording it, which is what the API has always done.
       */
      await api.post('/follow-ups', {
        participantId: fuForm.participantId,
        followUpType: fuForm.followUpType,
        scheduledDate: fuForm.scheduledDate,
        notes: fuForm.notes,
      });
      setShowFuModal(false);
      fetchFollowUps();
    } catch (err) {
      alert(errorMessage(err, 'Failed to save follow-up'));
    }
  };

  const updateFuStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/follow-ups/${id}/status`, { status });
      fetchFollowUps();
    } catch (err) {
      alert(errorMessage(err, 'Failed to update status'));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Clinical Workspace Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--outline)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Clinical Medical Workspace
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--primary-surface)] text-[var(--primary)]">
              Clinician: {user?.firstName} {user?.lastName} (MD / RN)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1 text-[var(--on-background)]">Doctor & Nurse Clinical Journey</h1>
          <p className="text-[var(--muted)] text-xs mt-0.5">Comprehensive patient evaluation, cancer staging, vitals monitoring, and referral tracking.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--outline)] gap-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Clinical Dashboard & Alerts' },
          { id: 'encounters', label: 'New Clinical Encounter & Staging' },
          { id: 'vitals', label: 'Patient Vitals & History' },
          { id: 'followups', label: 'Patient Follow-Up Management' },
          { id: 'reports', label: 'Clinical Reports & Staging Stats' },
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

      {/* TAB 1: CLINICAL DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Assigned Patients</span>
              <p className="text-3xl font-bold text-[var(--primary)] mt-1 tabular-nums">{assignments.length}</p>
            </div>
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Upcoming Follow-ups (7d)</span>
              <p className="text-3xl font-bold text-[var(--secondary)] mt-1 tabular-nums">{upcomingFu.length}</p>
            </div>
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Missed Follow-ups (Alert)</span>
              <p className="text-3xl font-bold text-[var(--risk-high-text)] mt-1 tabular-nums">{missedFu.length}</p>
            </div>
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Urgent Referrals</span>
              <p className="text-3xl font-bold text-[var(--risk-mod-text)] mt-1 tabular-nums">{referralTracking.filter((r) => r.status === 'PENDING').length}</p>
            </div>
          </div>

          {missedFu.length > 0 && (
            <div className="p-4 bg-[var(--risk-high-bg)]/40 border border-[var(--risk-high-text)]/30 rounded-lg space-y-2">
              <h3 className="font-bold text-[var(--risk-high-text)] text-sm flex items-center gap-1.5">
                Missed Follow-up Clinical Alerts ({missedFu.length})
              </h3>
              <div className="divide-y divide-[var(--risk-high-text)]/10 text-xs">
                {missedFu.map((fu) => (
                  <div key={fu.id} className="py-2 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-[var(--on-background)]">{fu.participant?.firstName} {fu.participant?.lastName} ({fu.participant?.registrationId ?? fu.participant?.nationalId ?? '—'})</p>
                      <p className="text-[var(--risk-high-text)] text-[10px]">Was due: {new Date(fu.scheduledDate).toLocaleDateString()}</p>
                    </div>
                    <span className="badge-high-risk text-[var(--risk-high-text)] font-bold">MISSED</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
            <div className="p-4 border-b border-[var(--outline)] font-bold text-[var(--primary)] text-sm bg-[var(--background)]">
              My Assigned Patient Roster
            </div>
            {assignments.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--muted)]">No patients currently assigned.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                  <tr>
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">National ID</th>
                    <th className="p-3">Gender</th>
                    <th className="p-3">Assigned Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
                  {assignments.map(a => (
                    <tr key={a.id} className="hover:bg-[var(--primary-surface)]">
                      <td className="p-3 font-bold text-[var(--primary)]">{a.participant?.firstName} {a.participant?.lastName}</td>
                      <td className="p-3 font-mono text-[var(--muted)] tabular-nums">{a.participant?.registrationId ?? a.participant?.nationalId ?? '—'}</td>
                      <td className="p-3">{a.participant?.gender}</td>
                      <td className="p-3 text-[var(--muted)] tabular-nums">{new Date(a.assignedAt).toLocaleDateString()}</td>
                      <td className="p-3"><span className="badge-low-risk text-[var(--secondary)] font-bold">{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ENCOUNTERS */}
      {activeTab === 'encounters' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] p-6 space-y-6">
          <div className="border-b border-[var(--outline)] pb-3">
            <h2 className="text-lg font-bold text-[var(--primary)]">Clinical Examination & Assessment Form</h2>
            <p className="text-xs text-[var(--on-surface-variant)]">Log patient symptoms, examination notes, vital signs, and master cancer classification.</p>
          </div>
          {encounterMessage && (
            <div className={`p-3 rounded text-xs font-semibold ${encounterMessage.includes('success') ? 'bg-[var(--risk-low-bg)] text-[var(--risk-low-text)]' : 'bg-[var(--risk-high-bg)] text-[var(--risk-high-text)]'}`}>
              {encounterMessage}
            </div>
          )}
          <form onSubmit={handleEncounterSubmit} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Assigned Patient *</label>
                <select
                  value={encounterForm.participantId}
                  onChange={e => setEncounterForm({ ...encounterForm, participantId: e.target.value })}
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                  required
                >
                  <option value="">Select Patient</option>
                  {assignments.map(a => (
                    <option key={a.id} value={a.participantId}>
                      {a.participant?.firstName} {a.participant?.lastName} ({a.participant?.registrationId ?? a.participant?.nationalId ?? '—'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Master Cancer Classification *</label>
                <select
                  value={encounterForm.cancerType}
                  onChange={e => setEncounterForm({ ...encounterForm, cancerType: e.target.value })}
                  className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
                  required
                >
                  {CANCER_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 bg-[var(--background)] border border-[var(--outline)] rounded space-y-3">
              <h3 className="font-bold text-[var(--primary)] border-b border-[var(--outline)] pb-1">Vital Signs & Physical Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--muted)]">BP Systolic (mmHg)</label>
                  <input type="number" value={encounterForm.bpSystolic} onChange={e => setEncounterForm({ ...encounterForm, bpSystolic: Number(e.target.value) })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--muted)]">BP Diastolic (mmHg)</label>
                  <input type="number" value={encounterForm.bpDiastolic} onChange={e => setEncounterForm({ ...encounterForm, bpDiastolic: Number(e.target.value) })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--muted)]">Pulse Rate (bpm)</label>
                  <input type="number" value={encounterForm.pulseRate} onChange={e => setEncounterForm({ ...encounterForm, pulseRate: Number(e.target.value) })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--muted)]">Body Temp (°C)</label>
                  <input type="number" step="0.1" value={encounterForm.temperature} onChange={e => setEncounterForm({ ...encounterForm, temperature: Number(e.target.value) })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Clinical Diagnosis & Findings *</label>
                <input type="text" required value={encounterForm.diagnosis} onChange={e => setEncounterForm({ ...encounterForm, diagnosis: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Clinical Examination & Doctor&apos;s Notes *</label>
                <textarea required rows={3} value={encounterForm.notes} onChange={e => setEncounterForm({ ...encounterForm, notes: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-[var(--on-background)] mb-1">Treatment Plan & Clinical Recommendations *</label>
                <textarea required rows={2} value={encounterForm.treatmentPlan} onChange={e => setEncounterForm({ ...encounterForm, treatmentPlan: e.target.value })} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline)]">
              <button type="submit" disabled={savingEncounter || assignments.length === 0} className="btn-primary text-xs bg-[var(--secondary)] text-[var(--on-secondary)] px-4 py-2 rounded font-bold disabled:opacity-50">
                {savingEncounter ? 'Saving Record...' : 'Submit Clinical Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: VITALS */}
      {activeTab === 'vitals' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-[var(--outline)]">
            <div className="flex-1 max-w-md">
              <label className="block text-xs font-semibold text-[var(--on-background)] mb-1">Select Patient to View Vitals History</label>
              <select
                value={vitalsParticipantId}
                onChange={e => setVitalsParticipantId(e.target.value)}
                className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"
              >
                <option value="">Select Patient...</option>
                {assignments.map(a => (
                  <option key={a.id} value={a.participantId}>
                    {a.participant?.firstName} {a.participant?.lastName} - {a.participant?.registrationId ?? a.participant?.nationalId ?? '—'}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={() => setShowVitalsModal(true)} className="btn-primary bg-[var(--secondary)] text-[var(--on-secondary)] px-4 py-2 rounded text-xs font-bold whitespace-nowrap ml-4">
              + Record Vitals
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="clinical-card bg-white p-4 rounded border border-[var(--outline)]">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Patients with Vitals Recorded</span>
              <p className="text-2xl font-bold text-[var(--primary)] mt-1 tabular-nums">{new Set(assignments.map(a => a.participantId)).size}</p>
            </div>
            <div className="clinical-card bg-white p-4 rounded border border-[var(--outline)]">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Hypertensive Alerts</span>
              <p className="text-2xl font-bold text-[var(--risk-high-text)] mt-1 tabular-nums">
                {patientVitals.length > 0 
                  ? patientVitals.filter(v => (v.bpSystolic ?? 0) > 140 || (v.bpDiastolic ?? 0) > 90).length 
                  : <span className="text-sm font-normal">0 <br/><span className="text-[10px]">Select a patient to see vitals alerts</span></span>}
              </p>
            </div>
            <div className="clinical-card bg-white p-4 rounded border border-[var(--outline)]">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">BMI Alerts</span>
              <p className="text-2xl font-bold text-[var(--risk-mod-text)] mt-1 tabular-nums">
                {patientVitals.filter(v => {
                  // The API stores bmi; recomputing it from height and weight
                  // meant a row with either missing produced NaN, and NaN fails
                  // both comparisons — so an incomplete record silently dropped
                  // out of the count instead of being flagged.
                  const bmi = v.bmi ?? undefined;
                  return bmi !== undefined && (bmi > 30 || bmi < 18.5);
                }).length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
            <div className="p-4 border-b border-[var(--outline)] font-bold text-[var(--primary)] text-sm bg-[var(--background)]">
              Vitals History
            </div>
            {!vitalsParticipantId ? (
              <div className="p-8 text-center text-xs text-[var(--muted)]">Select a patient to view vitals history.</div>
            ) : patientVitals.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--muted)]">No vitals recorded for this patient yet.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">BP (Sys/Dia)</th>
                    <th className="p-3">Pulse (bpm)</th>
                    <th className="p-3">Resp (bpm)</th>
                    <th className="p-3">Temp (°C)</th>
                    <th className="p-3">Weight (kg)</th>
                    <th className="p-3">Height (cm)</th>
                    <th className="p-3">O2 Sat (%)</th>
                    <th className="p-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--outline)] text-[var(--on-background)]">
                  {patientVitals.map(v => (
                    <tr key={v.id} className="hover:bg-[var(--primary-surface)]">
                      {/* `recordedAt`. This read `createdAt`, a column
                          VitalSign does not have, so every row of a clinical
                          observation history showed "Invalid Date". */}
                      <td className="p-3 tabular-nums">{new Date(v.recordedAt).toLocaleString()}</td>
                      <td className="p-3 tabular-nums font-bold">
                        {v.bpSystolic}/{v.bpDiastolic}
                        {(v.bpSystolic ?? 0) > 140 && <span className="ml-2 px-1.5 py-0.5 bg-[var(--risk-high-bg)] text-[var(--risk-high-text)] rounded text-[10px]">HIGH BP</span>}
                      </td>
                      <td className="p-3 tabular-nums">{v.pulseRate}</td>
                      <td className="p-3 tabular-nums">{v.respiratoryRate ?? '—'}</td>
                      <td className="p-3 tabular-nums">{v.temperature}</td>
                      <td className="p-3 tabular-nums">{v.weightKg}</td>
                      <td className="p-3 tabular-nums">{v.heightCm}</td>
                      <td className="p-3 tabular-nums">{v.oxygenSat}</td>
                      <td className="p-3 max-w-xs truncate" title={v.notes ?? ''}>{v.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: FOLLOW-UPS */}
      {activeTab === 'followups' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="clinical-card bg-white p-4 rounded border border-[var(--outline)]">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Due Today</span>
              <p className="text-2xl font-bold text-[var(--primary)] mt-1 tabular-nums">
                {allFollowUps.filter(f => new Date(f.scheduledDate).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
            <div className="clinical-card bg-white p-4 rounded border border-[var(--outline)]">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Overdue</span>
              <p className="text-2xl font-bold text-[var(--risk-high-text)] mt-1 tabular-nums">
                {allFollowUps.filter(f => new Date(f.scheduledDate) < new Date() && f.status !== 'COMPLETED').length}
              </p>
            </div>
            <div className="clinical-card bg-white p-4 rounded border border-[var(--outline)]">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Completed This Week</span>
              <p className="text-2xl font-bold text-[var(--secondary)] mt-1 tabular-nums">
                {allFollowUps.filter(f => f.status === 'COMPLETED').length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
            <div className="p-4 border-b border-[var(--outline)] flex justify-between items-center bg-[var(--background)]">
              <h3 className="font-bold text-[var(--primary)] text-sm">Follow-Up Schedule</h3>
              <button onClick={() => setShowFuModal(true)} className="btn-primary bg-[var(--secondary)] text-[var(--on-secondary)] px-3 py-1.5 rounded text-xs font-bold">
                + Schedule Follow-Up
              </button>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                <tr>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Scheduled Date</th>
                  <th className="p-3">Clinician</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--outline)] text-[var(--on-background)]">
                {allFollowUps.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-[var(--muted)]">No follow-ups scheduled.</td></tr>
                ) : allFollowUps.map(fu => (
                  <tr key={fu.id} className="hover:bg-[var(--primary-surface)]">
                    <td className="p-3 font-bold">{fu.participant?.firstName} {fu.participant?.lastName}</td>
                    <td className="p-3">{fu.notes || 'Follow-up'}</td>
                    <td className="p-3 tabular-nums">{new Date(fu.scheduledDate).toLocaleDateString()}</td>
                    <td className="p-3">{fu.clinician ? `${fu.clinician.firstName} ${fu.clinician.lastName}` : 'Unassigned'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        fu.status === 'COMPLETED' ? 'bg-[var(--risk-low-bg)] text-[var(--risk-low-text)]' :
                        fu.status === 'MISSED' ? 'bg-[var(--risk-high-bg)] text-[var(--risk-high-text)]' :
                        'bg-[var(--outline)] text-[#4a5568]'
                      }`}>
                        {fu.status}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      {fu.status !== 'COMPLETED' && (
                        <button onClick={() => updateFuStatus(fu.id, 'COMPLETED')} className="text-[var(--risk-low-text)] bg-[var(--risk-low-bg)] px-2 py-1 rounded text-[10px] font-bold">Mark Attended</button>
                      )}
                      {fu.status !== 'MISSED' && (
                        <button onClick={() => updateFuStatus(fu.id, 'MISSED')} className="text-[var(--risk-high-text)] bg-[var(--risk-high-bg)] px-2 py-1 rounded text-[10px] font-bold">Mark Missed</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="clinical-card bg-white p-4 rounded border border-[var(--outline)]">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Total Encounters</span>
              <p className="text-2xl font-bold text-[var(--primary)] mt-1 tabular-nums">
                {assignments.length > 0 ? assignments.length : <span className="text-sm font-normal">No participant selected</span>}
              </p>
            </div>
            <div className="clinical-card bg-white p-4 rounded border border-[var(--outline)]">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">VIA Screenings</span>
              <p className="text-2xl font-bold text-[var(--primary)] mt-1 tabular-nums">
                {screenings.filter(sc => (sc.cancerType || '').toUpperCase().includes('CERVICAL')).length}
              </p>
            </div>
            <div className="clinical-card bg-white p-4 rounded border border-[var(--outline)]">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Positive Cases</span>
              <p className="text-2xl font-bold text-[var(--risk-high-text)] mt-1 tabular-nums">
                {screenings.filter(sc => (sc.result || '').toUpperCase().includes('POSITIVE')).length}
              </p>
            </div>
            <div className="clinical-card bg-white p-4 rounded border border-[var(--outline)]">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Referrals Made</span>
              <p className="text-2xl font-bold text-[var(--risk-mod-text)] mt-1 tabular-nums">{referralTracking.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
              <div className="p-4 border-b border-[var(--outline)] font-bold text-[var(--primary)] text-sm bg-[var(--background)]">
                Staging Summary YTD 2026
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)]">
                  <tr><th className="p-3">Stage/Classification</th><th className="p-3">Count</th><th className="p-3">% of Screenings</th></tr>
                </thead>
                <tbody className="divide-y divide-[var(--outline)]">
                  <tr><td className="p-3" colSpan={3}>Loading clinical data... (Computed from {assignments.length} encounters)</td></tr>
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
              <div className="p-4 border-b border-[var(--outline)] font-bold text-[var(--primary)] text-sm bg-[var(--background)]">
                Monthly Screening Trend
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)]">
                  <tr><th className="p-3">Month</th><th className="p-3">Screenings</th><th className="p-3">Positives</th><th className="p-3">Referrals</th></tr>
                </thead>
                <tbody className="divide-y divide-[var(--outline)]">
                  <tr><td className="p-3" colSpan={4}>Loading clinical data... (Trend based on {assignments.length} encounters)</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
              <div className="p-4 border-b border-[var(--outline)] font-bold text-[var(--primary)] text-sm bg-[var(--background)]">
                Referral Tracking
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)]">
                  <tr><th className="p-3">Patient ID</th><th className="p-3">Condition</th><th className="p-3">Destination</th><th className="p-3">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-[var(--outline)]">
                  {referralTracking.map(rt => (
                    <tr key={rt.id}>
                      <td className="p-3">{rt.participantId}</td>
                      <td className="p-3">{rt.reason}</td>
                      <td className="p-3">{rt.referredTo}</td>
                      <td className="p-3 font-bold">{rt.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden">
              <div className="p-4 border-b border-[var(--outline)] font-bold text-[var(--primary)] text-sm bg-[var(--background)]">
                LGA Performance Breakdown
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)]">
                  <tr><th className="p-3">LGA</th><th className="p-3">Screenings</th><th className="p-3">Positive Rate</th><th className="p-3">CHWs</th></tr>
                </thead>
                <tbody className="divide-y divide-[var(--outline)]">
                  <tr><td className="p-3" colSpan={4}>Sample Data — Connect to live API for real LGA breakdown (Total encounters: {assignments.length})</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showVitalsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-bold text-[var(--primary)]">Record Patient Vitals</h2>
              <button onClick={() => setShowVitalsModal(false)} className="text-gray-500 hover:text-black">✕</button>
            </div>
            <form onSubmit={handleVitalsSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-semibold">Patient *</label>
                  <select required value={vitalsForm.participantId} onChange={e => setVitalsForm({...vitalsForm, participantId: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                    <option value="">Select Patient</option>
                    {assignments.map(a => <option key={a.id} value={a.participantId}>{a.participant?.firstName} {a.participant?.lastName}</option>)}
                  </select>
                </div>
                <div>
                  {/* Was a required datetime the form collected and never sent.
                      VitalSign stamps recordedAt on the server; a clinician
                      choosing a different time here changed nothing, and a
                      back-dated observation is a clinical claim that needs a
                      column, not a silently ignored input. */}
                  <label className="block mb-1 font-semibold">Recorded</label>
                  <p className="rounded border border-[var(--outline)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--on-surface-variant)]">
                    Stamped when saved
                  </p>
                </div>
                <div>
                  <label className="block mb-1 font-semibold">BP Systolic mmHg *</label>
                  <input type="number" required value={vitalsForm.bpSystolic} onChange={e => setVitalsForm({...vitalsForm, bpSystolic: Number(e.target.value)})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">BP Diastolic mmHg *</label>
                  <input type="number" required value={vitalsForm.bpDiastolic} onChange={e => setVitalsForm({...vitalsForm, bpDiastolic: Number(e.target.value)})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Pulse Rate bpm *</label>
                  <input type="number" required value={vitalsForm.pulseRate} onChange={e => setVitalsForm({...vitalsForm, pulseRate: Number(e.target.value)})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Temperature °C *</label>
                  <input type="number" step="0.1" required value={vitalsForm.temperature} onChange={e => setVitalsForm({...vitalsForm, temperature: Number(e.target.value)})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Weight kg *</label>
                  <input type="number" step="0.1" required value={vitalsForm.weightKg} onChange={e => setVitalsForm({...vitalsForm, weightKg: Number(e.target.value)})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Height cm *</label>
                  <input type="number" step="0.1" required value={vitalsForm.heightCm} onChange={e => setVitalsForm({...vitalsForm, heightCm: Number(e.target.value)})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">O2 Saturation % *</label>
                  <input type="number" required value={vitalsForm.oxygenSat} onChange={e => setVitalsForm({...vitalsForm, oxygenSat: Number(e.target.value)})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Respiratory Rate (opt)</label>
                  <input type="number" value={vitalsForm.respRate} onChange={e => setVitalsForm({...vitalsForm, respRate: Number(e.target.value)})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-semibold">Notes</label>
                <textarea rows={2} value={vitalsForm.notes} onChange={e => setVitalsForm({...vitalsForm, notes: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"></textarea>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="bg-[var(--secondary)] text-[var(--on-secondary)] px-4 py-2 rounded font-bold">Submit Vitals</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFuModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-bold text-[var(--primary)]">Schedule Follow-Up</h2>
              <button onClick={() => setShowFuModal(false)} className="text-gray-500 hover:text-black">✕</button>
            </div>
            <form onSubmit={handleFuSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-semibold">Patient *</label>
                <select required value={fuForm.participantId} onChange={e => setFuForm({...fuForm, participantId: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="">Select Patient</option>
                  {assignments.map(a => <option key={a.id} value={a.participantId}>{a.participant?.firstName} {a.participant?.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-semibold">Follow-Up Type *</label>
                <select required value={fuForm.followUpType} onChange={e => setFuForm({...fuForm, followUpType: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  {FOLLOW_UP_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-semibold">Scheduled Date *</label>
                <input type="date" required value={fuForm.scheduledDate} onChange={e => setFuForm({...fuForm, scheduledDate: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" />
              </div>
              <div>
                {/* Was a free-text name that was sent and discarded. A follow-up
                    is filed against a clinician account, not a typed name, and
                    the API files it against whoever records it. */}
                <label className="block mb-1 font-semibold">Assigned Clinician</label>
                <p className="rounded border border-[var(--outline)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--on-surface-variant)]">
                  {user.firstName} {user.lastName} — follow-ups are filed against
                  the clinician who schedules them.
                </p>
              </div>
              <div>
                <label className="block mb-1 font-semibold">Notes</label>
                <textarea rows={2} value={fuForm.notes} onChange={e => setFuForm({...fuForm, notes: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs"></textarea>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="bg-[var(--secondary)] text-[var(--on-secondary)] px-4 py-2 rounded font-bold">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
