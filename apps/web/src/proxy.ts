import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
 * the root layout sets `dynamic = 'force-dynamic'`. That costs this app very
 * little: 43 of its 44 components are 'use client' and fetch from the API after
 * hydration, so the prerendered output was an empty shell either way.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const csp = [
    "default-src 'self'",
    // 'strict-dynamic' makes browsers that understand it ignore 'self' and the
    // host list, trusting only this nonce and whatever the nonced scripts load
    // themselves. 'self' stays for older browsers, which ignore strict-dynamic.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    // Styles keep 'unsafe-inline'. A nonce does not cover inline style
    // *attributes*, and React writes those for every `style={{ ... }}` in the
    // tree, so nonce-only style-src would drop styling rather than tighten it.
    // The XSS value here is small next to script-src: the injection has to run
    // before it can write a style attribute.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    `connect-src 'self' ${apiOrigin}${isDev ? ' ws: http://localhost:*' : ''}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Only when the API is already HTTPS. Otherwise this silently rewrites an
    // http:// API origin to https:// and every request fails — which is exactly
    // what happens if someone runs `next start` against a local API.
    ...(!isDev && apiOrigin.startsWith('https://')
      ? ['upgrade-insecure-requests']
      : []),
  ].join('; ');

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
