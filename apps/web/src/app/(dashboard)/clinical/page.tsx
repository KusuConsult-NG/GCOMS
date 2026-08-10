'use client';

import { errorMessage } from '@/lib/errors';
import type { PatientAssignment } from '@/types/api';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function ClinicalDashboard() {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<PatientAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignForm, setAssignForm] = useState({ participantId: '', clinicianId: '' });
  const [message, setMessage] = useState('');
  
  // Encounter Editing
  const [editEncounterId, setEditEncounterId] = useState('');
  const [newNotes, setNewNotes] = useState('');


  const fetchAssignments = async () => {
    try {
      const res = await api.get('/clinical-encounters/assignments');
      setAssignments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/clinical-encounters/assignments', assignForm);
      setMessage('Patient assigned successfully!');
      fetchAssignments();
      setAssignForm({ participantId: '', clinicianId: '' });
    } catch (err) {
      setMessage(errorMessage(err, 'Failed to assign patient.'));
    }
  };

  const handleEditNote = async () => {
    if (!editEncounterId || !newNotes) return;
    try {
      await api.patch(`/clinical-encounters/${editEncounterId}`, { notes: newNotes });
      setMessage('Clinical note updated (Audit log created).');
      setEditEncounterId('');
      setNewNotes('');
    } catch (err) {
      setMessage(errorMessage(err, 'Failed to update note.'));
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Clinical Dashboard</h1>

      {message && (
        <div className="p-4 bg-blue-50 text-blue-700 rounded-lg">
          {message}
        </div>
      )}

      {/* Assignment Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Assign Patient to Clinician</h2>
        <form onSubmit={handleAssignSubmit} className="flex gap-4">
          <input
            type="text"
            placeholder="Participant ID"
            value={assignForm.participantId}
            onChange={(e) => setAssignForm({ ...assignForm, participantId: e.target.value })}
            className="flex-1 px-4 py-2 border rounded-lg"
            required
          />
          <input
            type="text"
            placeholder="Clinician ID (User ID)"
            value={assignForm.clinicianId}
            onChange={(e) => setAssignForm({ ...assignForm, clinicianId: e.target.value })}
            className="flex-1 px-4 py-2 border rounded-lg"
            required
          />
          <button type="submit" className="rounded-lg bg-[var(--secondary)] px-4 py-2.5 text-sm font-semibold text-[var(--on-secondary)] transition hover:bg-[var(--secondary-hover)] disabled:cursor-not-allowed disabled:opacity-60">
            Assign
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Assigned Patients</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-sm text-[var(--muted)]">
              <th className="pb-2">Participant ID</th>
              <th className="pb-2">Clinician</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Assigned At</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id} className="border-b last:border-0 text-sm">
                <td className="py-3">{a.participantId}</td>
                <td className="py-3">{a.clinician?.firstName} {a.clinician?.lastName}</td>
                <td className="py-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">{a.status}</span></td>
                <td className="py-3">{new Date(a.assignedAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-[var(--muted)]">No assignments found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit History UI */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 border-l-4 border-l-yellow-400">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Edit Clinical Encounter (Audit Trail Active)</h2>
        <p className="text-sm text-[var(--muted)] mb-4">Modifying a clinical note will permanently log the old and new data in the Audit system for compliance.</p>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Encounter ID"
            value={editEncounterId}
            onChange={(e) => setEditEncounterId(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <textarea
            placeholder="New corrected notes..."
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg h-32"
          />
          <button 
            onClick={handleEditNote}
            className="rounded-lg bg-[var(--secondary)] px-4 py-2.5 text-sm font-semibold text-[var(--on-secondary)] transition hover:bg-[var(--secondary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Submit Correction
          </button>
        </div>
      </div>
    </div>
  );
}
