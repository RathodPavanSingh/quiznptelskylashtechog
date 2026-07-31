import Link from "next/link";
import { db } from "@/db";
import { books } from "@/db/schema";
import { desc } from "drizzle-orm";
import { PracticeNav } from "@/components/PracticeNav";
import { ensureSeeded } from "@/db/seed";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  await ensureSeeded().catch(() => {});
  const allBooks = await db.select().from(books).orderBy(desc(books.createdAt));

  return (
    <main className="min-h-screen bg-slate-50">
      <PracticeNav active="books" />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            Resource Library
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Books & Documents</h1>
          <p className="mt-2 text-sm text-slate-600">
            Download latest PDFs, textbooks, previous year papers, and study material. <br /> Browse live from <a href="https://archive.org" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">archive.org</a>.
          </p>
          <div className="mt-3">
            <Link
              href="/admin/books"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              ⚙️ Manage Library (Upload / Delete Documents)
            </Link>
          </div>
        </div>

        {/* Archive.org Live Search */}
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="font-display mb-3 text-xl font-bold text-blue-900">Live from Internet Archive</h2>
          <form action="https://archive.org/search.php" method="get" target="_blank" className="flex gap-2">
            <input type="hidden" name="query" value="subject:(engineering OR gate OR nptel)" />
            <input
              type="text"
              name="query"
              placeholder="Search archive.org for books, papers..."
              className="flex-1 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
            />
            <button type="submit" className="rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700">Search</button>
          </form>
          <div className="mt-2 text-xs text-blue-700">Popular Collections: GATE 2026, NPTEL, Rich Dad Poor Dad, Electrical Engineering</div>
        </div>

        {allBooks.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">📚</div>
            <p>No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {allBooks.map((b) => (
              <Link
                key={b.id}
                href={`/books/${b.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative flex aspect-4/3 w-full items-center justify-center bg-linear-to-br from-slate-100 to-slate-200">
                  {b.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.coverUrl} alt={b.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  ) : (
                    <span className="text-4xl shadow-sm transition duration-300 group-hover:scale-110">📄</span>
                  )}
                  <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white backdrop-blur">
                    {b.category}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-blue-600">
                    {b.title}
                  </h3>
                  {b.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{b.description}</p>
                  )}
                  <div className="mt-auto pt-3 flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span>{b.year ? `Year: ${b.year}` : "General"}</span>
                    <span className="text-blue-600">View Document →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
