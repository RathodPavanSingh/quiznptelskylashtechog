"use client";

import { useState } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { SocialAuthModal } from "@/components/SocialAuthModal";
import { User as UserIcon, Mail, Lock, Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100";

function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<null | { role: string }>(null);
  const [social, setSocial] = useState<"google" | "apple" | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign up failed.");
        return;
      }
      setCreated({ role: data.user.role });
      setTimeout(() => router.push(next || "/"), 900);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl shadow-orange-950/20 sm:p-8">
      <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">Create Account</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        Sign up to access your academic dashboard. Already have account?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-bold text-orange-600 hover:underline">
          Sign In
        </Link>
      </p>

      {error && (
        <div className="auth-shake mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {error}{" "}
            {error.includes("Sign In") && (
              <Link href="/login" className="font-bold underline">Go to login →</Link>
            )}
          </span>
        </div>
      )}
      {created && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Account created{created.role === "admin" && <> — you hold the <b>admin</b> role</>}. Redirecting…
          </span>
        </div>
      )}

      <form className="mt-6 space-y-3.5" onSubmit={submit}>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required minLength={3} className={inputCls} autoComplete="username" />
        </div>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required className={inputCls} autoComplete="email" />
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password (min 6 chars)" required minLength={6} className={inputCls} autoComplete="new-password" />
        </div>

        <button
          type="submit"
          disabled={loading || !!created}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-orange-600 to-amber-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4 transition group-hover:scale-110" />}
          {loading ? "Creating account…" : "Sign Up"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setSocial("google")} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>
        <button type="button" onClick={() => setSocial("apple")} className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.37 1.43c0 1.14-.42 2.2-1.25 3.05-.9 1.02-2.02 1.61-3.24 1.51-.08-1.11.42-2.29 1.21-3.11.86-.93 2.16-1.55 3.28-1.45zM20.5 17.2c-.55 1.28-.82 1.85-1.53 2.98-.99 1.59-2.39 3.57-4.12 3.58-1.54.02-1.94-1.01-4.03-1-2.09.01-2.53 1.03-4.07 1.01-1.73-.02-3.06-1.8-4.05-3.39C-.06 16.9-.35 11.5 1.42 8.97c1.26-1.8 3.25-2.85 5.12-2.85 1.9 0 3.1 1.04 4.67 1.04 1.53 0 2.46-1.04 4.66-1.04 1.67 0 3.44.91 4.7 2.48-4.13 2.27-3.46 8.16-.07 8.6z" />
          </svg>
          Apple ID
        </button>
      </div>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">
        Repeated user? <Link href="/login" className="font-bold text-slate-600 hover:underline">Sign in directly</Link> — sign up is for new accounts only.
      </p>

      {social && <SocialAuthModal provider={social} onClose={() => setSocial(null)} />}
    </div>
  );
}

export default function SignUpPage() {
  return (
    <AuthShell side="right">
      <Suspense>
        <SignUpForm />
      </Suspense>
    </AuthShell>
  );
}
