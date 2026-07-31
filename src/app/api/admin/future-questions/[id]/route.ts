import { NextResponse } from "next/server";
import { db } from "@/db";
import { practiceQuestions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { checkAdminAuth } from "@/lib/auth";
import { bootstrapDatabase } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await bootstrapDatabase();
  const { authorized } = await checkAdminAuth();
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "Invalid future question id." }, { status: 400 });
  }

  await db
    .delete(practiceQuestions)
    .where(and(eq(practiceQuestions.id, numericId), eq(practiceQuestions.category, "future")));

  return NextResponse.json({ ok: true });
}
