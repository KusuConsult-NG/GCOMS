import type { NextConfig } from "next";
// @ts-expect-error: next-pwa doesn't have proper typescript definitions
import withPWAInit from "next-pwa";

const staticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

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

/**
 * Two builds out of one tree.
 *
 * The default is the Next server the app was written for: middleware sets a
 * nonced CSP, `headers()` sets the five fixed security headers, and every route
 * renders per request.
 *
 * `NEXT_PUBLIC_STATIC_EXPORT=true` produces a directory of files for a host
 * that runs nothing — GitHub Pages. `headers()` is not merely ignored there,
 * it is unimplementable: the host decides the response headers and it does not
 * offer a way to add any. So that build loses X-Frame-Options, nosniff,
 * Referrer-Policy, Permissions-Policy and HSTS outright, and its CSP moves into
 * a meta tag without a nonce. This is written down here, in the README and in
 * lib/csp.ts because it is the sort of thing that is invisible once it works.
 *
 * `trailingSlash` is not cosmetic: without it the export writes `login.html`,
 * which a file host serves at `/login.html` and 404s at `/login`. With it the
 * output is `login/index.html` and the app's own hrefs resolve.
 */
const nextConfig: NextConfig = staticExport
  ? {
      output: "export",
      trailingSlash: true,
      // A GitHub Pages project site is served from /<repo>, not the domain root.
      ...(basePath ? { basePath, assetPrefix: basePath } : {}),
      // The optimiser is a server route. Without one, next/image has to emit
      // the source file unchanged or the four <Image> usages render nothing.
      images: { unoptimized: true },
    }
  : {
      async headers() {
        return [{ source: "/:path*", headers: securityHeaders }];
      },
    };

export default withPWA(nextConfig);
