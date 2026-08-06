import type { NextConfig } from "next";
// @ts-expect-error: next-pwa doesn't have proper typescript definitions
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy.
 *
 * `connect-src` is the directive that matters most here: the JWT lives in
 * localStorage, so if a script injection ever lands, this is what stops the
 * token being posted to an attacker's host. It is pinned to this app's own
 * origin and the API.
 *
 * script-src still needs 'unsafe-inline' because Next injects inline bootstrap
 * and hydration scripts, and eliminating that requires generating a per-request
 * nonce in middleware and threading it through the document. That is worth
 * doing, but it changes how every page renders and this app currently has no
 * frontend tests to catch a regression — so it is deliberately left as a
 * follow-up rather than bundled in here.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // globals.css imports Inter from Google Fonts. Without these the stylesheet is
  // blocked and the whole app silently falls back to a system font — caught only
  // by loading a page in a real browser.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  `connect-src 'self' ${apiOrigin}${isDev ? " ws: http://localhost:*" : ""}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Only when the API is already HTTPS. Otherwise this silently rewrites an
  // http:// API origin to https:// and every request fails — which is exactly
  // what happens if someone runs `next start` against a local API.
  ...(!isDev && apiOrigin.startsWith("https://")
    ? ["upgrade-insecure-requests"]
    : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // frame-ancestors above supersedes this for modern browsers; kept for old ones.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Geolocation stays enabled: the volunteer intake form captures GPS
    // coordinates for outreach registrations.
    value: "camera=(), microphone=(), payment=(), geolocation=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withPWA(nextConfig);
