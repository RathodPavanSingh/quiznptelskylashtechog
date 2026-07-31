import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, loginLogs } from "@/db/schema";
import { desc, eq, sql, gte } from "drizzle-orm";
import { checkAdminAccess } from "@/lib/admin-guard";
import { AdminLoginChart } from "@/components/AdminUsersChart";
import { Users, ShieldCheck, GraduationCap, Activity, LogIn, UserPlus, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

function timeAgo(d: Date | null): string {
  if (!d) return "never";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const PROVIDER_BADGE: Record<string, string> = {
  password: "bg-slate-100 text-slate-700",
  google: "bg-blue-100 text-blue-700",
  apple: "bg-slate-900 text-white",
};

export default async function AdminUsersPage() {
  const access = await checkAdminAccess();
  if (!access.allowed) redirect(`/login?next=${encodeURIComponent("/admin/users")}`);

  const [stats] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      admins: sql<number>`COUNT(*) FILTER (WHERE ${users.role} = 'admin')::int`,
      students: sql<number>`COUNT(*) FILTER (WHERE ${users.role} = 'student')::int`,
      everLoggedIn: sql<number>`COUNT(*) FILTER (WHERE ${users.loginCount} > 0)::int`,
    })
    .from(users);

  const [todayLogins] = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(loginLogs)
    .where(gte(loginLogs.createdAt, new Date(new Date().setHours(0, 0, 0, 0))));

  const allUsers = await db.select().from(users).orderBy(desc(users.lastLoginAt), desc(users.createdAt));

  // last 14 days of login volume
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);
  const logs = await db
    .select({ createdAt: loginLogs.createdAt })
    .from(loginLogs)
    .where(gte(loginLogs.createdAt, since));

  const byDay = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const l of logs) {
    const key = new Date(l.createdAt).toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const chartData = Array.from(byDay.entries()).map(([day, logins]) => {
    const d = new Date(day);
    return { day, logins, label: `${d.getDate()}/${d.getMonth() + 1}` };
  });

  const recentLogs = await db
    .select({
      id: loginLogs.id,
      action: loginLogs.action,
      provider: loginLogs.provider,
      ip: loginLogs.ip,
      createdAt: loginLogs.createdAt,
      username: users.username,
      regNo: users.regNo,
      email: users.email,
      role: users.role,
    })
    .from(loginLogs)
    .innerJoin(users, eq(loginLogs.userId, users.id))
    .orderBy(desc(loginLogs.createdAt))
    .limit(12);

  const tiles = [
    { label: "Total users", value: stats.total, icon: Users, accent: "text-slate-900", chip: "bg-slate-100 text-slate-600" },
    { label: "Logged in", value: stats.everLoggedIn, icon: Activity, accent: "text-emerald-600", chip: "bg-emerald-50 text-emerald-600" },
    { label: "Students", value: stats.students, icon: GraduationCap, accent: "text-blue-600", chip: "bg-blue-50 text-blue-600" },
    { label: "Logins today", value: todayLogins.c, icon: LogIn, accent: "text-orange-600", chip: "bg-orange-50 text-orange-600" },
  ];

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800">
              <RefreshCw className="h-4 w-4" />
            </Link>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Admin · Authorization</div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Users & Login Activity</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Link href="/admin" className="btn-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">Admin Panel</Link>
            <Link href="/admin/devbox" className="btn-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">DevBox</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${t.chip}`}>
                <t.icon className="h-4 w-4" />
              </div>
              <div className={`font-display mt-3 text-4xl font-bold tabular-nums tracking-tight ${t.accent}`}>{t.value}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{t.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          {/* Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900">Logins · last 14 days</h2>
              <span className="text-xs font-semibold text-slate-500">{logs.length} events</span>
            </div>
            <div className="mt-4">
              <AdminLoginChart data={chartData} />
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-slate-900">Recent activity</h2>
            <ul className="mt-4 space-y-3">
              {recentLogs.length === 0 && (
                <li className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  No login events yet.
                </li>
              )}
              {recentLogs.map((l) => (
                <li key={l.id} className="flex items-start gap-3">
                  <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${PROVIDER_BADGE[l.provider] ?? PROVIDER_BADGE.password}`}>
                    {l.action === "signup" ? <UserPlus className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-800">
                      {l.username ?? l.regNo}
                      {l.role === "admin" && <ShieldCheck className="ml-1 inline h-3.5 w-3.5 text-orange-600" />}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {l.action} via {l.provider} · {timeAgo(l.createdAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Users table */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-display text-lg font-bold text-slate-900">All registered users</h2>
            <span className="text-xs font-semibold text-slate-500">{allUsers.length} accounts</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3 text-right">Logins</th>
                  <th className="px-6 py-3 text-right">Last login</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 transition hover:bg-orange-50/40">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[11px] font-black text-white">
                          {(u.name || u.regNo).slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{u.name ?? u.username ?? u.regNo}</div>
                          <div className="text-xs text-slate-500">@{u.regNo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${u.role === "admin" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                        {u.role === "admin" && <ShieldCheck className="h-3 w-3" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${PROVIDER_BADGE[u.provider] ?? PROVIDER_BADGE.password}`}>
                        {u.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold tabular-nums text-slate-800">{u.loginCount}</td>
                    <td className="px-6 py-3.5 text-right text-slate-500">{timeAgo(u.lastLoginAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          All account and login data is stored in <b className="text-slate-700">PostgreSQL</b> — users, hashed passwords, sessions and a full login audit log.
        </p>
      </div>
    </main>
  );
}
