/**
 * Which of the two deployment shapes this build is.
 *
 * The app normally runs as a Next server (`next start`), where `proxy.ts`
 * attaches a per-request CSP nonce and `next.config.ts` sets the security
 * headers. That is the deployment the security work in this repository was
 * written for and it stays the default.
 *
 * The other shape is a static export served by a file host — GitHub Pages —
 * which runs no server code and cannot set response headers. It is selected by
 * `NEXT_PUBLIC_STATIC_EXPORT=true` at build time. What that costs is written
 * down in `csp.ts` and in the README; the short version is the nonce and the
 * five header-only protections.
 *
 * These are read through `process.env` rather than passed around because Next
 * inlines `NEXT_PUBLIC_*` at build time, so they are constants in the bundle
 * and the dead branch is eliminated.
 */

/** True when this build is a static export with no server behind it. */
export const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';

/**
 * Sub-path the site is served from, without a trailing slash. A GitHub Pages
 * project site lives at `/<repo>`, so every absolute URL the app emits by hand
 * needs it. Empty for a root deployment, which is every other case.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/**
 * Where the API lives. The static export has no server to proxy through, so
 * this is a cross-origin URL in the browser and the API must allow the site's
 * origin in ALLOWED_ORIGINS — see the deployment section of the README.
 */
export const apiOrigin =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Resolves a file in `public/` against the deployment's base path.
 *
 * `next/image` does not do this for you. Next rewrites the URLs *it* generates
 * — script tags, stylesheets, the `/_next/image` optimiser route — but the
 * `src` you hand an `<Image>` is passed through as written, and with
 * `images.unoptimized` (which a static export requires) there is no optimiser
 * URL to be rewritten either. So `/georgel-logo.png` stayed `/georgel-logo.png`
 * and 404'd on every page of a project-site deployment: the file is at
 * `/GCOMS/georgel-logo.png`.
 *
 * A no-op for a root deployment, which is why nothing caught this until the
 * export was served from a sub-path.
 */
export function assetPath(path: string): string {
  return `${basePath}${path}`;
}

/**
 * The foundation's mark, resolved.
 *
 * The ribbon rather than the full logo, because every placement in this app is
 * a small square — 32 to 40 pixels, in the sidebar, the topbar and two field
 * headers. georgel-logo.png is a wide horizontal lockup on a white field:
 * `object-contain` inside a 40px square renders it about ten pixels tall, which
 * is a white chip with a grey smudge in it. It read as a missing image because
 * it may as well have been one.
 *
 * This is the same file the manifest uses for the app icon, so the mark in the
 * sidebar and the icon on the home screen are the one image. The full lockup
 * stays in `public/` — `npm run icons` derives this from it.
 */
export const MARK_SRC = assetPath('/icon-192x192.png');
