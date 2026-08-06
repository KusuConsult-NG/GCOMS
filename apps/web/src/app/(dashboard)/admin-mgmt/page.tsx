'use client';

import { errorMessage } from '@/lib/errors';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

interface FacilityRequest {
  id: string;
  facilityName: string;
  requestType: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<FacilityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [facilityName, setFacilityName] = useState('');
  const [requestType, setRequestType] = useState('MAINTENANCE');
  const [description, setDescription] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'ADMIN' && user.role !== 'EXECUTIVE') {
      router.push('/');
      return;
    }

    const fetchRequests = async () => {
      try {
        const res = await api.get('/admin/facilities');
        setRequests(res.data);
      } catch (err) {
        console.error('Failed to fetch facility requests', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/admin/facilities', {
        facilityName,
        requestType,
        description
      });
      setRequests([res.data, ...requests]);
      setSuccess('Facility request submitted successfully. It is now pending executive approval.');
      setFacilityName('');
      setDescription('');
    } catch (err) {
      setError(errorMessage(err, 'Submission failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Admin Module...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Management</h1>
        <p className="text-slate-600 mt-1">Manage facility requests, maintenance, and space bookings.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">New Facility Request</h2>
            
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-medium border border-emerald-100">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Request Type</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 bg-white"
                >
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="BOOKING">Booking</option>
                  <option value="REPAIR">Repair</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Facility / Room Name</label>
                <input
                  type="text"
                  required
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                  placeholder="e.g. Mobile Clinic Unit B"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                  placeholder="Details of the request..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-[var(--secondary)] px-4 py-2.5 text-sm font-semibold text-[var(--on-secondary)] transition hover:bg-[var(--secondary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit to Executives'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Facility Requests</h2>
            
            {requests.length === 0 ? (
              <p className="text-sm text-slate-500">No requests recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-sm font-medium text-slate-500">
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 pr-4 font-medium">Facility</th>
                      <th className="pb-3 pr-4 font-medium">Type</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {requests.map((r) => (
                      <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="py-4 pr-4 text-slate-500">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 pr-4">
                          <div className="font-medium text-slate-800">{r.facilityName}</div>
                          <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{r.description}</div>
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-medium ${
                            r.requestType === 'BOOKING' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                          }`}>
                            {r.requestType}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 
                            r.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
