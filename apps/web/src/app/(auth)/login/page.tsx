'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      const response = await api.post('/auth/login', {
        email: cleanEmail,
        password: cleanPassword,
      });
      setAuth(response.data.user, response.data.access_token);
      router.push('/');
    } catch (err: any) {
      console.error('Login authentication error:', err);
      const msg = err.response?.data?.message || err.message;
      if (err.response?.status === 401) {
        setError('Invalid email or password. Please check your credentials.');
      } else {
        setError(typeof msg === 'string' ? msg : 'Unable to connect to authentication server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff] p-4 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-[#e2e8f0]">

        {/* Official Logo Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-full h-24 mb-3 flex items-center justify-center p-2 bg-white rounded border border-[#e2e8f0]">
            <img
              src="/georgel-logo.png"
              alt="Georgel Cancer Foundation Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-[#002045] tracking-tight">GCOMS</h1>
          <p className="text-[#13696a] font-semibold text-xs mt-0.5">Clinical Trust Management System — GCOMS</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#93000a] p-3 rounded text-xs text-center font-medium mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-[#0d1c2e] mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#e2e8f0] rounded focus:border-[#13696a] focus:ring-2 focus:ring-[#13696a]/20 text-[#0d1c2e] outline-none text-xs"
              placeholder="e.g. executive@gcoms.org"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0d1c2e] mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#e2e8f0] rounded focus:border-[#13696a] focus:ring-2 focus:ring-[#13696a]/20 text-[#0d1c2e] outline-none text-xs pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#13696a] hover:text-[#002045] focus:outline-none transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.048 10.048 0 012.122-.163c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-4.092-4.092a3 3 0 11-4.243-4.243m4.243 4.243L3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#13696a] hover:bg-[#0f5455] text-white font-semibold text-xs rounded shadow-sm transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to GCOMS'}
          </button>
        </form>

        {/* Fast-Fill Demo Shortcuts */}
        <div className="mt-6 pt-5 border-t border-[#e2e8f0] text-center">
          <p className="text-[11px] text-[#74777f] font-medium mb-2">Select a Demo Account to Fast-Fill:</p>
          <div className="flex flex-wrap justify-center gap-1.5 text-[10px]">
            <button
              onClick={() => handleDemoLogin('executive@gcoms.org')}
              className="px-2 py-1 bg-[#e5eeff] text-[#002045] font-semibold rounded hover:bg-[#dce9ff]"
            >
              Executive
            </button>
            <button
              onClick={() => handleDemoLogin('admin@gcoms.org')}
              className="px-2 py-1 bg-slate-100 text-slate-700 font-semibold rounded hover:bg-slate-200"
            >
              Admin
            </button>
            <button
              onClick={() => handleDemoLogin('clinician@gcoms.org')}
              className="px-2 py-1 bg-[#a2eded]/30 text-[#13696a] font-semibold rounded hover:bg-[#a2eded]/50"
            >
              Clinician
            </button>
            <button
              onClick={() => handleDemoLogin('volunteer@gcoms.org')}
              className="px-2 py-1 bg-pink-100 text-pink-700 font-semibold rounded hover:bg-pink-200"
            >
              Volunteer
            </button>
            <button
              onClick={() => handleDemoLogin('finance@gcoms.org')}
              className="px-2 py-1 bg-purple-100 text-purple-700 font-semibold rounded hover:bg-purple-200"
            >
              Finance
            </button>
            <button
              onClick={() => handleDemoLogin('procurement@gcoms.org')}
              className="px-2 py-1 bg-orange-100 text-orange-700 font-semibold rounded hover:bg-orange-200"
            >
              Procurement
            </button>
            <button
              onClick={() => handleDemoLogin('grant_manager@gcoms.org')}
              className="px-2 py-1 bg-yellow-100 text-yellow-700 font-semibold rounded hover:bg-yellow-200"
            >
              Grants
            </button>
            <button
              onClick={() => handleDemoLogin('project_manager@gcoms.org')}
              className="px-2 py-1 bg-indigo-100 text-indigo-700 font-semibold rounded hover:bg-indigo-200"
            >
              Projects
            </button>
            <button
              onClick={() => handleDemoLogin('inventory_manager@gcoms.org')}
              className="px-2 py-1 bg-blue-100 text-blue-700 font-semibold rounded hover:bg-blue-200"
            >
              Inventory
            </button>
            <button
              onClick={() => handleDemoLogin('hr@gcoms.org')}
              className="px-2 py-1 bg-amber-100 text-amber-700 font-semibold rounded hover:bg-amber-200"
            >
              HR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
