import { NextResponse } from "next/server";
import { db } from "@/db";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import { readFile } from "fs/promises";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const [book] = await db.select().from(books).where(eq(books.id, numId)).limit(1);
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    const rawUrl = book.fileUrl.trim();
    let fileBuffer: Buffer | null = null;

    // Fetch or read file
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      const res = await fetch(rawUrl, {
        headers: { "User-Agent": "NPTELQuizBot/1.0" },
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      fileBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      // Local file path
      const cleanPath = rawUrl.startsWith("/") ? rawUrl.slice(1) : rawUrl;
      const fullPath = path.join(process.cwd(), "public", cleanPath);
      fileBuffer = await readFile(fullPath);
    }

    const lowerUrl = rawUrl.toLowerCase();

    // Word Docx -> HTML
    if (lowerUrl.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.convertToHtml({ buffer: fileBuffer });
      return NextResponse.json({ type: "html", html: result.value, title: book.title });
    }

    // Excel / CSV -> Sheets JSON
    if (lowerUrl.endsWith(".xlsx") || lowerUrl.endsWith(".xls") || lowerUrl.endsWith(".csv")) {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(fileBuffer, { type: "buffer" });
      const sheets: Record<string, any[]> = {};
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        if (ws) {
          sheets[sheetName] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        }
      }
      return NextResponse.json({ type: "spreadsheet", sheets, title: book.title });
    }

    // Text / JSON / MD
    if (
      lowerUrl.endsWith(".txt") ||
      lowerUrl.endsWith(".json") ||
      lowerUrl.endsWith(".md") ||
      lowerUrl.endsWith(".js") ||
      lowerUrl.endsWith(".ts") ||
      lowerUrl.endsWith(".py") ||
      lowerUrl.endsWith(".c") ||
      lowerUrl.endsWith(".cpp")
    ) {
      const text = fileBuffer.toString("utf-8");
      return NextResponse.json({ type: "text", text, title: book.title });
    }

    return NextResponse.json({ type: "raw", url: rawUrl, title: book.title });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to render document" }, { status: 500 });
  }
}
