import type { ReactNode } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

const CHIPS = [
  { label: "MCQ", cls: "bg-blue-500/15 text-blue-200 ring-blue-400/30", d: "0s", x: "8%", y: "18%" },
  { label: "MSQ", cls: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30", d: "1.2s", x: "62%", y: "12%" },
  { label: "Numerical", cls: "bg-amber-500/15 text-amber-200 ring-amber-400/30", d: "2.1s", x: "22%", y: "62%" },
  { label: "PYQ 2024", cls: "bg-cyan-500/15 text-cyan-200 ring-cyan-400/30", d: "0.6s", x: "70%", y: "55%" },
  { label: "Figure", cls: "bg-purple-500/15 text-purple-200 ring-purple-400/30", d: "1.7s", x: "40%", y: "36%" },
  { label: "GATE", cls: "bg-rose-500/15 text-rose-200 ring-rose-400/30", d: "2.6s", x: "12%", y: "82%" },
];

export function AuthShell({ children, side }: { children: ReactNode; side: "left" | "right" }) {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-950 lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Ambient layers */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 80% 70% at 30% 20%, black, transparent)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-136 w-136 rounded-full bg-orange-600/25 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-48 -right-40 h-120 w-120 rounded-full bg-amber-500/15 blur-[110px]" />

      {/* Brand panel */}
      <div className="relative hidden lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-900/40">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">NPTEL Quiz</span>
          </Link>

          <h2 className="font-display mt-16 max-w-md text-5xl font-bold leading-[1.05] tracking-tight text-white">
            Your exam prep,
            <br />
            <span className="text-orange-400">secured.</span>
          </h2>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-slate-400">
            Track attempts across 10,000+ questions — NPTEL, GATE, JEE, Govt exams and MNC placement desks. Progress, streaks and ranks follow your account.
          </p>
        </div>

        {/* floating question-type chips */}
        <div className="relative h-56">
          {CHIPS.map((c) => (
            <span
              key={c.label}
              className={`auth-float absolute rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 backdrop-blur ${c.cls}`}
              style={{ left: c.x, top: c.y, animationDelay: c.d }}
            >
              {c.label}
            </span>
          ))}
          <div className="absolute bottom-0 left-0 flex items-center gap-6 text-slate-500">
            <Stat n="10k+" l="Questions" />
            <span className="h-8 w-px bg-slate-800" />
            <Stat n="24" l="Courses" />
            <span className="h-8 w-px bg-slate-800" />
            <Stat n="11" l="MNC desks" />
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center px-4 py-10 lg:py-14">
        <div
          aria-hidden
          className={`absolute inset-y-0 w-px bg-linear-to-b from-transparent via-slate-800 to-transparent ${
            side === "left" ? "left-0" : "right-0"
          }`}
        />
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-bold text-white">{n}</div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em]">{l}</div>
    </div>
  );
}
