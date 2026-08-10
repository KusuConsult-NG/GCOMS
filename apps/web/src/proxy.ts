import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildCsp } from '@/lib/csp';

/**
 * Per-request CSP nonce.
 *
 * This is the follow-up next.config.ts described: script-src used to carry
 * 'unsafe-inline', which is the directive that makes an injected <script>
 * execute. connect-src already stopped a successful injection from posting the
 * JWT anywhere useful, but stopping the injection from running at all is the
 * part that was missing.
 *
 * Next attaches the nonce to its own bootstrap and hydration scripts by parsing
 * it out of this header during render, so nothing has to be threaded through
 * the document by hand. It only works for dynamically rendered pages — a page
 * prerendered at build time has no request to draw a nonce from — which is why
 * the root layout reads `headers()`. That costs this app very little: 43 of its
 * 44 components are 'use client' and fetch from the API after hydration, so the
 * prerendered output was an empty shell either way.
 *
 * None of this runs in a static export, which has no server. That build gets a
 * weaker policy in a meta tag instead; the directives themselves live in
 * `lib/csp.ts` so the two cannot drift.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp({
    nonce,
    isDev: process.env.NODE_ENV === 'development',
    apiOrigin: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Static assets serve no scripts of their own and are the hot path, so
      // they skip this. Prefetches are excluded for the same reason: the nonce
      // in a prefetched payload would not match the document that later uses it.
      source: '/((?!_next/static|_next/image|favicon.ico|sw.js|workbox-.*).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
