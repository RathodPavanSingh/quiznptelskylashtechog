"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, ShieldCheck } from "lucide-react";

export function SocialAuthModal({
  provider,
  onClose,
}: {
  provider: "google" | "apple";
  onClose: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const brand = provider === "google" ? "Google" : "Apple";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/social", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, email, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `${brand} sign-in failed.`);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="auth-shake relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          {provider === "google" ? (
            <svg className="h-8 w-8" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          ) : (
            <svg className="h-8 w-8 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.37 1.43c0 1.14-.42 2.2-1.25 3.05-.9 1.02-2.02 1.61-3.24 1.51-.08-1.11.42-2.29 1.21-3.11.86-.93 2.16-1.55 3.28-1.45zM20.5 17.2c-.55 1.28-.82 1.85-1.53 2.98-.99 1.59-2.39 3.57-4.12 3.58-1.54.02-1.94-1.01-4.03-1-2.09.01-2.53 1.03-4.07 1.01-1.73-.02-3.06-1.8-4.05-3.39C-.06 16.9-.35 11.5 1.42 8.97c1.26-1.8 3.25-2.85 5.12-2.85 1.9 0 3.1 1.04 4.67 1.04 1.53 0 2.46-1.04 4.66-1.04 1.67 0 3.44.91 4.7 2.48-4.13 2.27-3.46 8.16-.07 8.6z" />
            </svg>
          )}
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">Continue with {brand}</h3>
            <p className="text-xs text-slate-500">Use your college {brand} ID</p>
          </div>
        </div>

        {error && (
          <div className="auth-shake mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>
        )}

        <form className="mt-5 space-y-3" onSubmit={submit}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name (optional)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={provider === "google" ? "you@college.edu (Google)" : "you@icloud.com (Apple ID)"}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
          />
          <button
            type="submit"
            disabled={loading}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition disabled:opacity-60 ${
              provider === "apple"
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {loading ? "Verifying…" : `Continue with ${brand}`}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
          Returning {brand} users sign straight in; new emails get an account instantly. Everything is stored in PostgreSQL.
        </p>
      </div>
    </div>
  );
}
