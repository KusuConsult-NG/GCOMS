'use client';

import React, { useState } from 'react';

export default function MobilePreviewPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'dashboard' | 'patients' | 'navigation' | 'screening' | 'outreach'>('dashboard');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="flex items-center space-x-3">
          <span className="px-2.5 py-1 rounded-md bg-pink-100 text-pink-700 text-xs font-bold uppercase tracking-wider">
            PRD Preview
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900">GCOMS Mobile App Simulator</h1>
        </div>
        <p className="text-slate-500 mt-1">
          Interactive preview of the 6 core mobile application screens for field officers, volunteers, and clinicians.
        </p>
      </div>

      {/* Screen Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {[
          { id: 'login', label: '1. Login Screen' },
          { id: 'dashboard', label: '2. Mobile Dashboard' },
          { id: 'patients', label: '3. Patients List' },
          { id: 'navigation', label: '4. Patient Navigation' },
          { id: 'screening', label: '5. Screening Form' },
          { id: 'outreach', label: '6. Upload Outreach' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Parameters<typeof setActiveTab>[0])}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile Device Mockup Frame */}
      <div className="flex justify-center py-6">
        <div className="w-[380px] h-[720px] bg-slate-900 rounded-[48px] p-4 shadow-2xl border-4 border-slate-800 relative flex flex-col">
          {/* Top Notch & Camera */}
          <div className="w-36 h-5 bg-slate-950 rounded-b-2xl mx-auto mb-2 flex items-center justify-center space-x-2 z-20">
            <div className="w-3 h-3 rounded-full bg-slate-800"></div>
            <div className="w-2 h-2 rounded-full bg-blue-900"></div>
          </div>

          {/* Mobile Screen Body */}
          <div className="flex-1 bg-slate-50 rounded-[36px] overflow-hidden flex flex-col relative text-slate-900">
            {/* Mobile Header Bar */}
            <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center text-xs">
              <span className="font-semibold text-teal-400">GCOMS Mobile</span>
              <span className="text-[10px] text-slate-400">9:41 AM</span>
            </div>

            {/* Screen Content Switcher */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {activeTab === 'login' && (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg mb-4">
                    GDP
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">GCOMS</h2>
                  <p className="text-xs text-slate-500 mb-6">Georgel Digital Platform</p>
                  <div className="w-full space-y-3">
                    <input
                      type="text"
                      placeholder="Email Address"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      defaultValue="••••••••"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md">
                      Log In
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'dashboard' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white p-4 rounded-2xl shadow-sm">
                    <p className="text-xs text-teal-200">Welcome Back,</p>
                    <h3 className="text-lg font-bold">Hello, Retsum </h3>
                    <p className="text-[11px] text-teal-100 mt-1">Field Officer • Barkin Ladi</p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-800 mb-2">Upcoming Outreach</h4>
                    <div className="bg-pink-50 border border-pink-100 p-3 rounded-xl">
                      <p className="text-xs font-bold text-pink-700">Breast Cancer Awareness</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Barkin Ladi LGA • Community Center</p>
                      <p className="text-[10px] text-pink-600 font-semibold mt-2">May 30, 2025 • 09:00 AM</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
                      <div className="text-xl font-extrabold text-teal-600">462</div>
                      <div className="text-[10px] text-slate-500">Screenings</div>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
                      <div className="text-xl font-extrabold text-purple-600">184</div>
                      <div className="text-[10px] text-slate-500">Under Navigation</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'patients' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Patients Directory</h3>
                  {[
                    { name: 'Mary D. Luka', stage: 'Stage 2 • Breast Cancer', status: 'Navigation Active' },
                    { name: 'John P. Sunday', stage: 'Stage 1 • Cervical Cancer', status: 'Screened Normal' },
                    { name: 'Grace D. Daniel', stage: 'Pending Results', status: 'Follow-up Due' },
                  ].map((p, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{p.name}</p>
                        <p className="text-[10px] text-slate-500">{p.stage}</p>
                      </div>
                      <span className="text-[9px] font-semibold bg-teal-50 text-teal-700 px-2 py-1 rounded-lg">
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'navigation' && (
                <div className="space-y-4">
                  <div className="bg-purple-600 text-white p-4 rounded-2xl">
                    <h3 className="text-sm font-bold">Mary D. Luka</h3>
                    <p className="text-xs text-purple-200">Stage 2 • Breast Cancer</p>
                    <div className="mt-3 pt-2 border-t border-purple-500 text-[11px]">
                      <p className="font-medium">Next Appointment:</p>
                      <p className="text-purple-100">May 30, 2025 • JUTH Oncology</p>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800">Navigation Timeline</h4>
                  <div className="space-y-3 pl-2 border-l-2 border-purple-200">
                    <div className="relative pl-4">
                      <div className="w-2.5 h-2.5 bg-purple-600 rounded-full absolute -left-[5px] top-1"></div>
                      <p className="text-xs font-bold text-slate-800">Diagnosis</p>
                      <p className="text-[10px] text-slate-500">May 10, 2025 • JUTH Oncology Unit</p>
                    </div>
                    <div className="relative pl-4">
                      <div className="w-2.5 h-2.5 bg-purple-400 rounded-full absolute -left-[5px] top-1"></div>
                      <p className="text-xs font-bold text-slate-800">Treatment Plan</p>
                      <p className="text-[10px] text-slate-500">May 18, 2025 • Multidisciplinary Team</p>
                    </div>
                    <div className="relative pl-4">
                      <div className="w-2.5 h-2.5 bg-slate-300 rounded-full absolute -left-[5px] top-1"></div>
                      <p className="text-xs font-bold text-slate-400">Scheduled Follow-up</p>
                      <p className="text-[10px] text-slate-400">May 30, 2025</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'screening' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Screening Form</h3>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Type of Screening</label>
                    <select className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
                      <option>Breast Cancer</option>
                      <option>Cervical Cancer</option>
                      <option>Prostate Cancer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Test Result</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button className="bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold py-2 rounded-xl">Normal</button>
                      <button className="bg-white border border-slate-200 text-slate-600 text-xs font-semibold py-2 rounded-xl">Abnormal</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Referral Needed?</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button className="bg-white border border-slate-200 text-slate-600 text-xs font-semibold py-2 rounded-xl">No</button>
                      <button className="bg-pink-500 text-white text-xs font-bold py-2 rounded-xl shadow">Yes</button>
                    </div>
                  </div>
                  <button className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl shadow mt-2">
                    Save Screening
                  </button>
                </div>
              )}

              {activeTab === 'outreach' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Upload Outreach</h3>
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center bg-white">
                    <p className="text-xs font-semibold text-slate-600">Add Photos</p>
                    <p className="text-[10px] text-slate-400 mt-1">Tap to select outreach imagery</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Total Attendance</label>
                    <input
                      type="number"
                      defaultValue={120}
                      className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                    />
                  </div>
                  <button className="w-full bg-teal-600 text-white text-xs font-bold py-2.5 rounded-xl shadow mt-2">
                    Save & Submit
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="bg-white border-t border-slate-200 px-4 py-2 flex justify-around items-center text-[10px] font-medium text-slate-500">
              <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-teal-600 font-bold' : ''}>Home</button>
              <button onClick={() => setActiveTab('patients')} className={activeTab === 'patients' ? 'text-teal-600 font-bold' : ''}>Patients</button>
              <button onClick={() => setActiveTab('screening')} className={activeTab === 'screening' ? 'text-teal-600 font-bold' : ''}>Screening</button>
              <button onClick={() => setActiveTab('outreach')} className={activeTab === 'outreach' ? 'text-teal-600 font-bold' : ''}>Outreach</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
