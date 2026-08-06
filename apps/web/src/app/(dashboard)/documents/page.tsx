'use client';

import { errorMessage } from '@/lib/errors';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

interface DocumentRecord {
  id: string;
  title: string;
  documentType: string;
  url: string;
  version: string;
  createdAt: string;
  uploadedBy?: {
    firstName: string;
    lastName: string;
  };
}

export default function DocumentsDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('POLICY');
  const [url, setUrl] = useState('');
  const [version, setVersion] = useState('1.0');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchDocuments = async () => {
      try {
        const res = await api.get('/documents');
        setDocuments(res.data);
      } catch (err) {
        console.error('Failed to fetch documents', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/documents', {
        title,
        documentType,
        url,
        version,
      });
      setDocuments([res.data, ...documents]);
      setSuccess('Document published successfully to central repository.');
      setTitle('');
      setUrl('');
      setVersion('1.0');
    } catch (err) {
      setError(errorMessage(err, 'Failed to upload document.'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDocs = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.documentType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canUpload = user && user.role !== 'VOLUNTEER';

  if (loading) {
    return <div className="p-8 text-center text-xs text-[var(--muted)]">Loading central document repository...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--primary)]">Central Document Repository & Policies</h1>
        <p className="text-[var(--on-surface-variant)] text-xs mt-1">Access clinical protocols, operational SOPs, governance policies, and grant documentation.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {canUpload && (
          <div className="lg:col-span-1">
            <div className="clinical-card space-y-4">
              <h2 className="text-base font-bold text-[var(--primary)] border-b border-[var(--outline)] pb-2">Upload / Register Document</h2>

              {error && (
                <div className="p-3 rounded bg-[var(--risk-high-bg)] text-[var(--risk-high-text)] text-xs font-semibold">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 rounded bg-[var(--risk-low-bg)] text-[var(--risk-low-text)] text-xs font-semibold">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Document Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-white border border-[var(--outline)] focus:border-[var(--secondary)] outline-none text-[var(--on-background)]"
                    placeholder="e.g. Q3 Clinical VIA Screening Protocol"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Category & Type *</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-white border border-[var(--outline)] focus:border-[var(--secondary)] outline-none text-[var(--on-background)]"
                  >
                    <option value="POLICY">Governance & Operational Policy</option>
                    <option value="GUIDELINE">Clinical Practice Guideline</option>
                    <option value="REPORT">Quarterly Field & Grant Report</option>
                    <option value="FINANCE">Financial Audit & Budget Document</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Source URL / Secure Drive Link *</label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-white border border-[var(--outline)] focus:border-[var(--secondary)] outline-none text-[var(--on-background)]"
                    placeholder="https://drive.google.com/..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--on-background)] mb-1">Document Version *</label>
                  <input
                    type="text"
                    required
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-white border border-[var(--outline)] focus:border-[var(--secondary)] outline-none text-[var(--on-background)] font-mono tabular-nums"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary text-xs disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish to Repository'}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className={canUpload ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-[var(--outline)] flex justify-between items-center bg-[var(--background)]">
              <h2 className="font-bold text-[var(--primary)] text-sm">Document Directory</h2>
              <input
                type="text"
                placeholder="Search by title or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 rounded bg-white border border-[var(--outline)] focus:border-[var(--secondary)] outline-none text-xs w-64"
              />
            </div>

            {filteredDocs.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-[var(--muted)] py-12">
                No documents matching search criteria.
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                    <tr>
                      <th className="p-3">Title & Category</th>
                      <th className="p-3">Version</th>
                      <th className="p-3">Uploaded Date</th>
                      <th className="p-3 text-right">Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--outline)] font-medium text-[var(--on-background)]">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[var(--primary-surface)] transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-[var(--primary)]">{doc.title}</div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold bg-[var(--surface-subtle)] text-[var(--secondary)]">
                            {doc.documentType}
                          </span>
                        </td>
                        <td className="p-3 font-mono tabular-nums text-[var(--muted)]">v{doc.version}</td>
                        <td className="p-3 text-[var(--muted)] tabular-nums">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-[11px] py-1 px-3"
                          >
                            Open Link ↗
                          </a>
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
