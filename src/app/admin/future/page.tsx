"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Blocks,
  Code2,
  Layers3,
  Landmark,
  BriefcaseBusiness,
  Globe2,
  Plus,
  Trash2,
  Users,
  BrainCircuit,
  BookOpenCheck,
} from "lucide-react";

const SECTIONS = [
  { key: "programming", label: "Programming", icon: Code2, section: "future-programming", slotName: "Programming Slot" },
  { key: "coding", label: "Coding", icon: Blocks, section: "future-coding", slotName: "Coding Slot" },
  { key: "aptitude", label: "Aptitude", icon: Users, section: "future-aptitude", slotName: "Aptitude Slot" },
  { key: "gate", label: "GATE", icon: BookOpenCheck, section: "future-gate", slotName: "GATE Slot" },
  { key: "entrance", label: "Entrance Exam", icon: Landmark, section: "future-entrance-exam", slotName: "Entrance Exam Slot" },
  { key: "govt", label: "Govt Exam", icon: Landmark, section: "future-govt-exam", slotName: "Government Exam Slot" },
  { key: "mnc", label: "MNC", icon: BriefcaseBusiness, section: "future-mnc-exam", slotName: "MNC Exam Slot" },
  { key: "gk-exam", label: "GK Exam", icon: Globe2, section: "future-gk-exam", slotName: "GK Exam Slot" },
];

type Row = {
  id: number;
  section: string;
  number: string;
  topic: string;
  difficulty: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  questionType: string;
  correctIndices: number[] | null;
  numericalAnswer: number | null;
  numericalTolerance: number | null;
  numericalUnit: string | null;
  year: number | null;
  isPyq: boolean;
  imageUrl: string | null;
  tags: string[];
};

