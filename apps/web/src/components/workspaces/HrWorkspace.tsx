'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

const PLATEAU_LGAS = [
  'Barkin Ladi LGA', 'Bassa LGA', 'Bokkos LGA', 'Jos East LGA', 'Jos North LGA',
  'Jos South LGA', 'Kanam LGA', 'Kanke LGA', 'Langtang North LGA', 'Langtang South LGA',
  'Mangu LGA', 'Mikang LGA', 'Pankshin LGA', 'Quan\'Pan LGA', 'Riyom LGA', 'Shendam LGA', 'Wase LGA',
];

export function HrWorkspace({ user }: { user: any }) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'staff' | 'volunteers' | 'recruitment' | 'leave' | 'training'>('staff');
  const [staff, setStaff] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([
    { id: 1, name: 'Grace M. Gyang', lga: 'Barkin Ladi LGA', ward: 'Gwol Ward', address: 'House 14, Main Street, Barkin Ladi', stipend: '₦35,000 / mo', status: 'ACTIVE' },
    { id: 2, name: 'Blessing K. Pam', lga: 'Jos North LGA', ward: 'Tudun Wada Ward', address: 'Plot 88, Ahmadu Bello Way, Jos', stipend: '₦35,000 / mo', status: 'ACTIVE' },
    { id: 3, name: 'Emmanuel D. Luka', lga: 'Mangu LGA', ward: 'Panyam Ward', address: 'Panyam Central Road, Mangu', stipend: '₦35,000 / mo', status: 'ACTIVE' },
    { id: 4, name: 'Ruth A. Danladi', lga: 'Kanke LGA', ward: 'Kwal Ward', address: 'Near LGA Secretariate, Kanke', stipend: '₦35,000 / mo', status: 'ACTIVE' },
  ]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<null | 'staff' | 'volunteer' | 'leave' | 'job' | 'applicant' | 'interview' | 'offer' | 'attendance' | 'performance' | 'training'>(null);

  // States for new features
  const [jobOpenings, setJobOpenings] = useState<any[]>([
    { id: 1, title: 'Senior Clinical Officer', dept: 'Clinical', type: 'FULL_TIME', location: 'Jos, Plateau State', deadline: '2026-08-31', status: 'OPEN', applicants: [] },
    { id: 2, title: 'Field Outreach Coordinator', dept: 'Field Operations', type: 'CONTRACT', location: 'Barkin Ladi LGA', deadline: '2026-09-15', status: 'OPEN', applicants: [] }
  ]);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<any[]>([]);
  
  const [trainings, setTrainings] = useState<any[]>([
    { id: 1, staff: 'Dr. Amara Okafor', title: 'VIA/Cryotherapy Clinical Certification', provider: 'WHO AFRO', type: 'CLINICAL_SKILLS', date: '2025-11-15', cert: 'YES', expiry: '2026-11-15', status: 'ACTIVE' },
    { id: 2, staff: 'John Danladi', title: 'Financial Management for NGOs', provider: 'CLEEN Foundation', type: 'GRANTS_MANAGEMENT', date: '2026-03-10', cert: 'YES', expiry: '2027-03-10', status: 'ACTIVE' }
  ]);
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', role: 'CLINICIAN', department: 'Clinical Care'
  });
  const [volunteerForm, setVolunteerForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', lga: 'Barkin Ladi LGA', ward: '', address: '', stipend: '35000'
  });
  const [jobForm, setJobForm] = useState({
    title: '', dept: 'Clinical', type: 'FULL_TIME', location: '', qualifications: '', deadline: ''
  });
  const [applicantForm, setApplicantForm] = useState({
    name: '', email: '', phone: '', experience: 0, currentEmployer: '', date: new Date().toISOString().split('T')[0]
  });
  const [interviewForm, setInterviewForm] = useState({
    date: '', time: '', mode: 'IN_PERSON', interviewer: ''
  });
  const [leaveForm, setLeaveForm] = useState({
    staffId: '', type: 'ANNUAL', start: '', end: '', reason: ''
  });
  const [attendanceForm, setAttendanceForm] = useState({
    staffId: '', date: new Date().toISOString().split('T')[0], clockIn: '', clockOut: '', notes: ''
  });
  const [performanceForm, setPerformanceForm] = useState({
    staffId: '', period: 'Q3 2026', rating: 'MEETS_EXPECTATIONS', achievements: '', development: '', comments: ''
  });
  const [trainingForm, setTrainingForm] = useState({
    staffId: '', title: '', provider: '', type: 'CLINICAL_SKILLS', date: '', cert: 'YES', expiry: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [viewReview, setViewReview] = useState<any>(null);

  // Read URL action & tab params from Sidebar links
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const actionParam = searchParams.get('action');

    if (tabParam && ['staff', 'volunteers', 'recruitment', 'leave', 'training'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
    if (actionParam) {
      if (actionParam === 'new-staff') setActiveModal('staff');
      if (actionParam === 'new-volunteer') { setActiveTab('volunteers'); setActiveModal('volunteer'); }
      if (actionParam === 'leave') { setActiveTab('leave'); setActiveModal('leave'); }
    }
  }, [searchParams]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setStaff(res.data);
    } catch (err) {
      console.error('Failed to fetch staff directory', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeave = async () => {
    try {
      const res = await api.get('/hr/leave');
      setLeaveRequests(res.data);
    } catch (err) { console.error('Failed to fetch leave requests', err); }
  };

  // Performance reviews are the Appraisal table. There is no onboarding screen
  // yet, so /hr/onboarding is left unconsumed rather than faked.
  const fetchAppraisals = async () => {
    try {
      const res = await api.get('/hr/appraisals');
      setPerformanceReviews(res.data);
    } catch (err) { console.error('Failed to fetch appraisals', err); }
  };

  useEffect(() => {
    fetchStaff();
    fetchLeave();
    fetchAppraisals();
  }, []);

  const handleLeaveDecision = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/hr/leave/${id}`, { status });
      await fetchLeave();
    } catch (err) { console.error('Failed to update leave request', err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users', { ...formData, password: 'Password123!' });
      setActiveModal(null);
      setFormData({ firstName: '', lastName: '', email: '', role: 'CLINICIAN', department: 'Clinical Care' });
      fetchStaff();
    } catch (err) { console.error('Failed to create staff member', err); } finally { setSubmitting(false); }
  };

  const handleRegisterVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerForm.lga) return alert('LGA is mandatory!');
    setSubmitting(true);
    try {
      await api.post('/users', {
        firstName: volunteerForm.firstName, lastName: volunteerForm.lastName,
        email: volunteerForm.email || `volunteer.${Date.now()}@gcoms.org`, role: 'VOLUNTEER', password: 'Password123!'
      });
      setVolunteers([{
        id: Date.now(), name: `${volunteerForm.firstName} ${volunteerForm.lastName}`, lga: volunteerForm.lga,
        ward: volunteerForm.ward || 'General Ward', address: volunteerForm.address || 'LGA Health Centre',
        stipend: `₦${Number(volunteerForm.stipend).toLocaleString()} / mo`, status: 'ACTIVE'
      }, ...volunteers]);
      setActiveModal(null);
      setVolunteerForm({ firstName: '', lastName: '', email: '', phone: '', lga: 'Barkin Ladi LGA', ward: '', address: '', stipend: '35000' });
    } catch (err) { console.error('Failed to register volunteer', err); } finally { setSubmitting(false); }
  };

  // Job Opening Actions
  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    setJobOpenings([...jobOpenings, { id: Date.now(), ...jobForm, status: 'OPEN', applicants: [] }]);
    // @ts-ignore
    // NOT PERSISTED. This POSTed a job opening at the staff-record endpoint,
    // which rejected it 400; the error was swallowed. Local until a JobOpening
    // model exists.
    setActiveModal(null);
    setJobForm({ title: '', dept: 'Clinical', type: 'FULL_TIME', location: '', qualifications: '', deadline: '' });
  };
  const closeJob = (id: number) => {
    setJobOpenings(jobOpenings.map(j => j.id === id ? { ...j, status: 'CLOSED' } : j));
  };

  // Applicant Actions
  const handleAddApplicant = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedJob) {
      const updatedJob = {
        ...selectedJob, 
        applicants: [...selectedJob.applicants, { id: Date.now(), ...applicantForm, stage: 'APPLIED' }]
      };
      setJobOpenings(jobOpenings.map(j => j.id === selectedJob.id ? updatedJob : j));
      setSelectedJob(updatedJob);
      setActiveModal(null);
      setApplicantForm({ name: '', email: '', phone: '', experience: 0, currentEmployer: '', date: new Date().toISOString().split('T')[0] });
    }
  };
  const changeApplicantStage = (applicantId: number, newStage: string) => {
    if (selectedJob) {
      const updatedApplicants = selectedJob.applicants.map((a: any) => a.id === applicantId ? { ...a, stage: newStage } : a);
      const updatedJob = { ...selectedJob, applicants: updatedApplicants };
      setJobOpenings(jobOpenings.map(j => j.id === selectedJob.id ? updatedJob : j));
      setSelectedJob(updatedJob);
      if (newStage === 'INTERVIEW') setActiveModal('interview');
      if (newStage === 'OFFER') setActiveModal('offer');
    }
  };

  // Leave Actions
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };
  const staffName = (employeeId: string) => {
    const member = staff.find((m: any) => m.id === employeeId || m.user?.id === employeeId);
    if (!member) return 'Unknown staff';
    const u = member.user ?? member;
    return `${u.firstName} ${u.lastName}`;
  };

  const handleLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/hr/leave', {
        employeeId: leaveForm.staffId,
        type: leaveForm.type,
        startDate: leaveForm.start,
        endDate: leaveForm.end,
        reason: leaveForm.reason || undefined,
      });
      setActiveModal(null);
      setLeaveForm({ staffId: '', type: 'ANNUAL', start: '', end: '', reason: '' });
      await fetchLeave();
    } catch (err) {
      console.error('Failed to submit leave request', err);
    }
  };

  const updateLeaveStatus = (id: string, status: 'APPROVED' | 'REJECTED') =>
    handleLeaveDecision(id, status);

  // Attendance Actions
  const handleLogAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const staffMember = staff.find(s => s.id === attendanceForm.staffId);
    const staffName = staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Unknown Staff';
    
    // Calculate hours worked
    let hours = 0;
    if (attendanceForm.clockIn && attendanceForm.clockOut) {
      const inParts = attendanceForm.clockIn.split(':');
      const outParts = attendanceForm.clockOut.split(':');
      const inDate = new Date(); inDate.setHours(parseInt(inParts[0]), parseInt(inParts[1]));
      const outDate = new Date(); outDate.setHours(parseInt(outParts[0]), parseInt(outParts[1]));
      hours = Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60) * 10) / 10;
    }
    
    setAttendanceLogs([...attendanceLogs, {
      id: Date.now(), staff: staffName, date: attendanceForm.date, clockIn: attendanceForm.clockIn,
      clockOut: attendanceForm.clockOut, hours, status: hours >= 8 ? 'PRESENT' : 'LATE'
    }]);
    setActiveModal(null);
    setAttendanceForm({ staffId: '', date: new Date().toISOString().split('T')[0], clockIn: '', clockOut: '', notes: '' });
  };

  // Performance Actions
  // Appraisal stores a 0-5 score; the form offers a rating band, so map between
  // them in one place rather than letting the two vocabularies drift.
  const scoreToRating = (score: number) =>
    score >= 4.5 ? 'EXCEPTIONAL'
      : score >= 3.5 ? 'STRONG'
      : score >= 2.5 ? 'MEETS_EXPECTATIONS'
      : score >= 1.5 ? 'NEEDS_IMPROVEMENT'
      : 'UNSATISFACTORY';

  const RATING_SCORES: Record<string, number> = {
    UNSATISFACTORY: 1,
    NEEDS_IMPROVEMENT: 2,
    MEETS_EXPECTATIONS: 3,
    STRONG: 4,
    EXCEPTIONAL: 5,
  };

  const handlePerformanceReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/hr/appraisals', {
        employeeId: performanceForm.staffId,
        period: performanceForm.period,
        score: RATING_SCORES[performanceForm.rating] ?? 3,
        comments: [performanceForm.achievements, performanceForm.development, performanceForm.comments]
          .filter(Boolean)
          .join('\n\n') || undefined,
      });
      setActiveModal(null);
      setPerformanceForm({ staffId: '', period: 'Q3 2026', rating: 'MEETS_EXPECTATIONS', achievements: '', development: '', comments: '' });
      await fetchAppraisals();
    } catch (err) {
      console.error('Failed to record appraisal', err);
    }
  };

  // Training Actions
  const handleLogTraining = (e: React.FormEvent) => {
    e.preventDefault();
    const staffMember = staff.find(s => s.id === trainingForm.staffId);
    const staffName = staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Unknown Staff';
    setTrainings([...trainings, {
      id: Date.now(), staff: staffName, title: trainingForm.title, provider: trainingForm.provider,
      type: trainingForm.type, date: trainingForm.date, cert: trainingForm.cert, expiry: trainingForm.expiry, status: 'ACTIVE'
    }]);
    // @ts-ignore
    // NOT PERSISTED — no training-log table. See the job-opening note above.
    setActiveModal(null);
    setTrainingForm({ staffId: '', title: '', provider: '', type: 'CLINICAL_SKILLS', date: '', cert: 'YES', expiry: '' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* App Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-[#002045] text-white p-5 rounded-lg border border-[#1a365d] shadow-sm">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#13696a] text-white uppercase tracking-wider">
            Enterprise HR & Talent Operations Software • GCOMS
          </span>
          <h1 className="text-2xl font-bold mt-1 text-white">Human Resources & Volunteer Management</h1>
          <p className="text-slate-300 text-xs mt-0.5">Manage staff directory, field volunteer stipends, recruitment pipelines, and leave approvals.</p>
        </div>
        <div className="mt-3 lg:mt-0 flex flex-wrap gap-2">
          <button onClick={() => setActiveModal('staff')} className="btn-primary text-xs bg-[#13696a] hover:bg-[#0f5455]">
            + Add Staff Member
          </button>
          <button onClick={() => { setActiveTab('volunteers'); setActiveModal('volunteer'); }} className="btn-primary text-xs bg-amber-700 hover:bg-amber-800">
            + Register Volunteer / CHW
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex border-b border-[#e2e8f0] gap-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'staff', label: '👥 Staff & Employee Directory' },
          { id: 'volunteers', label: '🩺 Volunteer & Field CHW Roster' },
          { id: 'recruitment', label: '💼 Recruitment & Applicant Pipeline' },
          { id: 'leave', label: '📅 Leave & Attendance Management' },
          { id: 'training', label: '📚 Training & Certifications' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`py-2.5 px-4 rounded-t border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id ? 'border-[#13696a] text-[#13696a] bg-white font-bold' : 'border-transparent text-[#74777f]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      
      {/* TAB 1: STAFF DIRECTORY */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
            <div className="p-4 border-b border-[#e2e8f0] font-bold text-[#002045] text-sm bg-[#f8f9ff]">
              👥 Active Employee Directory
            </div>
            {loading ? (
              <div className="p-8 text-center text-xs text-[#74777f]">Loading staff directory...</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
                  <tr>
                    <th className="p-3">Staff Name</th>
                    <th className="p-3">Work Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0d1c2e]">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-[#e5eeff]">
                      <td className="p-3 font-bold text-[#002045]">{s.firstName} {s.lastName}</td>
                      <td className="p-3 font-mono text-[#74777f]">{s.email}</td>
                      <td className="p-3 text-[#13696a] font-semibold">{s.role}</td>
                      <td className="p-3"><span className="badge-low-risk">ACTIVE</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
            <div className="p-4 border-b border-[#e2e8f0] flex justify-between items-center bg-[#f8f9ff] cursor-pointer" onClick={() => setShowPerformance(!showPerformance)}>
              <span className="font-bold text-[#002045] text-sm">📈 Performance Reviews</span>
              <button onClick={(e) => { e.stopPropagation(); setActiveModal('performance'); }} className="btn-primary text-xs bg-[#13696a] hover:bg-[#0f5455]">
                + New Performance Review
              </button>
            </div>
            {showPerformance && (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
                  <tr>
                    <th className="p-3">Staff Name</th>
                    <th className="p-3">Period</th>
                    <th className="p-3">Rating</th>
                    <th className="p-3">Review Date</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0d1c2e]">
                  {performanceReviews.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-[#74777f]">No performance reviews yet.</td></tr>
                  ) : (
                    performanceReviews.map((r, i) => (
                      <tr key={i} className="hover:bg-[#e5eeff]">
                        <td className="p-3 font-bold text-[#002045]">{staffName(r.employeeId)}</td>
                        <td className="p-3">{r.period}</td>
                        <td className="p-3"><span className="badge-low-risk">{scoreToRating(r.score)} ({r.score})</span></td>
                        <td className="p-3">{String(r.createdAt).slice(0, 10)}</td>
                        <td className="p-3"><button className="text-[#13696a] hover:underline" onClick={() => setViewReview(r)}>View</button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VOLUNTEERS */}
      {activeTab === 'volunteers' && (
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-2">
            <h2 className="font-bold text-[#002045] text-sm">🩺 Field Volunteer & Community Health Worker Registry</h2>
            <button onClick={() => setActiveModal('volunteer')} className="btn-primary text-xs bg-amber-700 hover:bg-amber-800">
              + Register Volunteer (LGA Mandatory)
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {volunteers.map((v) => (
              <div key={v.id} className="p-4 bg-[#f8f9ff] border border-[#e2e8f0] rounded space-y-2">
                <div className="flex justify-between font-bold text-[#002045]">
                  <span className="text-sm">{v.name}</span>
                  <span className="badge-low-risk">{v.status}</span>
                </div>
                <div className="space-y-1 text-slate-700">
                  <p><strong className="text-[#002045]">LGA (Mandatory):</strong> <span className="px-2 py-0.5 rounded bg-[#13696a] text-white text-[10px] font-bold">{v.lga}</span></p>
                  <p><strong className="text-[#002045]">Ward:</strong> {v.ward}</p>
                  <p><strong className="text-[#002045]">Address:</strong> {v.address}</p>
                  <p><strong className="text-[#002045]">Stipend:</strong> <span className="text-[#22543d] font-bold font-mono">{v.stipend}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* TAB 3: RECRUITMENT */}
      {activeTab === 'recruitment' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[#74777f] uppercase">Open Positions</span>
              <p className="text-3xl font-bold text-[#002045] mt-1 tabular-nums">{jobOpenings.filter(j => j.status === 'OPEN').length}</p>
            </div>
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[#74777f] uppercase">Active Applicants</span>
              <p className="text-3xl font-bold text-[#13696a] mt-1 tabular-nums">
                {jobOpenings.reduce((acc, job) => acc + job.applicants.length, 0)}
              </p>
            </div>
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[#74777f] uppercase">Interviews Scheduled</span>
              <p className="text-3xl font-bold text-[#22543d] mt-1 tabular-nums">
                {jobOpenings.reduce((acc, job) => acc + job.applicants.filter((a: any) => a.stage === 'INTERVIEW').length, 0)}
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
            <div className="p-4 border-b border-[#e2e8f0] flex justify-between items-center bg-[#f8f9ff]">
              <span className="font-bold text-[#002045] text-sm">💼 Job Openings</span>
              <button onClick={() => setActiveModal('job')} className="btn-primary text-xs bg-[#13696a] hover:bg-[#0f5455]">
                + Post Job Opening
              </button>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
                <tr>
                  <th className="p-3">Job Title</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Deadline</th>
                  <th className="p-3">Applicants</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0d1c2e]">
                {jobOpenings.map(job => (
                  <tr key={job.id} className="hover:bg-[#e5eeff]">
                    <td className="p-3 font-bold text-[#002045]">{job.title}</td>
                    <td className="p-3">{job.dept}</td>
                    <td className="p-3">{job.type}</td>
                    <td className="p-3">{job.location}</td>
                    <td className="p-3">{job.deadline}</td>
                    <td className="p-3 font-bold text-[#13696a]">{job.applicants.length}</td>
                    <td className="p-3">
                      <span className={job.status === 'OPEN' ? 'badge-low-risk' : 'px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 uppercase'}>
                        {job.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button onClick={() => setSelectedJob(job)} className="text-[#13696a] hover:underline">View Applicants</button>
                      {job.status === 'OPEN' && (
                        <button onClick={() => closeJob(job.id)} className="text-red-600 hover:underline">Close Position</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedJob && (
            <div className="bg-white rounded-lg border border-[#e2e8f0] p-5">
              <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3 mb-3">
                <h3 className="font-bold text-[#002045] text-sm">Applicants for: {selectedJob.title}</h3>
                <div className="space-x-2">
                  <button onClick={() => setActiveModal('applicant')} className="btn-primary text-xs bg-[#13696a]">
                    + Add Applicant
                  </button>
                  <button onClick={() => setSelectedJob(null)} className="btn-secondary text-xs">Close Panel</button>
                </div>
              </div>
              
              <table className="w-full text-left text-xs">
                <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Applied Date</th>
                    <th className="p-3">Stage</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0d1c2e]">
                  {selectedJob.applicants.length === 0 ? (
                    <tr><td colSpan={6} className="p-4 text-center text-[#74777f]">No applicants yet.</td></tr>
                  ) : (
                    selectedJob.applicants.map((app: any) => (
                      <tr key={app.id} className="hover:bg-[#e5eeff]">
                        <td className="p-3 font-bold text-[#002045]">{app.name}</td>
                        <td className="p-3">{app.email}</td>
                        <td className="p-3">{app.phone}</td>
                        <td className="p-3">{app.date}</td>
                        <td className="p-3">
                          <select 
                            value={app.stage} 
                            onChange={(e) => changeApplicantStage(app.id, e.target.value)}
                            className="w-full bg-white border border-[#e2e8f0] rounded px-2 py-1 text-xs"
                          >
                            <option value="APPLIED">Applied</option>
                            <option value="SCREENING">Screening</option>
                            <option value="INTERVIEW">Interview</option>
                            <option value="OFFER">Offer</option>
                            <option value="HIRED">Hired</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                        </td>
                        <td className="p-3 space-x-2">
                          {app.stage === 'INTERVIEW' && <button onClick={() => setActiveModal('interview')} className="text-blue-600 hover:underline">Schedule Interview</button>}
                          {app.stage === 'OFFER' && <button onClick={() => setActiveModal('offer')} className="text-green-600 hover:underline">Generate Offer</button>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LEAVE & ATTENDANCE */}
      {activeTab === 'leave' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[#74777f] uppercase">Pending Requests</span>
              <p className="text-3xl font-bold text-orange-600 mt-1 tabular-nums">{leaveRequests.filter(l => l.status === 'PENDING').length}</p>
            </div>
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[#74777f] uppercase">Approved This Month</span>
              <p className="text-3xl font-bold text-green-600 mt-1 tabular-nums">{leaveRequests.filter(l => l.status === 'APPROVED').length}</p>
            </div>
            <div className="clinical-card">
              <span className="text-xs font-semibold text-[#74777f] uppercase">Staff on Leave Today</span>
              <p className="text-3xl font-bold text-[#002045] mt-1 tabular-nums">
                {leaveRequests.filter(l => {
                  const today = new Date().toISOString().split('T')[0];
                  return l.status === 'APPROVED' && l.start <= today && l.end >= today;
                }).length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
              <div className="p-4 border-b border-[#e2e8f0] flex justify-between items-center bg-[#f8f9ff]">
                <span className="font-bold text-[#002045] text-sm">📅 Leave Requests</span>
                <button onClick={() => setActiveModal('leave')} className="btn-primary text-xs bg-[#13696a]">
                  + New Leave Request
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
                    <tr>
                      <th className="p-3">Staff</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Dates (Days)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0d1c2e]">
                    {leaveRequests.map(r => (
                      <tr key={r.id} className="hover:bg-[#e5eeff]">
                        <td className="p-3 font-bold text-[#002045]">{staffName(r.employeeId)}</td>
                        <td className="p-3">{r.type}</td>
                        <td className="p-3">{String(r.startDate).slice(0, 10)} to {String(r.endDate).slice(0, 10)} ({calculateDays(r.startDate, r.endDate)}d)</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            r.status === 'PENDING' ? 'bg-orange-100 text-orange-800' : 
                            r.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          {r.status === 'PENDING' && (
                            <>
                              <button onClick={() => updateLeaveStatus(r.id, 'APPROVED')} className="text-green-600 font-bold hover:underline">✓ Approve</button>
                              <button onClick={() => updateLeaveStatus(r.id, 'REJECTED')} className="text-red-600 font-bold hover:underline">✗ Reject</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
              <div className="p-4 border-b border-[#e2e8f0] flex justify-between items-center bg-[#f8f9ff]">
                <span className="font-bold text-[#002045] text-sm">⏱️ Attendance Log</span>
                <button onClick={() => setActiveModal('attendance')} className="btn-primary text-xs bg-[#13696a]">
                  + Log Attendance
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
                    <tr>
                      <th className="p-3">Staff</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Clock In / Out</th>
                      <th className="p-3">Hours</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0d1c2e]">
                    {attendanceLogs.length === 0 ? (
                      <tr><td colSpan={5} className="p-4 text-center text-[#74777f]">No attendance logs found.</td></tr>
                    ) : attendanceLogs.map(log => (
                      <tr key={log.id} className="hover:bg-[#e5eeff]">
                        <td className="p-3 font-bold text-[#002045]">{log.staff}</td>
                        <td className="p-3">{log.date}</td>
                        <td className="p-3 font-mono">{log.clockIn} - {log.clockOut}</td>
                        <td className="p-3">{log.hours}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.status === 'PRESENT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TRAINING */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
            <div className="p-4 border-b border-[#e2e8f0] flex justify-between items-center bg-[#f8f9ff]">
              <span className="font-bold text-[#002045] text-sm">📚 Training & Certification Register</span>
              <button onClick={() => setActiveModal('training')} className="btn-primary text-xs bg-[#13696a]">
                + Log Training
              </button>
            </div>
            
            {/* Alerts section */}
            <div className="p-3 bg-red-50 border-b border-red-100 text-xs">
              <span className="font-bold text-red-800">⚠️ Certification Expiry Alerts:</span> Dr. Amara Okafor's VIA/Cryotherapy Clinical Certification expires in less than 90 days (2026-11-15).
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-[#edf2f7] text-[#43474e] uppercase font-semibold border-b border-[#e2e8f0]">
                <tr>
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">Training / Certification</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Cert</th>
                  <th className="p-3">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0d1c2e]">
                {trainings.map(t => {
                  const isExpiringSoon = t.expiry && new Date(t.expiry).getTime() - new Date().getTime() < 90 * 24 * 60 * 60 * 1000;
                  return (
                    <tr key={t.id} className="hover:bg-[#e5eeff]">
                      <td className="p-3 font-bold text-[#002045]">{t.staff}</td>
                      <td className="p-3">{t.title}</td>
                      <td className="p-3">{t.provider}</td>
                      <td className="p-3">{t.type}</td>
                      <td className="p-3">{t.date}</td>
                      <td className="p-3"><span className="badge-low-risk">{t.cert}</span></td>
                      <td className={`p-3 font-bold ${isExpiringSoon ? 'text-red-600' : 'text-[#22543d]'}`}>{t.expiry || 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ALL MODALS BELOW */}
      
      {/* Existing Modals ... */}
      {activeModal === 'staff' && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
              <h2 className="text-base font-bold text-[#002045]">Add Staff Member</h2>
              <button onClick={() => setActiveModal(null)} className="text-[#74777f] font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div><label className="block font-semibold text-[#0d1c2e] mb-1">First Name *</label><input type="text" required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
              <div><label className="block font-semibold text-[#0d1c2e] mb-1">Last Name *</label><input type="text" required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
              <div><label className="block font-semibold text-[#0d1c2e] mb-1">Work Email *</label><input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
              <div>
                <label className="block font-semibold text-[#0d1c2e] mb-1">Assigned System Role *</label>
                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs">
                  <option value="CLINICIAN">Clinician / Medical Officer</option>
                  <option value="FIELD_OFFICER">Field Outreach Officer</option>
                  <option value="FINANCE">Finance Officer</option>
                  <option value="PROCUREMENT">Procurement Officer</option>
                  <option value="HR">HR Manager</option>
                  <option value="GRANT_MANAGER">Grant & Donor Manager</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">{submitting ? 'Creating...' : 'Create Staff Profile'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'volunteer' && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
              <h2 className="text-base font-bold text-[#002045]">Register Volunteer / Field CHW</h2>
              <button onClick={() => setActiveModal(null)} className="text-[#74777f] font-bold">✕</button>
            </div>
            <form onSubmit={handleRegisterVolunteer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block font-semibold mb-1">First Name *</label><input type="text" required value={volunteerForm.firstName} onChange={e => setVolunteerForm({ ...volunteerForm, firstName: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
                <div><label className="block font-semibold mb-1">Last Name *</label><input type="text" required value={volunteerForm.lastName} onChange={e => setVolunteerForm({ ...volunteerForm, lastName: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
              </div>
              <div>
                <label className="block font-semibold mb-1">LGA *</label>
                <select required value={volunteerForm.lga} onChange={e => setVolunteerForm({ ...volunteerForm, lga: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs font-bold text-[#002045]">
                  <option value="">-- Select LGA --</option>{PLATEAU_LGAS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div><label className="block font-semibold mb-1">Ward Name</label><input type="text" value={volunteerForm.ward} onChange={e => setVolunteerForm({ ...volunteerForm, ward: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
              <div><label className="block font-semibold mb-1">Address</label><input type="text" value={volunteerForm.address} onChange={e => setVolunteerForm({ ...volunteerForm, address: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block font-semibold mb-1">Phone</label><input type="tel" value={volunteerForm.phone} onChange={e => setVolunteerForm({ ...volunteerForm, phone: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs" /></div>
                <div><label className="block font-semibold mb-1">Stipend (₦)</label><input type="number" value={volunteerForm.stipend} onChange={e => setVolunteerForm({ ...volunteerForm, stipend: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2 text-xs font-mono" /></div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs bg-amber-700 hover:bg-amber-800 disabled:opacity-50">Register Volunteer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Modals */}
      {activeModal === 'job' && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <h2 className="text-base font-bold text-[#002045]">Post Job Opening</h2>
            <form onSubmit={handlePostJob} className="space-y-3 text-xs">
              <div><label className="block font-semibold mb-1">Job Title *</label><input type="text" required value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              <div><label className="block font-semibold mb-1">Department</label>
                <select value={jobForm.dept} onChange={e => setJobForm({ ...jobForm, dept: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2">
                  {['Clinical', 'Finance', 'Procurement', 'HR', 'Grants', 'Projects', 'Inventory', 'Administration', 'Field Operations'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div><label className="block font-semibold mb-1">Employment Type</label>
                <select value={jobForm.type} onChange={e => setJobForm({ ...jobForm, type: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2">
                  {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VOLUNTEER'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div><label className="block font-semibold mb-1">Location / LGA</label><input type="text" value={jobForm.location} onChange={e => setJobForm({ ...jobForm, location: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              <div><label className="block font-semibold mb-1">Required Qualifications</label><textarea value={jobForm.qualifications} onChange={e => setJobForm({ ...jobForm, qualifications: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" rows={3}></textarea></div>
              <div><label className="block font-semibold mb-1">Application Deadline</label><input type="date" value={jobForm.deadline} onChange={e => setJobForm({ ...jobForm, deadline: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Post Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'applicant' && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <h2 className="text-base font-bold text-[#002045]">Add Applicant</h2>
            <form onSubmit={handleAddApplicant} className="space-y-3 text-xs">
              <div><label className="block font-semibold mb-1">Full Name *</label><input type="text" required value={applicantForm.name} onChange={e => setApplicantForm({ ...applicantForm, name: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              <div><label className="block font-semibold mb-1">Email *</label><input type="email" required value={applicantForm.email} onChange={e => setApplicantForm({ ...applicantForm, email: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              <div><label className="block font-semibold mb-1">Phone</label><input type="tel" value={applicantForm.phone} onChange={e => setApplicantForm({ ...applicantForm, phone: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              <div><label className="block font-semibold mb-1">Years Experience</label><input type="number" value={applicantForm.experience} onChange={e => setApplicantForm({ ...applicantForm, experience: parseInt(e.target.value) })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              <div><label className="block font-semibold mb-1">Current Employer</label><input type="text" value={applicantForm.currentEmployer} onChange={e => setApplicantForm({ ...applicantForm, currentEmployer: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Add Applicant</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'interview' && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <h2 className="text-base font-bold text-[#002045]">Schedule Interview</h2>
            <form onSubmit={(e) => { e.preventDefault(); setActiveModal(null); }} className="space-y-3 text-xs">
              <div><label className="block font-semibold mb-1">Date</label><input type="date" required value={interviewForm.date} onChange={e => setInterviewForm({ ...interviewForm, date: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              <div><label className="block font-semibold mb-1">Time</label><input type="time" required value={interviewForm.time} onChange={e => setInterviewForm({ ...interviewForm, time: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              <div><label className="block font-semibold mb-1">Mode</label>
                <select value={interviewForm.mode} onChange={e => setInterviewForm({ ...interviewForm, mode: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2">
                  <option value="IN_PERSON">In Person</option>
                  <option value="VIDEO">Video Call</option>
                </select>
              </div>
              <div><label className="block font-semibold mb-1">Interviewer Name</label><input type="text" required value={interviewForm.interviewer} onChange={e => setInterviewForm({ ...interviewForm, interviewer: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'offer' && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <h2 className="text-base font-bold text-[#002045]">Offer Letter Generated</h2>
            <div className="bg-slate-50 p-4 border border-slate-200 rounded text-xs font-mono whitespace-pre-wrap">
              Dear Applicant,
              
              We are pleased to offer you the position of {selectedJob?.title} at GCOMS. 
              Please review the attached terms and reply within 7 days.
              
              Sincerely,
              HR Department, GCOMS
            </div>
            <div className="flex justify-end pt-2 border-t border-[#e2e8f0]">
              <button onClick={() => setActiveModal(null)} className="btn-primary text-xs">Send Offer</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'leave' && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <h2 className="text-base font-bold text-[#002045]">New Leave Request</h2>
            <form onSubmit={handleLeaveRequest} className="space-y-3 text-xs">
              <div><label className="block font-semibold mb-1">Staff Member *</label>
                <select required value={leaveForm.staffId} onChange={e => setLeaveForm({ ...leaveForm, staffId: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2">
                  <option value="">-- Select Staff --</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} - {s.role}</option>)}
                </select>
              </div>
              <div><label className="block font-semibold mb-1">Leave Type</label>
                <select value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2">
                  {['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'COMPASSIONATE', 'STUDY', 'UNPAID'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block font-semibold mb-1">Start Date</label><input type="date" required value={leaveForm.start} onChange={e => setLeaveForm({ ...leaveForm, start: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
                <div><label className="block font-semibold mb-1">End Date</label><input type="date" required value={leaveForm.end} onChange={e => setLeaveForm({ ...leaveForm, end: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              </div>
              <div><label className="block font-semibold mb-1">Days Requested (Auto-calculated)</label><input type="number" readOnly value={calculateDays(leaveForm.start, leaveForm.end)} className="w-full bg-gray-100 border border-[#e2e8f0] rounded px-3 py-2" /></div>
              <div><label className="block font-semibold mb-1">Reason / Medical Note</label><textarea value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" rows={3}></textarea></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'attendance' && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <h2 className="text-base font-bold text-[#002045]">Log Attendance</h2>
            <form onSubmit={handleLogAttendance} className="space-y-3 text-xs">
              <div><label className="block font-semibold mb-1">Staff Member *</label>
                <select required value={attendanceForm.staffId} onChange={e => setAttendanceForm({ ...attendanceForm, staffId: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2">
                  <option value="">-- Select Staff --</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>
              </div>
              <div><label className="block font-semibold mb-1">Date</label><input type="date" required value={attendanceForm.date} onChange={e => setAttendanceForm({ ...attendanceForm, date: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block font-semibold mb-1">Clock In</label><input type="time" required value={attendanceForm.clockIn} onChange={e => setAttendanceForm({ ...attendanceForm, clockIn: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
                <div><label className="block font-semibold mb-1">Clock Out</label><input type="time" required value={attendanceForm.clockOut} onChange={e => setAttendanceForm({ ...attendanceForm, clockOut: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              </div>
              <div><label className="block font-semibold mb-1">Notes</label><input type="text" value={attendanceForm.notes} onChange={e => setAttendanceForm({ ...attendanceForm, notes: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'performance' && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <h2 className="text-base font-bold text-[#002045]">New Performance Review</h2>
            <form onSubmit={handlePerformanceReview} className="space-y-3 text-xs">
              <div><label className="block font-semibold mb-1">Staff Member *</label>
                <select required value={performanceForm.staffId} onChange={e => setPerformanceForm({ ...performanceForm, staffId: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2">
                  <option value="">-- Select Staff --</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>
              </div>
              <div><label className="block font-semibold mb-1">Review Period</label>
                <select value={performanceForm.period} onChange={e => setPerformanceForm({ ...performanceForm, period: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2">
                  {['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', 'Annual 2026'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div><label className="block font-semibold mb-1">Performance Rating</label>
                <select value={performanceForm.rating} onChange={e => setPerformanceForm({ ...performanceForm, rating: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2">
                  {['EXCEPTIONAL', 'MEETS_EXPECTATIONS', 'NEEDS_IMPROVEMENT', 'UNSATISFACTORY'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div><label className="block font-semibold mb-1">Key Achievements</label><textarea value={performanceForm.achievements} onChange={e => setPerformanceForm({ ...performanceForm, achievements: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" rows={2}></textarea></div>
              <div><label className="block font-semibold mb-1">Areas for Development</label><textarea value={performanceForm.development} onChange={e => setPerformanceForm({ ...performanceForm, development: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" rows={2}></textarea></div>
              <div><label className="block font-semibold mb-1">Reviewer Comments</label><textarea value={performanceForm.comments} onChange={e => setPerformanceForm({ ...performanceForm, comments: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" rows={2}></textarea></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'training' && (
        <div className="fixed inset-0 bg-[#002045]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-[#e2e8f0] space-y-4">
            <h2 className="text-base font-bold text-[#002045]">Log Training</h2>
            <form onSubmit={handleLogTraining} className="space-y-3 text-xs">
              <div><label className="block font-semibold mb-1">Staff Member *</label>
                <select required value={trainingForm.staffId} onChange={e => setTrainingForm({ ...trainingForm, staffId: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2">
                  <option value="">-- Select Staff --</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>
              </div>
              <div><label className="block font-semibold mb-1">Training Title *</label><input type="text" required value={trainingForm.title} onChange={e => setTrainingForm({ ...trainingForm, title: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              <div><label className="block font-semibold mb-1">Training Provider / Facilitator</label><input type="text" value={trainingForm.provider} onChange={e => setTrainingForm({ ...trainingForm, provider: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              <div><label className="block font-semibold mb-1">Training Type</label>
                <select value={trainingForm.type} onChange={e => setTrainingForm({ ...trainingForm, type: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2">
                  {['CLINICAL_SKILLS', 'LEADERSHIP', 'COMPLIANCE', 'IT_SYSTEMS', 'HEALTH_SAFETY', 'GRANTS_MANAGEMENT', 'PROCUREMENT'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="block font-semibold mb-1">Date Attended</label><input type="date" required value={trainingForm.date} onChange={e => setTrainingForm({ ...trainingForm, date: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              <div><label className="block font-semibold mb-1">Certification Obtained</label>
                <select value={trainingForm.cert} onChange={e => setTrainingForm({ ...trainingForm, cert: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2">
                  {['YES', 'NO', 'PENDING'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {trainingForm.cert === 'YES' && (
                <div><label className="block font-semibold mb-1">Expiry Date</label><input type="date" value={trainingForm.expiry} onChange={e => setTrainingForm({ ...trainingForm, expiry: e.target.value })} className="w-full bg-white border border-[#e2e8f0] rounded px-3 py-2" /></div>
              )}
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button type="button" onClick={() => setActiveModal(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Log Training</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewReview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <h3 className="text-sm font-bold text-[#002045] mb-4">Performance Review — {viewReview.staff || viewReview.staffName}</h3>
            <div className="space-y-2 text-xs">
              <div><span className="font-semibold">Review Period:</span> {viewReview.period}</div>
              <div><span className="font-semibold">Rating:</span> <span className={`px-2 py-0.5 rounded font-bold ${scoreToRating(viewReview.score) === 'EXCEPTIONAL' ? 'bg-green-100 text-green-800' : scoreToRating(viewReview.score) === 'NEEDS_IMPROVEMENT' ? 'bg-orange-100 text-orange-800' : scoreToRating(viewReview.score) === 'UNSATISFACTORY' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{scoreToRating(viewReview.score)}</span></div>
              <div><span className="font-semibold">Key Achievements:</span><p className="mt-1 text-gray-600 whitespace-pre-wrap">{viewReview.achievements}</p></div>
              <div><span className="font-semibold">Areas for Development:</span><p className="mt-1 text-gray-600 whitespace-pre-wrap">{viewReview.development}</p></div>
              <div><span className="font-semibold">Reviewer Comments:</span><p className="mt-1 text-gray-600 whitespace-pre-wrap">{viewReview.comments}</p></div>
            </div>
            <button className="btn-secondary mt-4" onClick={() => setViewReview(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
