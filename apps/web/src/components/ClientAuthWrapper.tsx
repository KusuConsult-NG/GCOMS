'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export function ClientAuthWrapper({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const router = useRouter();

  /**
   * Don't decide anything on the first render.
   *
   * The store is server-rendered with a null token and restored from
   * localStorage on the client, so `token` is briefly null even for a signed-in
   * user. The previous version set `mounted` and redirected in the same effect,
   * which could bounce someone to the login screen on a refresh or a direct URL
   * visit — indistinguishable from being randomly logged out.
   *
   * Deferring by a tick lets the restore land first. (zustand 5.0.14 does not
   * expose the `persist.onFinishHydration` API here, so this does not depend
   * on it.)
   */
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSettled(true), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (settled && !token) {
      router.replace('/login');
    }
  }, [settled, token, router]);

  if (!settled || !token) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-[var(--muted)]">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
