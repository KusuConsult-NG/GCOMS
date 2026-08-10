'use client';

import { errorMessage, errorStatus } from '@/lib/errors';
import Image from 'next/image';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { LOGO_SRC } from '@/lib/deployment';

function LoginForm() {
  const searchParams = useSearchParams();
  // Set by the api client when a request comes back 401, so an expired session
  // explains itself instead of looking like a random logout.
  const sessionExpired = searchParams.get('expired') === '1';
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
    } catch (err) {
      console.error('Login authentication error:', err);
      const msg = errorMessage(err, 'Sign-in failed.');
      if (errorStatus(err) === 401) {
        setError('Invalid email or password. Please check your credentials.');
      } else {
        setError(typeof msg === 'string' ? msg : 'Unable to connect to authentication server.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Development only. These used to fill in a shared password that was hardcoded
  // here and in prisma/seed.ts; seeded passwords are now generated at seed time,
  // so this fills the email and leaves the password to whoever ran the seed.
  const showDemoAccounts = process.env.NODE_ENV === 'development';

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] bg-[var(--background)] font-sans">
      {/*
        The brand panel keeps the navy-to-teal gradient in both themes rather
        than following the token flip. It is the one surface carrying the
        foundation's identity, and an identity that changes colour with a
        preference is not one.
      */}
      <aside
        className="relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #001733 0%, #002045 45%, #0f5455 100%)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: '#13696a' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full opacity-10 blur-3xl"
          style={{ background: '#a2eded' }}
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/95 p-1.5 shadow-sm">
            <Image
              src={LOGO_SRC}
              alt=""
              width={40}
              height={40}
              className="h-full w-full object-contain"
            />
          </span>
          <span className="text-sm font-semibold tracking-[0.18em] uppercase text-white/80">
            Georgel Cancer Foundation
          </span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-[1.15] tracking-tight">
            Cancer outreach and clinical operations, on one record.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-white/70">
            Screening, patient follow-up, procurement, grants and field intake
            across the seventeen Local Government Areas of Plateau State —
            recorded once, by the person who did the work.
          </p>
        </div>

        <div className="relative">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
            <li>Clinical records</li>
            <li aria-hidden>·</li>
            <li>Outreach &amp; screening</li>
            <li aria-hidden>·</li>
            <li>Grants &amp; procurement</li>
          </ul>
          <p className="mt-6 text-xs text-white/60">
            Authorised users only. Access to patient data is recorded.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          {/* Carries the identity on small screens, where the panel is hidden. */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary-surface)] p-1.5">
              <Image
                src={LOGO_SRC}
                alt=""
                width={36}
                height={36}
                className="h-full w-full object-contain"
              />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Georgel Cancer Foundation
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[var(--on-background)]">
            Sign in
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Use the account issued to you by your administrator.
          </p>

          {sessionExpired && !error && (
            <p
              role="status"
              className="mt-6 rounded-lg border border-[var(--outline)] bg-[var(--risk-mod-bg)] px-4 py-3 text-sm font-medium text-[var(--risk-mod-text)]"
            >
              Your session expired. Please sign in again.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mt-6 rounded-lg border border-[var(--risk-high-text)]/25 bg-[var(--risk-high-bg)] px-4 py-3 text-sm font-medium text-[var(--risk-high-text)]"
            >
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--on-background)]"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[var(--outline)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--on-background)] outline-none transition focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/15"
                placeholder="you@gcoms.org"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--on-background)]"
              >
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[var(--outline)] bg-[var(--surface)] px-4 py-3 pr-12 text-sm text-[var(--on-background)] outline-none transition focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/15"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-[var(--muted)] transition-colors hover:text-[var(--on-background)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.048 10.048 0 012.122-.163c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-4.092-4.092a3 3 0 11-4.243-4.243m4.243 4.243L3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-[var(--on-secondary)] shadow-sm transition hover:bg-[var(--secondary-hover)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--secondary)]/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

      {/* Fast-Fill Demo Shortcuts — development builds only. Fills the email;
          the password comes from whoever ran `npm run db:seed`. */}
      {showDemoAccounts && (
        <>
        <div className="mt-6 pt-5 border-t border-[var(--outline)] text-center">
          <p className="text-[11px] text-[var(--muted)] font-medium mb-2">Select a Demo Account to Fast-Fill:</p>
          <div className="flex flex-wrap justify-center gap-1.5 text-[10px]">
            <button
              onClick={() => handleDemoLogin('executive@gcoms.org')}
              className="px-2 py-1 bg-[var(--primary-surface)] text-[var(--primary)] font-semibold rounded hover:bg-[var(--primary-surface)]"
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
              className="px-2 py-1 bg-[var(--secondary-container)]/30 text-[var(--secondary)] font-semibold rounded hover:bg-[var(--secondary-container)]/50"
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
        </>
      )}

          <p className="mt-10 text-xs text-[var(--muted)] lg:hidden">
            Authorised users only. Access to patient data is recorded.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
