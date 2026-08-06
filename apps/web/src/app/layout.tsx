import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] font-sans text-[var(--on-background)]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
