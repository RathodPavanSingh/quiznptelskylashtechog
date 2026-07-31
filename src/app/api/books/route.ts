import { NextResponse } from "next/server";
import { db } from "@/db";
import { books } from "@/db/schema";
import { checkAdminAuth } from "@/lib/auth";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(books).orderBy(desc(books.createdAt));
  return NextResponse.json({ books: rows });
}

export async function POST(req: Request) {
  try {
    const { authorized } = await checkAdminAuth();
    if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await req.json();
    const { title, description, fileUrl, coverUrl, category, year } = body;

    if (!title || !fileUrl) {
      return NextResponse.json({ error: "Title and File URL are required" }, { status: 400 });
    }

    const [created] = await db
      .insert(books)
      .values({
        title,
        description: description || null,
        fileUrl,
        coverUrl: coverUrl || null,
        category: category || "General",
        year: year ? parseInt(year, 10) : null,
      })
      .returning();

    return NextResponse.json({ book: created });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to create book" }, { status: 500 });
  }
}
