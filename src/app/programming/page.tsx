import Link from "next/link";
import { db } from "@/db";
import { programmingQuestions, codingProblems } from "@/db/schema";
import { and, asc, count, eq, ilike, isNull, sql } from "drizzle-orm";
import { ensureSeeded } from "@/db/seed";
import { PracticeNav } from "@/components/PracticeNav";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;
const LANGUAGES = ["Data Analysis", "Web Development", "C", "C++", "Java", "Python"];

export default async function ProgrammingListPage({
  searchParams,
}: {
  searchParams: Promise<{
    language?: string;
    difficulty?: string;
    year?: string;
    pyq?: string;
    search?: string;
    page?: string;
  }>;
}) {
  await ensureSeeded().catch(() => {});
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const filters = [];
  if (sp.language && LANGUAGES.includes(sp.language)) filters.push(eq(programmingQuestions.language, sp.language));
  if (sp.difficulty && ["Easy", "Medium", "Hard"].includes(sp.difficulty)) filters.push(eq(programmingQuestions.difficulty, sp.difficulty));
  if (sp.year && /^20\d{2}$/.test(sp.year)) filters.push(eq(programmingQuestions.year, Number(sp.year)));
  if (sp.pyq === "1") filters.push(eq(programmingQuestions.isPyq, true));
  if (sp.search?.trim()) {
    filters.push(
      sql`(${programmingQuestions.questionText} ILIKE ${`%${sp.search.trim()}%`} OR ${programmingQuestions.title} ILIKE ${`%${sp.search.trim()}%`} OR ${programmingQuestions.topic} ILIKE ${`%${sp.search.trim()}%`})`,
    );
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  const rows = await db
    .select()
    .from(programmingQuestions)
    .where(where)
    .orderBy(asc(programmingQuestions.id))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const [{ total }] = await db
    .select({ total: count() })
    .from(programmingQuestions)
    .where(where);

  const [p] = await db.select({ c: sql<number>`COUNT(*)::int` }).from(programmingQuestions);
  const [c] = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(codingProblems)
    .where(isNull(codingProblems.exam));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (sp.language) params.set("language", sp.language);
    if (sp.difficulty) params.set("difficulty", sp.difficulty);
    if (sp.year) params.set("year", sp.year);
    if (sp.pyq) params.set("pyq", sp.pyq);
    if (sp.search) params.set("search", sp.search);
    params.set("page", String(targetPage));
    return `/programming?${params.toString()}`;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <PracticeNav active="programming" progCount={p.c} codingCount={c.c} />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Programming</h1>
              <p className="mt-1 text-sm text-slate-600">
                1,500 latest questions · Data Analysis · Web Development · C · C++ · Java · Python
              </p>
            </div>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
              {total.toLocaleString()} results
            </span>
          </div>
        </div>

        <form className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input
              name="search"
              defaultValue={sp.search ?? ""}
              placeholder="Search questions..."
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 lg:col-span-2"
            />
            <select name="language" defaultValue={sp.language ?? ""} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
              <option value="">All languages</option>
              {LANGUAGES.map((language) => <option key={language} value={language}>{language}</option>)}
            </select>
            <select name="difficulty" defaultValue={sp.difficulty ?? ""} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
              <option value="">All levels</option>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
            <select name="year" defaultValue={sp.year ?? ""} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
              <option value="">All years</option>
              {[2026, 2025, 2024, 2023, 2022].map((year) => <option key={year}>{year}</option>)}
            </select>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
              <input type="checkbox" name="pyq" value="1" defaultChecked={sp.pyq === "1"} className="accent-cyan-600" />
              Only PYQs
            </label>
            <div className="flex gap-2">
              <Link href="/programming" className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Clear</Link>
              <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700">Apply Filters</button>
            </div>
          </div>
        </form>

        <div className="space-y-3">
          {rows.map((q) => (
            <Link
              key={q.id}
              href={`/programming/${q.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-slate-400">{q.number}</span>
                <h2 className="text-base font-bold text-slate-900">{q.title}</h2>
                <DifficultyBadge d={q.difficulty} />
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100">{q.topic}</span>
                {q.isPyq && <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-700 ring-1 ring-cyan-100">PYQ</span>}
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700 ring-1 ring-purple-100">{q.language}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{q.questionText}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(q.tags ?? []).slice(0, 4).map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{tag}</span>
                ))}
                {q.year && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{q.year}</span>}
              </div>
            </Link>
          ))}
          {rows.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No programming questions match these filters.</div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">← Previous</Link>
          ) : <span />}
          <span className="text-xs font-bold text-slate-500">Page {page} of {totalPages}</span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">Next →</Link>
          ) : <span />}
        </div>
      </div>
    </main>
  );
}

function DifficultyBadge({ d }: { d: string }) {
  const map: Record<string, string> = {
    Easy: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Medium: "bg-amber-50 text-amber-700 ring-amber-100",
    Hard: "bg-rose-50 text-rose-700 ring-rose-100",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${map[d] ?? map.Easy}`}>{d}</span>;
}
