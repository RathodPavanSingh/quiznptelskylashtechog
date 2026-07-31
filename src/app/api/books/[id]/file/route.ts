import { NextResponse } from "next/server";
import { db } from "@/db";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import { readFile, stat } from "fs/promises";

export const dynamic = "force-dynamic";

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".csv":
      return "text/csv; charset=utf-8";
    case ".html":
    case ".htm":
      return "text/html; charset=utf-8";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".doc":
      return "application/msword";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".xls":
      return "application/vnd.ms-excel";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const [book] = await db.select().from(books).where(eq(books.id, numId)).limit(1);
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const isDownload = url.searchParams.get("download") === "1";
    let rawUrl = book.fileUrl.trim();

    // Remote HTTP / HTTPS URL
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      const res = await fetch(rawUrl, {
        headers: { "User-Agent": "NPTELQuizBot/1.0" },
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: `Remote server returned ${res.status}` },
          { status: res.status },
        );
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const mime = getMimeType(rawUrl);
      const safeTitle = (book.title || "document").replace(/[^a-zA-Z0-9._-]/g, "_");
      const ext = path.extname(rawUrl) || ".pdf";

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Content-Length": buffer.length.toString(),
          "Content-Disposition": isDownload
            ? `attachment; filename="${safeTitle}${ext}"`
            : "inline",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Local file path inside public/
    let cleanPath = rawUrl.startsWith("/") ? rawUrl.slice(1) : rawUrl;
    let fullPath = path.join(process.cwd(), "public", cleanPath);

    try {
      await stat(fullPath);
    } catch {
      // Try fallback if leading slash was different or in uploads/books
      const fileName = path.basename(cleanPath);
      const altPath = path.join(process.cwd(), "public", "uploads", "books", fileName);
      try {
        await stat(altPath);
        fullPath = altPath;
      } catch {
        return NextResponse.json(
          { error: `File not found on server at ${cleanPath}` },
          { status: 404 },
        );
      }
    }

    const buffer = await readFile(fullPath);
    const mime = getMimeType(fullPath);
    const safeTitle = (book.title || "document").replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = path.extname(fullPath) || ".pdf";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Length": buffer.length.toString(),
        "Content-Disposition": isDownload
          ? `attachment; filename="${safeTitle}${ext}"`
          : "inline",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to serve file" },
      { status: 500 },
    );
  }
}
