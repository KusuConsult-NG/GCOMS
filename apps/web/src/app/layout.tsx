import type { Metadata } from "next";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 font-sans text-slate-900">
        {children}
      </body>
    </html>
  );
}

