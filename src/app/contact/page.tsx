"use client";

import { useState } from "react";
import { TopHeader } from "@/components/TopHeader";
import { Mail, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | "warning"; msg: string } | null>(null);
  const [gmailFallback, setGmailFallback] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setGmailFallback(null);
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", msg: data.error || "Something went wrong." });
      } else if (data.sentDirectly) {
        setStatus({ type: "success", msg: "Message sent successfully to our Gmail inbox! We will get back to you soon." });
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus({ type: "warning", msg: "Your message was saved, but Gmail delivery needs one more step." });
        setGmailFallback(data.gmailUrl || null);
      }
    } catch {
      setStatus({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopHeader />
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">Contact Us</h1>
            <p className="mt-2 text-sm text-slate-600">
              Have a question or want to partner with us? Fill out the form and your message will be delivered directly to our team via email.
            </p>

            {status && (
              <div className={`mt-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${
                status.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : status.type === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}>
                {status.type === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                )}
                <div>
                  <div>{status.msg}</div>
                  {gmailFallback && (
                    <a
                      href={gmailFallback}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-800"
                    >
                      Open pre-filled Gmail message
                    </a>
                  )}
                </div>
              </div>
            )}

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Your Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  placeholder="How can we help you?"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-orange-600 to-amber-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 transition group-hover:scale-110" />
                )}
                {loading ? "Sending…" : "Send Message"}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-xl">
              <h2 className="font-display text-2xl font-bold">Get in touch</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                We are available for academic collaborations, content partnerships, and general inquiries.
              </p>
              <div className="mt-6 flex items-center gap-4 rounded-2xl bg-white/10 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</div>
                  <div className="text-sm font-bold">Quiznptelskylashtechog@gmail.com</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="font-display text-lg font-bold">Direct Gmail Integration</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                This form uses a direct integration with Gmail to deliver your message instantly to the admin inbox. No middlemen or third-party spam filters.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
