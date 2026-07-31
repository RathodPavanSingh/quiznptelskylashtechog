"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, Calendar, FileText, Camera } from "lucide-react";

// -----------------------------
// PHOTO GALLERY
// -----------------------------
const GALLERY = [
  "/gallery/campus.svg",
  "/gallery/students.svg",
  "/gallery/lab.svg",
  "/gallery/seminar.svg",
  "/gallery/library.svg",
  "/gallery/pavan22.jpg"
];

export function PhotoGallery() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-8">
      <header className="mb-4 flex items-end justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-pink-700">
            <Camera className="h-3.5 w-3.5" /> Photo Gallery
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Campus Life & Learning Snapshots
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Glimpses from our recent workshops, lectures, and student community events.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {GALLERY.map((src, i) => (
          <motion.figure
            key={src}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="aspect-square w-full overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Gallery image ${i + 1}`}
                className="h-full w-full object-cover transition duration-300 hover:scale-105"
              />
            </div>
            <figcaption className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Memory {i + 1}
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

// -----------------------------
// NOTICE BOARD (bottom-to-top scrolling)
// -----------------------------
const NOTICES = [
  { id: 1, title: "GATE 2026 mock test window open", href: "/dummy/notice-gate-mock.pdf", date: "2026-01-12" },
  { id: 2, title: "Library e-book drop: 500 practice PDFs", href: "/dummy/notice-library.pdf", date: "2026-01-08" },
  { id: 3, title: "Scholarship form deadline (dummy link)", href: "/dummy/notice-scholarship.pdf", date: "2026-01-04" },
  { id: 4, title: "Holiday list PDF (dummy document)", href: "/dummy/notice-holiday.pdf", date: "2025-12-29" },
  { id: 5, title: "Anti-ragging affidavit (dummy link)", href: "/dummy/notice-affidavit.pdf", date: "2025-12-20" },
  { id: 6, title: "Rich dad poor dad ", href: "/dummy/notice-affidavit.pdf", date: "2026-07-31" },
];

function NoticeItem({ n }: { n: { id: number; title: string; href: string; date: string } }) {
  return (
    <li className="flex shrink-0 items-center gap-3 px-4 py-3 transition hover:bg-amber-50/60">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
        <FileText className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-slate-800">{n.title}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Calendar className="h-3 w-3" /> {n.date}
        </div>
      </div>
      <a
        href={n.href}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100"
      >
        Open
      </a>
    </li>
  );
}

export function NoticeBoard() {
  // Duplicate the list so the bottom-to-top loop is seamless.
  const loop = [...NOTICES, ...NOTICES];

  return (
    <section className="mx-auto max-w-5xl px-5 py-8">
      <header className="mb-4 flex items-end justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-700">
            <Bell className="h-3.5 w-3.5" /> Notice Board
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Latest Notices & Documents
          </h2>
        </div>
        <span className="hidden text-xs text-slate-500 sm:inline">{NOTICES.length} updates · scrolling</span>
      </header>

      <div className="notice-board relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="notice-track flex flex-col">
          {loop.map((n, i) => (
            <NoticeItem key={`${n.id}-${i}`} n={n} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-white to-transparent" />
      </div>
    </section>
  );
}

// -----------------------------
// CATEGORY MARQUEE
// -----------------------------
const MARQUEE_ITEMS = [
  { label: "Programming", color: "bg-blue-600", path: "/programming" },
  { label: "Coding", color: "bg-indigo-600", path: "/coding" },
  { label: "Aptitude", color: "bg-emerald-600", path: "/aptitude/numerical" },
  { label: "GATE", color: "bg-violet-600", path: "/gate" },
  { label: "Entrance", color: "bg-rose-600", path: "/jee" },
  { label: "Govt Exams", color: "bg-rose-700", path: "/govt/upsc" },
  { label: "MNC", color: "bg-slate-800", path: "/mnc" },
  { label: "GK", color: "bg-emerald-700", path: "/gk/history" },
  { label: "Practice", color: "bg-amber-600", path: "/practice" },
  { label: "Library", color: "bg-blue-700", path: "/books" },
];

export function CategoryMarquee() {
  // Duplicate list to allow seamless looping.
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div className="overflow-hidden border-y border-slate-200 bg-slate-900 py-3 text-white shadow-inner">
      <div className="home-marquee flex w-max gap-4 px-4 font-display text-base sm:text-lg">
        {items.map((item, i) => (
          <Link
            key={`${item.label}-${i}`}
            href={item.path}
            className={`group inline-flex items-center gap-2 rounded-full ${item.color} px-5 py-2 font-black uppercase tracking-wider text-white shadow-md transition hover:scale-105`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
            {item.label}
            <span className="opacity-0 transition group-hover:opacity-100">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// `Link` is already imported at the top.
