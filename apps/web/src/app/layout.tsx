import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "GCOMS | GEORGEL Digital Platform",
  description: "Offline-first Progressive Web Application for cancer outreach and healthcare operations",
  manifest: "/manifest.json",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Next nonces the scripts it emits itself, but this one is ours, so it has to
  // be tagged by hand or the CSP drops it — and the flash it exists to prevent
  // comes back. Reading the request here is also what opts every route beneath
  // this layout into dynamic rendering, which is what makes a nonce possible at
  // all: a page prerendered at build time has no request to take one from.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] font-sans text-[var(--on-background)]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
