import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TopHeader } from "@/components/TopHeader";
import { ChevronLeft, Download, ExternalLink } from "lucide-react";
import DocumentViewerClient from "@/components/DocumentViewerClient";
import { ensureSeeded } from "@/db/seed";

export const dynamic = "force-dynamic";

export default async function BookViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await ensureSeeded().catch(() => {});
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return notFound();

  const [book] = await db.select().from(books).where(eq(books.id, numId)).limit(1);
  if (!book) return notFound();

  // Normalize URL to guarantee leading slash for local relative paths
  let rawUrl = book.fileUrl.trim();
  if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://") && !rawUrl.startsWith("/")) {
    rawUrl = "/" + rawUrl;
  }
  const fileApiUrl = `/api/books/${book.id}/file`;
  const downloadApiUrl = `/api/books/${book.id}/file?download=1`;

  return (
    <main className="flex h-screen flex-col bg-slate-900 text-slate-100">
      <TopHeader />

      {/* Viewer Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2.5 shadow-md z-10 text-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/books"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Library
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <h1 className="truncate text-sm font-bold text-slate-100 max-w-sm sm:max-w-md">
            {book.title}
          </h1>
          <span className="hidden sm:inline-block rounded-md bg-blue-950 border border-blue-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300">
            {book.category}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={fileApiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open Direct
          </a>
          <a
            href={downloadApiUrl}
            download
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-sm"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        </div>
      </div>

      {/* Main Document Viewer Component */}
      <div className="flex-1 overflow-hidden">
        <DocumentViewerClient
          book={{
            id: book.id,
            title: book.title,
            fileUrl: rawUrl,
            category: book.category,
          }}
        />
      </div>
    </main>
  );
}