export default function FutureSlotsPage() {
  const [sectionKey, setSectionKey] = useState(SECTIONS[0].key);
  const [questions, setQuestions] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [difficulty, setDifficulty] = useState("Easy");
  const [questionType, setQuestionType] = useState("mcq");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [correctIndices, setCorrectIndices] = useState<number[]>([]);
  const [numericalAnswer, setNumericalAnswer] = useState("");
  const [numericalTolerance, setNumericalTolerance] = useState("0");
  const [numericalUnit, setNumericalUnit] = useState("");
  const [explanation, setExplanation] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [imageUrl, setImageUrl] = useState("");
  const [isPyq, setIsPyq] = useState(false);

  const current = useMemo(() => SECTIONS.find((s) => s.key === sectionKey)!, [sectionKey]);
  const currentQuestions = useMemo(
    () => questions.filter((q) => q.section === current.slotName.replace(/\s+/g, "-")),
    [questions, current],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/future-questions");
      const data = await response.json();
      if (response.ok) setQuestions(data.questions ?? []);
      else showToast(data.error ?? "Could not load future questions.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  function toggleCorrectIndex(index: number) {
    if (questionType === "msq") {
      setCorrectIndices((prev) => (prev.includes(index) ? prev.filter((x) => x !== index) : [...prev, index].sort((a, b) => a - b)));
    } else {
      setCorrectIndex(index);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const section = current.slotName.replace(/\s+/g, "-");
      const response = await fetch("/api/admin/future-questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          section,
          number: `slot:${section}:${currentQuestions.length + 1}`,
          topic: current.slotName,
          difficulty,
          questionText,
          options: questionType === "numerical" ? [] : options.filter((o) => o.trim()),
          correctIndex,
          correctIndices: questionType === "msq" ? correctIndices : null,
          numericalAnswer: questionType === "numerical" && numericalAnswer !== "" ? Number(numericalAnswer) : null,
          numericalTolerance: questionType === "numerical" ? Number(numericalTolerance) || 0 : null,
          numericalUnit: questionType === "numerical" ? numericalUnit.trim() : null,
          explanation,
          year: year ? Number(year) : null,
          isPyq,
          questionType,
          imageUrl: imageUrl.trim() || null,
          timeSeconds: 40,
        }),
      });
      const data = await response.json();
      if (!response.ok) return showToast(data.error ?? "Could not save.");
      showToast(`${current.label} future question added.`);
      setQuestionText("");
      setOptions(["", ""]);
      setCorrectIndex(0);
      setCorrectIndices([]);
      setNumericalAnswer("");
      setNumericalUnit("");
      setExplanation("");
      setImageUrl("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this reserved future question?")) return;
    const response = await fetch(`/api/admin/future-questions/${id}`, { method: "DELETE" });
    if (response.ok) {
      showToast("Future question deleted.");
      await load();
    } else {
      const data = await response.json();
      showToast(data.error ?? "Delete failed.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 pb-20">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"><ArrowLeft className="h-4 w-4" /></Link>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Admin • Future expansion slots</div>
              <h1 className="font-display text-2xl font-bold text-slate-900">Reserved Empty Space for More Questions</h1>
              <p className="mt-1 text-xs font-semibold text-slate-600">Current questions remain untouched. Add/preview/delete only your future questions here.</p>
            </div>
          </div>
          <Link href="/admin" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Back to Admin</Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-7">
        <div className="mb-5 flex flex-wrap gap-2">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = s.key === sectionKey;
            return (
              <button
                key={s.key}
                onClick={() => setSectionKey(s.key)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${active ? "border-orange-600 bg-orange-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
              >
                <Icon className="h-4 w-4" /> {s.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700"><Plus className="h-5 w-5" /></span>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">Add Future {current.label} Question</h2>
                <p className="text-xs font-medium text-slate-500">Start with an empty slot; update real content anytime later.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <Field label="Difficulty">
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input">
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </Field>
              <Field label="Question type">
                <select value={questionType} onChange={(e) => setQuestionType(e.target.value)} className="input">
                  <option value="mcq">MCQ</option><option value="msq">MSQ</option><option value="numerical">Numerical</option><option value="figure">Figure</option>
                </select>
              </Field>
              <Field label="Question">
                <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={4} className="input resize-y" placeholder="Write future question here..." />
              </Field>

              {questionType !== "numerical" ? (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Options</span>
                    <button onClick={() => setOptions((prev) => [...prev, ""])} className="text-xs font-bold text-blue-600 hover:underline">+ Add option</button>
                  </div>
                  <div className="space-y-2">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleCorrectIndex(index)}
                          className={`flex h-7 w-7 shrink-0 items-center justify-center text-xs font-black ${questionType === "msq" ? "rounded-md" : "rounded-full"} ${(questionType === "msq" ? correctIndices.includes(index) : correctIndex === index) ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
                        >
                          {String.fromCharCode(65 + index)}
                        </button>
                        <input value={option} onChange={(e) => setOptions((prev) => prev.map((o, i) => (i === index ? e.target.value : o)))} className="input flex-1" placeholder={`Option ${String.fromCharCode(65 + index)}`} />
                        {options.length > 2 && <button onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))} className="text-xs font-bold text-rose-600">Remove</button>}
                      </div>
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] font-semibold text-slate-400">Click letter button to mark correct option(s).</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Correct answer"><input type="number" step="any" value={numericalAnswer} onChange={(e) => setNumericalAnswer(e.target.value)} className="input" /></Field>
                  <Field label="Tolerance ±"><input type="number" min="0" step="any" value={numericalTolerance} onChange={(e) => setNumericalTolerance(e.target.value)} className="input" /></Field>
                  <Field label="Unit"><input value={numericalUnit} onChange={(e) => setNumericalUnit(e.target.value)} className="input" placeholder="Ω, MW..." /></Field>
                </div>
              )}

              {(questionType === "figure" || imageUrl) && (
                <Field label="Figure image URL (optional)">
                  <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="input" placeholder="/circuit/your-figure.svg" />
                </Field>
              )}
              <Field label="Explanation (optional)">
                <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={3} className="input resize-y" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Year"><input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="input" /></Field>
                <label className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-slate-600">
                  <input type="checkbox" checked={isPyq} onChange={(e) => setIsPyq(e.target.checked)} className="accent-cyan-600" /> Mark PYQ
                </label>
              </div>
              <button onClick={save} disabled={saving} className="w-full rounded-xl bg-orange-600 py-3 text-sm font-bold text-white transition hover:bg-orange-700 disabled:opacity-60">
                {saving ? "Saving..." : `Add to ${current.label} Future Slot`}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">Your Reserved Questions</h2>
                <p className="mt-1 text-xs font-medium text-slate-500">Only future-slot questions are shown here. The existing 1,200 + 500 + 1,500 + 1,650 + more sets remain untouched.</p>
              </div>
              <button onClick={load} className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50">Refresh</button>
            </div>

            {loading ? (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">Loading reserved questions…</div>
            ) : currentQuestions.length === 0 ? (
              <div className="mt-6 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50/50 p-8 text-center">
                <BrainCircuit className="mx-auto h-10 w-10 text-orange-500" />
                <div className="mt-3 font-display text-lg font-bold text-slate-900">Empty reserved space ready</div>
                <p className="mt-1 text-sm text-slate-600">Add your first future {current.label} question using the form on the left.</p>
              </div>
            ) : (
              <ul className="mt-5 space-y-3">
                {currentQuestions.map((q, idx) => (
                  <li key={q.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-black text-white">Future {idx + 1}</span>
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">{q.difficulty}</span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">{q.questionType}</span>
                          {q.isPyq && <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-700">PYQ</span>}
                          {q.year && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">{q.year}</span>}
                        </div>
                        <p className="mt-2 text-sm font-bold leading-relaxed text-slate-900">{q.questionText}</p>
                        {q.questionType !== "numerical" ? (
                          <ol className="mt-2 space-y-1 text-xs text-slate-600">
                            {q.options.map((option, i) => (
                              <li key={i} className={i === q.correctIndex || (q.correctIndices ?? []).includes(i) ? "font-bold text-emerald-700" : ""}>
                                {String.fromCharCode(65 + i)}. {option}
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <div className="mt-2 text-xs font-bold text-slate-700">
                            Answer: {q.numericalAnswer ?? "—"} {q.numericalUnit ?? ""}
                            {q.numericalTolerance ? ` ± ${q.numericalTolerance}` : ""}
                          </div>
                        )}
                        {q.explanation && <p className="mt-2 text-xs leading-relaxed text-slate-500">{q.explanation}</p>}
                      </div>
                      <button onClick={() => remove(q.id)} className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100" aria-label="Delete future question">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xl">{toast}</div>}
      <style jsx>{`
        .input { width: 100%; border-radius: 0.75rem; border: 1px solid #e2e8f0; background: #f8fafc; padding: 0.65rem 0.75rem; font-size: 0.85rem; outline: none; }
        .input:focus { border-color: #fb923c; background: white; box-shadow: 0 0 0 3px rgba(251,146,60,0.15); }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}
