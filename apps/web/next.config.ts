import type { NextConfig } from "next";
// @ts-expect-error: next-pwa doesn't have proper typescript definitions
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/**
 * The Content-Security-Policy is not here. It carries a per-request nonce now,
 * which a static header cannot express, so it is built in `src/proxy.ts`.
 *
 * Note that it must live in exactly one of the two places: a response carrying
 * two CSP headers is held to both, and the intersection of a nonce policy and a
 * static one is not what either was written to mean.
 *
 * The headers below are fixed values, so they stay.
 */
const securityHeaders = [
  // proxy.ts sets frame-ancestors, which supersedes this for modern browsers;
  // kept for old ones.
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
