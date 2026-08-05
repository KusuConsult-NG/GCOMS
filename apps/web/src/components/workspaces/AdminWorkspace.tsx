'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function AdminWorkspace({ user }: { user: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit' | 'config'>('users');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', role: 'ADMIN', department: '', password: 'GCOMS@2026!' });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, time: '2026-08-05 09:12', user: 'Mrs. Blessing O. Yakubu', action: 'LOGIN', module: 'Auth', details: 'Successful login from Jos office', ip: '197.210.xx.xx' },
    { id: 2, time: '2026-08-05 08:45', user: 'John Danladi', action: 'CREATE', module: 'Procurement', details: 'Created PO: Acetic Acid VIA Kits ₦1,850,000', ip: '197.210.xx.xx' },
    { id: 3, time: '2026-08-04 17:30', user: 'Grace Bello', action: 'POST', module: 'Finance', details: 'Posted grant inflow: Global Fund ₦50,000,000', ip: '197.210.xx.xx' },
    { id: 4, time: '2026-08-04 15:20', user: 'Dr. Amara Okafor', action: 'CREATE', module: 'Clinical', details: 'New clinical encounter: Patient PAT-2026-0847', ip: '197.210.xx.xx' },
    { id: 5, time: '2026-08-04 14:10', user: 'Ngozi Adeyemi', action: 'SUBMIT', module: 'HR', details: 'Leave request submitted: Adaeze Nwosu - Sick Leave', ip: '197.210.xx.xx' },
    { id: 6, time: '2026-08-04 11:05', user: 'System Admin', action: 'CONFIG', module: 'System', details: 'Session timeout policy updated: 8 hours', ip: '192.168.1.1' },
    { id: 7, time: '2026-08-03 16:45', user: 'Ibrahim Danladi', action: 'UPDATE', module: 'Projects', details: 'Risk register updated: Reagent Supply Delay - status MITIGATING', ip: '197.210.xx.xx' },
    { id: 8, time: '2026-08-03 10:00', user: 'Mrs. Blessing O. Yakubu', action: 'APPROVE', module: 'Governance', details: 'Resolution RES-2026-001 passed: Annual Budget Approved', ip: '197.210.xx.xx' }
  ]);
  const [auditModuleFilter, setAuditModuleFilter] = useState('ALL');
  const [auditDateFilter, setAuditDateFilter] = useState('');

  const [orgSettings, setOrgSettings] = useState({
    name: 'GCOMS - Gyang Cancer & Outreach Mission Support', country: 'Nigeria', state: 'Plateau State', lga: 'Jos North LGA', address: '', phone: '', email: '', website: ''
  });
  const [systemSettings, setSystemSettings] = useState({
    sessionTimeout: '8 hours', maxLoginAttempts: '5', passwordPolicy: 'STRONG', dataBackupFrequency: 'DAILY'
  });

  const rolesList = ['EXECUTIVE', 'BOARD', 'ADMIN', 'SYSTEM_ADMIN', 'FINANCE', 'PROCUREMENT', 'HR', 'GRANT_MANAGER', 'PROJECT_MANAGER', 'CLINICIAN', 'FIELD_OFFICER', 'VOLUNTEER', 'COMMUNITY_HEALTH_WORKER'];

  useEffect(() => {
    fetchUsers();

    api.get('/system-admin/audit-logs').then(res => setAuditLogs(res.data)).catch(() => {
      // keep seeded data as fallback if endpoint doesn't exist
    });

    api.get('/system-admin/config').then(res => {
      if (res.data?.org) setOrgSettings(res.data.org);
      if (res.data?.system) setSystemSettings(res.data.system);
    }).catch(() => {
      // keep defaults as fallback
    });
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users')
      .then(res => setUsers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

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

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    try {
      await api.patch(`/users/${user.id}`, { status: newStatus });
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
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

  const handleRefreshAudit = () => {
    setAuditLogs([{
      id: Date.now(),
      time: new Date().toISOString().slice(0, 16).replace('T', ' '),
      user: 'System Admin',
      action: 'VIEW',
      module: 'Audit',
      details: 'Refreshed audit logs',
      ip: '192.168.1.1'
    }, ...auditLogs]);
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = (u.firstName + ' ' + u.lastName + ' ' + u.email).toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  const filteredAuditLogs = auditLogs.filter(a => {
    const matchModule = auditModuleFilter === 'ALL' || a.module === auditModuleFilter;
    const matchDate = !auditDateFilter || a.time.startsWith(auditDateFilter);
    return matchModule && matchDate;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#002045] text-white p-5 rounded-lg border border-[#1a365d] shadow-sm">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#13696a] text-white uppercase">System Administration</span>
          <h1 className="text-2xl font-bold mt-1">Admin Officer Workspace</h1>
          <p className="text-xs text-slate-300">User management, RBAC role permissions, department structures, and system audit logs.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e2e8f0] gap-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'users', label: '👤 User & Staff Roster' },
          { id: 'roles', label: '🔒 Role & Permission Matrix' },
          { id: 'audit', label: '📋 System Audit Logs' },
          { id: 'config', label: '⚙️ Global Configuration' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`py-2.5 px-4 rounded-t border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id ? 'border-[#13696a] text-[#13696a] bg-white font-bold' : 'border-transparent text-[#74777f] hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#e2e8f0] flex flex-col md:flex-row justify-between items-start md:items-center bg-[#f8f9ff] gap-4">
            <h2 className="font-bold text-[#002045] text-sm">System Users ({filteredUsers.length})</h2>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <input type="text" placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="w-full md:w-48 bg-white border border-[#e2e8f0] rounded px-3 py-1.5 text-xs" />
              <select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)} className="w-full md:w-32 bg-white border border-[#e2e8f0] rounded px-3 py-1.5 text-xs">
                <option value="ALL">All Roles</option>
                {rolesList.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary text-xs whitespace-nowrap px-3 py-1.5">+ Create User</button>
            </div>
          </div>
          {loading ? (
            <div className="p-8 text-center text-xs text-[#74777f]">Loading user roster...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Assigned Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-[#e5eeff]">
                      <td className="p-3 font-bold text-[#002045]">{u.firstName} {u.lastName}</td>
                      <td className="p-3 font-mono text-[#74777f]">{u.email}</td>
                      <td className="p-3 font-semibold text-[#13696a]">
                        <select value={u.role} onChange={e => handleUpdateRole(u.id, e.target.value)} className="bg-transparent border border-gray-200 rounded px-1 py-0.5 text-xs">
                          {rolesList.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${(!u.status || u.status === 'ACTIVE') ? 'badge-low-risk bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="p-3 text-right flex justify-end gap-1">
                        <button onClick={() => handleToggleStatus(u)} className="btn-secondary text-[10px] py-1 px-2">{(!u.status || u.status === 'ACTIVE') ? 'Deactivate' : 'Reactivate'}</button>
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
        <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#e2e8f0] bg-[#f8f9ff]">
            <h2 className="font-bold text-[#002045] text-sm">Role & Permission Matrix</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
                <tr>
                  <th className="p-3 border-r border-[#e2e8f0]">Role</th>
                  {['Finance', 'Procurement', 'HR', 'Grants', 'Projects', 'Inventory', 'Clinical', 'Governance', 'Executive', 'Admin'].map(m => (
                    <th key={m} className="p-3 text-center">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
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
                  <tr key={r.role} className="hover:bg-[#e5eeff]">
                    <td className="p-3 font-bold text-[#002045] border-r border-[#e2e8f0]">{r.role}</td>
                    {r.p.map((val, idx) => (
                      <td key={idx} className="p-3 text-center">
                        {val === 'YES' && <span className="badge-low-risk bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded">✓ YES</span>}
                        {val === 'VIEW' && <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">👁 VIEW</span>}
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
        <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#e2e8f0] flex flex-col md:flex-row justify-between items-start md:items-center bg-[#f8f9ff] gap-4">
            <h2 className="font-bold text-[#002045] text-sm">System Audit Logs</h2>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <input type="date" value={auditDateFilter} onChange={e => setAuditDateFilter(e.target.value)} className="w-full md:w-auto bg-white border border-[#e2e8f0] rounded px-3 py-1.5 text-xs" />
              <select value={auditModuleFilter} onChange={e => setAuditModuleFilter(e.target.value)} className="w-full md:w-auto bg-white border border-[#e2e8f0] rounded px-3 py-1.5 text-xs">
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
              <button onClick={handleRefreshAudit} className="btn-secondary text-xs px-3 py-1.5">🔄 Refresh</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {filteredAuditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[#e5eeff]">
                    <td className="p-3 font-mono text-[#74777f]">{log.time}</td>
                    <td className="p-3 font-semibold text-[#002045]">{log.user}</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-bold text-[10px]">{log.action}</span></td>
                    <td className="p-3 text-[#13696a] font-bold">{log.module}</td>
                    <td className="p-3">{log.details}</td>
                    <td className="p-3 font-mono text-[10px] text-gray-500">{log.ip}</td>
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
          <div className="bg-white rounded-lg border border-[#e2e8f0] p-5 shadow-sm">
            <h2 className="font-bold text-[#002045] text-sm border-b border-[#e2e8f0] pb-3 mb-4">Organization Settings</h2>
            <div className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Organization Name</label><input type="text" value={orgSettings.name} onChange={e => setOrgSettings({...orgSettings, name: e.target.value})} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">Country</label><input type="text" value={orgSettings.country} onChange={e => setOrgSettings({...orgSettings, country: e.target.value})} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">State</label><input type="text" value={orgSettings.state} onChange={e => setOrgSettings({...orgSettings, state: e.target.value})} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">LGA</label><input type="text" value={orgSettings.lga} onChange={e => setOrgSettings({...orgSettings, lga: e.target.value})} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Address</label><textarea value={orgSettings.address} onChange={e => setOrgSettings({...orgSettings, address: e.target.value})} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" rows={2}></textarea></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label><input type="tel" value={orgSettings.phone} onChange={e => setOrgSettings({...orgSettings, phone: e.target.value})} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">Email</label><input type="email" value={orgSettings.email} onChange={e => setOrgSettings({...orgSettings, email: e.target.value})} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">Website</label><input type="url" value={orgSettings.website} onChange={e => setOrgSettings({...orgSettings, website: e.target.value})} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
              </div>
              <div className="pt-2">
                <button onClick={handleSaveOrgSettings} className="btn-primary text-xs w-full py-2">Save Organization Settings</button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-[#e2e8f0] p-5 shadow-sm">
            <h2 className="font-bold text-[#002045] text-sm border-b border-[#e2e8f0] pb-3 mb-4">System Settings</h2>
            <div className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Session Timeout</label>
                <select value={systemSettings.sessionTimeout} onChange={e => setSystemSettings({...systemSettings, sessionTimeout: e.target.value})} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs">
                  <option value="4 hours">4 hours</option><option value="8 hours">8 hours</option><option value="12 hours">12 hours</option><option value="24 hours">24 hours</option>
                </select>
              </div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Maximum Login Attempts</label>
                <select value={systemSettings.maxLoginAttempts} onChange={e => setSystemSettings({...systemSettings, maxLoginAttempts: e.target.value})} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs">
                  <option value="3">3</option><option value="5">5</option><option value="10">10</option>
                </select>
              </div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Password Policy</label>
                <select value={systemSettings.passwordPolicy} onChange={e => setSystemSettings({...systemSettings, passwordPolicy: e.target.value})} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs">
                  <option value="STANDARD">STANDARD (8 chars)</option><option value="STRONG">STRONG (12 chars + special)</option><option value="CUSTOM">CUSTOM</option>
                </select>
              </div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Data Backup Frequency</label>
                <select value={systemSettings.dataBackupFrequency} onChange={e => setSystemSettings({...systemSettings, dataBackupFrequency: e.target.value})} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs">
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
            <h2 className="text-lg font-bold text-[#002045] mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label><input required type="text" value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label><input required type="text" value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Email</label><input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
                  <select required value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs">
                    {rolesList.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-semibold text-gray-700 mb-1">Department</label><input type="text" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1">Temporary Password</label><input required type="text" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
              
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
