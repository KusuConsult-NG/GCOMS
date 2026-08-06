'use client';

import type { AuditLogEntry, UserRecord } from '@/types/api';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function AdminWorkspace() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit' | 'config'>('users');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', role: 'ADMIN', department: '', password: 'GCOMS@2026!' });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  
  // The real audit trail: PHI break-glass access and role changes. This was a
  // hardcoded array while genuine security events accumulated unread.
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditModuleFilter, setAuditModuleFilter] = useState('ALL');
  const [auditDateFilter, setAuditDateFilter] = useState('');

  const [orgSettings, setOrgSettings] = useState({
    name: 'GCOMS - Gyang Cancer & Outreach Mission Support', country: 'Nigeria', state: 'Plateau State', lga: 'Jos North LGA', address: '', phone: '', email: '', website: ''
  });
  const [systemSettings, setSystemSettings] = useState({
    sessionTimeout: '8 hours', maxLoginAttempts: '5', passwordPolicy: 'STRONG', dataBackupFrequency: 'DAILY'
  });

  const rolesList = ['EXECUTIVE', 'BOARD', 'ADMIN', 'SYSTEM_ADMIN', 'FINANCE', 'PROCUREMENT', 'HR', 'GRANT_MANAGER', 'PROJECT_MANAGER', 'CLINICIAN', 'DOCTOR', 'NURSE', 'FIELD_OFFICER', 'VOLUNTEER', 'COMMUNITY_HEALTH_WORKER'];


  const fetchAuditLogs = () => {
    api.get('/system-admin/audit-logs', { params: { limit: 100 } })
      .then(res => setAuditLogs(res.data))
      .catch(err => console.error('Failed to fetch audit logs', err));
  };

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users')
      .then(res => setUsers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();

    api.get('/system-admin/config').then(res => {
      if (res.data?.org) setOrgSettings(res.data.org);
      if (res.data?.system) setSystemSettings(res.data.system);
    }).catch(() => {
      // keep defaults as fallback
    });
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', newUser);
      setIsCreateModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/users/${userId}`, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (user: UserRecord) => {
    // The API models this as `isActive: boolean` — the old `status: 'ACTIVE'`
    // string targeted a field that does not exist, so this could only ever
    // deactivate and never reactivate.
    const newIsActive = !user.isActive;
    try {
      await api.patch(`/users/${user.id}/status`, { isActive: newIsActive });
      setUsers(users.map(u => u.id === user.id ? { ...u, isActive: newIsActive } : u));
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (window.confirm("Are you sure you want to reset this user's password to default?")) {
      try {
        await api.patch(`/users/${userId}`, { password: 'GCOMS@2026!' });
        alert('Password reset successful');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveOrgSettings = async () => {
    try {
      await api.post('/system-admin/config', { type: 'ORG', ...orgSettings });
      alert('Organization settings saved');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSystemSettings = async () => {
    try {
      await api.post('/system-admin/config', { type: 'SYSTEM', ...systemSettings });
      alert('System settings saved');
    } catch (err) {
      console.error(err);
    }
  };

  // Was inserting a fabricated "refreshed audit logs" row into the audit trail
  // itself. Refresh now re-reads it.
  const handleRefreshAudit = () => fetchAuditLogs();

  // The trail records action + old/new payloads; derive display fields from those.
  const auditModule = (log: AuditLogEntry) => String(log.action ?? '').split('_')[0] || 'SYSTEM';
  const auditActor = (log: AuditLogEntry) =>
    log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown';
  const auditDetails = (log: AuditLogEntry) => {
    const before = log.oldData ? JSON.parse(log.oldData) : null;
    const after = log.newData ? JSON.parse(log.newData) : null;
    if (before && after) {
      const changed = Object.keys(after).filter(k => before[k] !== after[k]);
      return changed.length
        ? changed.map(k => `${k}: ${before[k]} → ${after[k]}`).join(', ')
        : JSON.stringify(after);
    }
    return after ? JSON.stringify(after) : (log.oldData ?? '');
  };
  const auditTime = (log: AuditLogEntry) =>
    String(log.createdAt ?? '').replace('T', ' ').slice(0, 16);

  const filteredUsers = users.filter(u => {
    const matchSearch = (u.firstName + ' ' + u.lastName + ' ' + u.email).toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  const filteredAuditLogs = auditLogs.filter(a => {
    const matchModule = auditModuleFilter === 'ALL' || auditModule(a) === auditModuleFilter;
    const matchDate = !auditDateFilter || auditTime(a).startsWith(auditDateFilter);
    return matchModule && matchDate;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--outline)] pb-5">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">System Administration</span>
          <h1 className="text-2xl font-bold mt-1">Admin Officer Workspace</h1>
          <p className="text-xs text-[var(--muted)]">User management, RBAC role permissions, department structures, and system audit logs.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--outline)] gap-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'users', label: 'User & Staff Roster' },
          { id: 'roles', label: 'Role & Permission Matrix' },
          { id: 'audit', label: 'System Audit Logs' },
          { id: 'config', label: 'Global Configuration' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as Parameters<typeof setActiveTab>[0])}
            className={`py-2.5 px-4 rounded-t border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id ? 'border-[var(--secondary)] text-[var(--secondary)] bg-white font-bold' : 'border-transparent text-[var(--muted)] hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--outline)] flex flex-col md:flex-row justify-between items-start md:items-center bg-[var(--background)] gap-4">
            <h2 className="font-bold text-[var(--primary)] text-sm">System Users ({filteredUsers.length})</h2>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <input type="text" placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="w-full md:w-48 bg-white border border-[var(--outline)] rounded px-3 py-1.5 text-xs" />
              <select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)} className="w-full md:w-32 bg-white border border-[var(--outline)] rounded px-3 py-1.5 text-xs">
                <option value="ALL">All Roles</option>
                {rolesList.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary text-xs whitespace-nowrap px-3 py-1.5">+ Create User</button>
            </div>
          </div>
          {loading ? (
            <div className="p-8 text-center text-xs text-[var(--muted)]">Loading user roster...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Assigned Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--outline)]">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-[var(--primary-surface)]">
                      <td className="p-3 font-bold text-[var(--primary)]">{u.firstName} {u.lastName}</td>
                      <td className="p-3 font-mono text-[var(--muted)]">{u.email}</td>
                      <td className="p-3 font-semibold text-[var(--secondary)]">
                        <select value={u.role} onChange={e => handleUpdateRole(u.id, e.target.value)} className="bg-transparent border border-gray-200 rounded px-1 py-0.5 text-xs">
                          {rolesList.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.isActive ? 'badge-low-risk bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-3 text-right flex justify-end gap-1">
                        <button onClick={() => handleToggleStatus(u)} className="btn-secondary text-[10px] py-1 px-2">{u.isActive ? 'Deactivate' : 'Reactivate'}</button>
                        <button onClick={() => handleResetPassword(u.id)} className="btn-secondary text-[10px] py-1 px-2">Reset Pwd</button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={5} className="p-4 text-center text-gray-500">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--outline)] bg-[var(--background)]">
            <h2 className="font-bold text-[var(--primary)] text-sm">Role & Permission Matrix</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                <tr>
                  <th className="p-3 border-r border-[var(--outline)]">Role</th>
                  {['Finance', 'Procurement', 'HR', 'Grants', 'Projects', 'Inventory', 'Clinical', 'Governance', 'Executive', 'Admin'].map(m => (
                    <th key={m} className="p-3 text-center">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--outline)]">
                {[
                  { role: 'SYSTEM_ADMIN', p: ['YES', 'YES', 'YES', 'YES', 'YES', 'YES', 'YES', 'YES', 'YES', 'YES'] },
                  { role: 'EXECUTIVE', p: ['YES', 'YES', 'YES', 'YES', 'YES', 'YES', 'YES', 'YES', 'YES', 'YES'] },
                  { role: 'BOARD', p: ['VIEW', '-', '-', '-', '-', '-', '-', 'YES', 'YES', '-'] },
                  { role: 'FINANCE', p: ['YES', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                  { role: 'PROCUREMENT', p: ['-', 'YES', '-', '-', '-', 'YES', '-', '-', '-', '-'] },
                  { role: 'HR', p: ['-', '-', 'YES', '-', '-', '-', '-', '-', '-', '-'] },
                  { role: 'GRANT_MANAGER', p: ['-', '-', '-', 'YES', '-', '-', '-', '-', '-', '-'] },
                  { role: 'PROJECT_MANAGER', p: ['-', '-', '-', '-', 'YES', '-', '-', '-', '-', '-'] },
                  { role: 'CLINICIAN', p: ['-', '-', '-', '-', '-', 'VIEW', 'YES', '-', '-', '-'] },
                  { role: 'FIELD_OFFICER', p: ['-', '-', '-', '-', '-', '-', 'VIEW', '-', '-', '-'] },
                  { role: 'VOLUNTEER', p: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                ].map(r => (
                  <tr key={r.role} className="hover:bg-[var(--primary-surface)]">
                    <td className="p-3 font-bold text-[var(--primary)] border-r border-[var(--outline)]">{r.role}</td>
                    {r.p.map((val, idx) => (
                      <td key={idx} className="p-3 text-center">
                        {val === 'YES' && <span className="badge-low-risk bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded">✓ YES</span>}
                        {val === 'VIEW' && <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">VIEW</span>}
                        {val === '-' && <span className="text-gray-400">–</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-lg border border-[var(--outline)] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--outline)] flex flex-col md:flex-row justify-between items-start md:items-center bg-[var(--background)] gap-4">
            <h2 className="font-bold text-[var(--primary)] text-sm">System Audit Logs</h2>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <input type="date" value={auditDateFilter} onChange={e => setAuditDateFilter(e.target.value)} className="w-full md:w-auto bg-white border border-[var(--outline)] rounded px-3 py-1.5 text-xs" />
              <select value={auditModuleFilter} onChange={e => setAuditModuleFilter(e.target.value)} className="w-full md:w-auto bg-white border border-[var(--outline)] rounded px-3 py-1.5 text-xs">
                <option value="ALL">All Modules</option>
                <option value="Auth">Auth</option>
                <option value="Procurement">Procurement</option>
                <option value="Finance">Finance</option>
                <option value="Clinical">Clinical</option>
                <option value="HR">HR</option>
                <option value="System">System</option>
                <option value="Projects">Projects</option>
                <option value="Governance">Governance</option>
              </select>
              <button onClick={handleRefreshAudit} className="btn-secondary text-xs px-3 py-1.5">Refresh</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--on-surface-variant)] uppercase font-semibold border-b border-[var(--outline)]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--outline)]">
                {filteredAuditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[var(--primary-surface)]">
                    <td className="p-3 font-mono text-[var(--muted)]">{auditTime(log)}</td>
                    <td className="p-3 font-semibold text-[var(--primary)]">{auditActor(log)}</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-bold text-[10px]">{log.action}</span></td>
                    <td className="p-3 text-[var(--secondary)] font-bold">{auditModule(log)}</td>
                    <td className="p-3 max-w-md truncate" title={auditDetails(log)}>{auditDetails(log)}</td>
                    <td className="p-3 font-mono text-[10px] text-gray-500">{log.user?.role ?? '—'}</td>
                  </tr>
                ))}
                {filteredAuditLogs.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500">No logs found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-[var(--outline)] p-5 shadow-sm">
            <h2 className="font-bold text-[var(--primary)] text-sm border-b border-[var(--outline)] pb-3 mb-4">Organization Settings</h2>
            <div className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Organization Name</label><input type="text" value={orgSettings.name} onChange={e => setOrgSettings({...orgSettings, name: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">Country</label><input type="text" value={orgSettings.country} onChange={e => setOrgSettings({...orgSettings, country: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">State</label><input type="text" value={orgSettings.state} onChange={e => setOrgSettings({...orgSettings, state: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">LGA</label><input type="text" value={orgSettings.lga} onChange={e => setOrgSettings({...orgSettings, lga: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Address</label><textarea value={orgSettings.address} onChange={e => setOrgSettings({...orgSettings, address: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" rows={2}></textarea></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label><input type="tel" value={orgSettings.phone} onChange={e => setOrgSettings({...orgSettings, phone: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">Email</label><input type="email" value={orgSettings.email} onChange={e => setOrgSettings({...orgSettings, email: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">Website</label><input type="url" value={orgSettings.website} onChange={e => setOrgSettings({...orgSettings, website: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" /></div>
              </div>
              <div className="pt-2">
                <button onClick={handleSaveOrgSettings} className="btn-primary text-xs w-full py-2">Save Organization Settings</button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-[var(--outline)] p-5 shadow-sm">
            <h2 className="font-bold text-[var(--primary)] text-sm border-b border-[var(--outline)] pb-3 mb-4">System Settings</h2>
            <div className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Session Timeout</label>
                <select value={systemSettings.sessionTimeout} onChange={e => setSystemSettings({...systemSettings, sessionTimeout: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="4 hours">4 hours</option><option value="8 hours">8 hours</option><option value="12 hours">12 hours</option><option value="24 hours">24 hours</option>
                </select>
              </div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Maximum Login Attempts</label>
                <select value={systemSettings.maxLoginAttempts} onChange={e => setSystemSettings({...systemSettings, maxLoginAttempts: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="3">3</option><option value="5">5</option><option value="10">10</option>
                </select>
              </div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Password Policy</label>
                <select value={systemSettings.passwordPolicy} onChange={e => setSystemSettings({...systemSettings, passwordPolicy: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="STANDARD">STANDARD (8 chars)</option><option value="STRONG">STRONG (12 chars + special)</option><option value="CUSTOM">CUSTOM</option>
                </select>
              </div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Data Backup Frequency</label>
                <select value={systemSettings.dataBackupFrequency} onChange={e => setSystemSettings({...systemSettings, dataBackupFrequency: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                  <option value="DAILY">DAILY</option><option value="WEEKLY">WEEKLY</option><option value="MONTHLY">MONTHLY</option>
                </select>
              </div>
              <div className="pt-2">
                <button onClick={handleSaveSystemSettings} className="btn-primary text-xs w-full py-2">Save System Settings</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-[var(--primary)] mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label><input required type="text" value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label><input required type="text" value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Email</label><input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
                  <select required value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs">
                    {rolesList.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">Department</label><input type="text" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Temporary Password</label><input required type="text" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-white border border-[var(--outline)] rounded px-3 py-2 text-xs" /></div>
              
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary text-xs px-4 py-2">Cancel</button>
                <button type="submit" className="btn-primary text-xs px-4 py-2">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
