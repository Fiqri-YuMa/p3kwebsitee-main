// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from 'sonner';

import NavbarMobile from "@/components/NavbarMobile";
import NavbarDesktop from "@/components/NavbarDesktop";
import FloatingButtons from "src/components/FloatingButtons"; // <-- IMPOR KOMPONEN BARU

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "P3K 2026",
  description: "Website Pendaftaran P3K 2026",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${montserrat.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased bg-gradient-to-br from-sky-100 via-cyan-100 to-blue-100 min-h-screen">
        <NavbarDesktop />
        <NavbarMobile />

        {children}

       <FloatingButtons />

        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
