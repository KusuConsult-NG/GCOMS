import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { buildCsp } from "@/lib/csp";
import { apiOrigin, basePath, isStaticExport } from "@/lib/deployment";

export const metadata: Metadata = {
  title: "GCOMS | GEORGEL Digital Platform",
  description: "Offline-first Progressive Web Application for cancer outreach and healthcare operations",
  // basePath is applied by hand: a GitHub Pages project site serves the app
  // from /<repo>, and a root-absolute path would resolve to the domain root.
  manifest: `${basePath}/manifest.json`,
  icons: {
    icon: [
      { url: `${basePath}/icon-192x192.png`, sizes: "192x192", type: "image/png" },
      { url: `${basePath}/icon-512x512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: `${basePath}/icon-192x192.png`,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GCOMS",
  },
};

/**
 * Applies the stored theme before first paint. Without this the page renders
 * light, then flips to dark once React hydrates — a flash on every load for
 * anyone using dark mode. suppressHydrationWarning covers the class this adds
 * to <html> before React sees it.
 */
const themeBootstrap = `
try {
  var t = localStorage.getItem('gcoms-theme');
  if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  if (t === 'dark') document.documentElement.classList.add('dark');
} catch (e) {}
`;

/**
 * The nonce, and the reason this layout is async.
 *
 * Next nonces the scripts it emits itself, but the theme bootstrap above is
 * ours, so it has to be tagged by hand or the CSP drops it — and the flash it
 * exists to prevent comes back. Reading the request here is also what opts
 * every route beneath this layout into dynamic rendering, which is what makes a
 * nonce possible at all: a page prerendered at build time has no request to
 * take one from.
 *
 * A static export has no request at any point, so calling `headers()` there is
 * not merely useless — it is the one thing in this tree that would fail the
 * export outright. The branch is a build-time constant (`NEXT_PUBLIC_*` is
 * inlined), so the server build keeps the nonce and the export never reaches
 * the call.
 */
async function requestNonce(): Promise<string | undefined> {
  if (isStaticExport) return undefined;
  return (await headers()).get("x-nonce") ?? undefined;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = await requestNonce();

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/*
          * The static export's only way to carry a CSP: no server, so no
          * response header. Weaker than the nonce policy — see lib/csp.ts —
          * and deliberately absent from the server build, where a second
          * policy would be intersected with the real one rather than
          * replacing it.
          */}
        {isStaticExport && (
          <meta
            httpEquiv="Content-Security-Policy"
            content={buildCsp({
              isDev: process.env.NODE_ENV === "development",
              apiOrigin,
              forMetaTag: true,
            })}
          />
        )}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] font-sans text-[var(--on-background)]">
        <ServiceWorkerRegistration />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
