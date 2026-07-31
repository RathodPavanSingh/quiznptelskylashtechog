import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, loginLogs } from "@/db/schema";
import { desc, eq, sql, gte } from "drizzle-orm";
import { checkAdminAccess } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await checkAdminAccess();
  if (!access.allowed) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const [stats] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      admins: sql<number>`COUNT(*) FILTER (WHERE ${users.role} = 'admin')::int`,
      students: sql<number>`COUNT(*) FILTER (WHERE ${users.role} = 'student')::int`,
      everLoggedIn: sql<number>`COUNT(*) FILTER (WHERE ${users.loginCount} > 0)::int`,
    })
    .from(users);

  const allUsers = await db
    .select({
      id: users.id,
      username: users.username,
      regNo: users.regNo,
      email: users.email,
      role: users.role,
      provider: users.provider,
      loginCount: users.loginCount,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.lastLoginAt), desc(users.createdAt));

  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const logs = await db
    .select({
      id: loginLogs.id,
      action: loginLogs.action,
      provider: loginLogs.provider,
      ip: loginLogs.ip,
      createdAt: loginLogs.createdAt,
      userId: users.id,
      username: users.username,
      regNo: users.regNo,
      email: users.email,
      role: users.role,
    })
    .from(loginLogs)
    .innerJoin(users, eq(loginLogs.userId, users.id))
    .where(gte(loginLogs.createdAt, since))
    .orderBy(desc(loginLogs.createdAt))
    .limit(200);

  return NextResponse.json({ stats, users: allUsers, logs });
}
