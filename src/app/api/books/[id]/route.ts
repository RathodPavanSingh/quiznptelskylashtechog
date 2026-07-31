import { NextResponse } from "next/server";
import { db } from "@/db";
import { books } from "@/db/schema";
import { checkAdminAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { unlink } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { authorized } = await checkAdminAuth();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const [book] = await db.select().from(books).where(eq(books.id, numId)).limit(1);
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Attempt to remove local file if it's stored in public/
    if (book.fileUrl && !book.fileUrl.startsWith("http")) {
      const cleanPath = book.fileUrl.startsWith("/") ? book.fileUrl.slice(1) : book.fileUrl;
      const fullPath = path.join(process.cwd(), "public", cleanPath);
      await unlink(fullPath).catch(() => {});
    }

    await db.delete(books).where(eq(books.id, numId));

    return NextResponse.json({ ok: true, deletedId: numId });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to delete book" },
      { status: 500 },
    );
  }
}
