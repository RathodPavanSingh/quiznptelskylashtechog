"use client";

import Link from "next/link";
import { TopHeader } from "@/components/TopHeader";

export default function DeveloperPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Website Management Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Website Management</h1>
          <p className="mt-2 text-sm text-slate-500">Built and managed with care for students.</p>
        </div>

        {/* Professional Developer Card */}
        <div className="mx-auto max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          {/* Avatar section */}
          <div className="relative flex justify-center bg-linear-to-b from-slate-50 to-white pt-8">
            <div className="relative">
              <div className="h-36 w-36 overflow-hidden rounded-full border-4 border-rose-200 shadow-xl">
               
                <svg viewBox="0 0 200 200" className="h-full w-full bg-linear-to-br from-blue-50 to-slate-100">
                  <circle cx="100" cy="80" r="35" fill="#d4a574" />
                  <path d="M100 100 C 65 105, 45 160, 50 185 L 150 185 C 155 160, 135 105, 100 100 Z" fill="#1e3a8a" />
                  <rect x="80" y="75" width="40" height="30" rx="3" fill="#1e3a8a" />
                  <rect x="85" y="65" width="30" height="18" rx="2" fill="#e8d5b7" />
                  <circle cx="100" cy="72" r="14" fill="#d4a574" />
                  <path d="M86 65 Q100 55, 114 65 Q115 60, 100 56 Q85 60, 86 65 Z" fill="#1e3a8a" opacity="0.8" />
                </svg> 
              </div>
              {/* Badge */}
              <span className="absolute -bottom-2 right-2 rounded-lg bg-rose-600 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
                Developer
              </span>
            </div>
          </div>

          {/* Name & role */}
          <div className="text-center px-6 pt-4">
            <h2 className="text-2xl font-bold text-slate-900">Rathod Pavan Singh</h2>
            <p className="mt-1 text-sm font-semibold text-rose-600">Full Stack Developer</p>
          </div>

          {/* Divider */}
          <div className="mx-6 my-4 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />

          {/* Contact Info */}
          <div className="px-6 space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</div>
                <div className="text-sm font-semibold text-slate-800">rathodpavanrp047404@gmail.com</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">College</div>
                <div className="text-sm font-semibold text-slate-800">NIT Patna</div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-6 my-4 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />

          {/* Social Icons */}
          <div className="flex items-center justify-center gap-3 px-6 pb-6">
            <a
              href="https://www.linkedin.com/in/rathod-pavan-singh-6928a4290/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-400/30 transition hover:scale-110 hover:shadow-xl"
              title="LinkedIn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.683H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9.053h3.564v11.369zM22.225 0H1.77C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.77 24h20.451C23.95 24 24 23.227 24 22.271V1.729C24 .774 23.95 0 22.225 0h.001z" />
              </svg>
            </a>
            <a
              href="https://github.com/RathodPavanSingh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-400/30 transition hover:scale-110 hover:shadow-xl"
              title="GitHub"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.36.735-4.065-1.62-4.065-1.62C4.635 13.95 3.51 13.37 3.51 13.37c-1.56-1.06-.12-1.05.12-1.05 1.725.12 2.625 1.785 2.625 1.785 1.53 2.595 4.03 1.845 5.01 1.41.12-.97.6-1.62 1.02-2-3.375-.375-6.9-1.71-6.9-7.62 0-1.68.6-3.045 1.575-4.125-.15-.375-.675-1.935.15-4.035 0 0-1.275-.405-4.17 1.575 1.23-3.42 3.27-2.85 3.375-2.85.135 0 .405.09.585.165.855-.09 1.71-.135 2.565-.135.855 0 1.725.045 2.58.135 1.35-.975 2.325-1.47 2.58-1.53A9.92 9.92 0 0012 0zm-4.185 16.98c-.54-.03-1.18-.27-2.57-1.35-.525-.63-1.215-1.53-1.215-3.03 0-1.17.51-2.145 1.29-2.145.69 0 1.41.495 1.83.495.36 0 .87-.585 1.89-.585.735 0 1.5.255 2.01.585 0 0 .255.645.255 1.935 0 1.335-.39 2.37-.945 3.165-.42.48-.96.915-1.605 1.185l-.675.675z" />
              </svg>
            </a>
            <a
              href="https://x.com/rathodpavan"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-400/30 transition hover:scale-110 hover:shadow-xl"
              title="X / Twitter"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="mailto:rathodpavanrp047404@gmail.com"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-400/30 transition hover:scale-110 hover:shadow-xl"
              title="Email"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>
          </div>
        </div>

        {/* About Section */}
        <div className="mx-auto mt-8 max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-rose-800">About</h2>
          <div className="mt-2 h-0.5 w-12 bg-linear-to-r from-rose-400 to-rose-600 rounded-full" />
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            A passionate full-stack developer from <b className="text-slate-800">NIT Patna</b> who
            loves building scalable web applications and open-source educational tools. Specializes in
            React, Next.js, TypeScript, and PostgreSQL. Currently building platforms that make
            quality education accessible to every student in India.
          </p>
        </div>
      </main>
    </div>
  );
}
