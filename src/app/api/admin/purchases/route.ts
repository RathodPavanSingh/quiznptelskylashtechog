import { NextResponse } from "next/server";
import { db } from "@/db";
import { coursePurchases } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { checkAdminAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { authorized } = await checkAdminAuth();
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const [summary] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      successful: sql<number>`COUNT(*) FILTER (WHERE ${coursePurchases.status} = 'success')::int`,
      failed: sql<number>`COUNT(*) FILTER (WHERE ${coursePurchases.status} = 'failed')::int`,
      revenue: sql<number>`COALESCE(SUM(${coursePurchases.amountRupees}) FILTER (WHERE ${coursePurchases.status} = 'success'), 0)::int`,
    })
    .from(coursePurchases);

  const purchases = await db
    .select()
    .from(coursePurchases)
    .orderBy(desc(coursePurchases.createdAt));

  return NextResponse.json({ summary, purchases });
}
