import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk, Public_Sans } from "next/font/google";
import "./globals.css";
import { AdminBar } from "@/components/AdminBar";
import { TopHeader } from "@/components/TopHeader";
import { Footer } from "@/components/Footer";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NPTEL Previous Year Quiz | Unit-wise & Year-wise Practice",
  description:
    "Practice NPTEL previous year assignment questions unit-wise and year-wise. Cloud Computing, Networks, Data Analytics, ML, DBMS, and more.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
        <script defer src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      </head>
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
        <TopHeader />
        <div className="flex-1">{children}</div>
        <Footer />
        <AdminBar />
      </body>
    </html>
  );
}
