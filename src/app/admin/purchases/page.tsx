"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, CheckCircle2, XCircle, Clock3, IndianRupee, ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";

type Purchase = {
  id: number;
  fullName: string;
  mobile: string;
  email: string;
  courseName: string;
  amountRupees: number;
  paymentRef: string;
  status: string;
  paymentMode: string;
  paymentDetails: Record<string, string> | null;
  paymentLast4: string | null;
  joinedCourse: boolean;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

type Summary = { total: number; successful: number; failed: number; revenue: number };

export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, successful: 0, failed: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/purchases");
      const data = await response.json();
      if (response.ok) {
        setPurchases(data.purchases ?? []);
        setSummary((current) => data.summary ?? current);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!isMounted) return;
      await load();
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [load]);

  return (
    <main className="min-h-screen bg-slate-100 pb-20">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Admin · Payments</div>
              <h1 className="font-display text-2xl font-bold text-slate-900">Payment History</h1>
            </div>
          </div>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-7">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Total attempts" value={summary.total} icon={CreditCard} color="text-slate-900" />
          <Stat label="Successful" value={summary.successful} icon={CheckCircle2} color="text-emerald-600" />
          <Stat label="Failed" value={summary.failed} icon={XCircle} color="text-rose-600" />
          <Stat label="Revenue" value={`₹${summary.revenue}`} icon={IndianRupee} color="text-orange-600" />
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">All payment attempts</h2>
              <p className="mt-0.5 text-xs text-slate-500">Sensitive card numbers and CVV are never stored.</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Loading payment history…</div>
          ) : purchases.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">No payment attempts yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Date / Device</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => {
                    const details = p.paymentDetails ?? {};
                    return (
                      <tr key={p.id} className="border-b border-slate-50 align-top hover:bg-orange-50/40">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{p.fullName}</div>
                          <div className="mt-1 text-xs text-slate-500">{p.courseName}</div>
                          <div className="mt-1 text-xs font-bold text-slate-700">₹{p.amountRupees}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-slate-700">{p.mobile}</div>
                          <div className="mt-1 text-xs text-slate-500">{p.email}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700">{p.paymentMode}</span>
                          {details.upiId && <div className="mt-2 text-xs text-slate-500">UPI: {details.upiId}</div>}
                          {details.provider && <div className="mt-2 text-xs text-slate-500">Provider: {details.provider}</div>}
                          {details.bank && <div className="mt-2 text-xs text-slate-500">Bank: {details.bank}</div>}
                          {p.paymentLast4 && <div className="mt-2 text-xs text-slate-500">Card ending {p.paymentLast4}</div>}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${p.status === "success" ? "bg-emerald-100 text-emerald-700" : p.status === "failed" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                            {p.status === "success" ? <CheckCircle2 className="h-3 w-3" /> : p.status === "failed" ? <XCircle className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                            {p.status}
                          </span>
                          {p.joinedCourse && <div className="mt-2 text-xs font-semibold text-emerald-600">Course joined</div>}
                        </td>
                        <td className="px-4 py-4">
                          <code className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{p.paymentRef}</code>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500">
                          <div>{new Date(p.createdAt).toLocaleString()}</div>
                          {p.ip && <div className="mt-1">IP: {p.ip}</div>}
                          {p.userAgent && <div className="mt-1 max-w-[220px] truncate" title={p.userAgent}>{p.userAgent}</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: typeof CreditCard; color: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 ${color}`}><Icon className="h-4 w-4" /></span>
      <div className={`font-display mt-3 text-3xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}
