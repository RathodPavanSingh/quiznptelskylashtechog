"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  Link2,
  ClipboardPaste,
  FileText,
  Loader2,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  Eye,
  BookOpenCheck,
  Layers3,
  Hash,
  ImageIcon,
  CircuitBoard,
  Bookmark,
  BookmarkCheck,
  Menu,
  X,
  BarChart3,
  Clock,
  Zap,
  Target,
  TrendingUp,
  Flag,
  ChevronUp,
  Shuffle,
  Download,
  Gauge,
  Printer,
  ArrowUpDown,
  ThumbsUp,
  ThumbsDown,
  Minus,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { QuestionTimer, SessionTimer } from "@/components/PracticeTimer";
import type { ParsedQuestion } from "@/lib/universal-parser";
import { GATE_SCIENTIFIC_QUESTIONS } from "@/lib/gate-scientific-mock";
import { MathText } from "@/components/MathText";
import { PdfQuestionFigure, parsePdfPageMarker } from "@/components/PdfQuestionFigure";

type Source = "file" | "gatepdf" | "link" | "paste";
type Answer = number | number[] | string | null;

const TYPE_STYLE = {
  mcq: "bg-blue-100 text-blue-700",
  msq: "bg-emerald-100 text-emerald-700",
  numerical: "bg-amber-100 text-amber-800",
  figure: "bg-violet-100 text-violet-700",
} as const;

export default function PracticeWorkspace() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<Source>("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState("");
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [practicing, setPracticing] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [bookmarks, setBookmarks] = useState<Record<number, boolean>>({});

  // New professional features
  const [shuffleOnStart, setShuffleOnStart] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
  const [questionTimings, setQuestionTimings] = useState<Record<number, number>>({});
  const [confidences, setConfidences] = useState<Record<number, 1 | 2 | 3 | 4 | 5>>({});

  const stats = useMemo(() => {
    const result = { mcq: 0, msq: 0, numerical: 0, figure: 0 };
    for (const q of questions) result[q.questionType] += 1;
    return result;
  }, [questions]);

  const score = useMemo(() => {
    return questions.reduce((total, q, i) => total + (checked[i] && isCorrect(q, answers[i]) ? 1 : 0), 0);
  }, [questions, checked, answers]);

  async function parseInput() {
    setError(null);
    setLoading(true);
    try {
      let res: Response;
      if (source === "file" || source === "gatepdf") {
        if (!file) throw new Error(source === "gatepdf" ? "Choose a GATE PDF with figures first." : "Choose a PDF, document, spreadsheet, or text file first.");
        const form = new FormData();
        form.append("file", file);
        form.append("year", String(new Date().getFullYear()));
        form.append("unit", "1");
        if (source === "gatepdf") form.append("preserveFigures", "1");
        res = await fetch("/api/admin/universal-upload", { method: "POST", body: form });
      } else if (source === "link") {
        if (!url.trim()) throw new Error("Enter a valid question document or webpage URL.");
        res = await fetch("/api/admin/universal-upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: url.trim(), year: new Date().getFullYear(), unit: 1 }),
        });
      } else {
        if (!text.trim()) throw new Error("Paste formatted questions first.");
        res = await fetch("/api/admin/universal-upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text, year: new Date().getFullYear(), unit: 1 }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to parse this source.");
      const parsed = (data.questions ?? []) as ParsedQuestion[];
      if (parsed.length === 0) throw new Error("No questions were detected. Check the formatting guide and try again.");
      setQuestions(parsed.map((q) => ({ ...q, include: true })));
      setFormat(String(data.format ?? "automatic"));
      setPracticing(false);
      setIndex(0);
      setAnswers({});
      setChecked({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  function begin() {
    const active = questions.filter((q) => q.include);
    if (active.length === 0) return setError("Select at least one question to practice.");
    const missing = active.find((q) => q.questionType === "numerical" && q.numericalAnswer == null);
    if (missing) {
      return setError("Enter the correct numerical answer for every selected scanned/page question before starting practice.");
    }
    const invalidOptions = active.find((q) => q.questionType !== "numerical" && q.options.length < 2);
    if (invalidOptions) {
      return setError("Each selected MCQ/MSQ/Figure question needs at least two editable options.");
    }
    const missingMsq = active.find((q) => q.questionType === "msq" && (q.correctIndices ?? []).length === 0);
    if (missingMsq) {
      return setError("Select every correct option for each MSQ question before starting practice.");
    }
    let ordered = [...active];
    if (shuffleOnStart) {
      for (let i = ordered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
      }
    }
    setQuestions(ordered);
    setIndex(0);
    setAnswers({});
    setChecked({});
    setBookmarks({});
    setQuestionTimings({});
    setConfidences({});
    setPracticing(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function loadGateScientific() {
    setQuestions(GATE_SCIENTIFIC_QUESTIONS.map(q => ({ ...q, include: true })));
    setFormat("GATE 2026 Scientific");
    setPracticing(false);
    setIndex(0);
    setAnswers({});
    setChecked({});
    setBookmarks({});
    setError(null);
  }

  function reset() {
    setPracticing(false);
    setQuestions([]);
    setAnswers({});
    setChecked({});
    setBookmarks({});
    setQuestionTimings({});
    setConfidences({});
    setIndex(0);
    setError(null);
    setFile(null);
    setText("");
    setUrl("");
  }

  if (practicing && questions.length > 0) {
    return (
      <PracticeSession
        questions={questions}
        index={index}
        setIndex={setIndex}
        answers={answers}
        setAnswers={setAnswers}
        checked={checked}
        setChecked={setChecked}
        bookmarks={bookmarks}
        setBookmarks={setBookmarks}
        score={score}
        darkMode={darkMode}
        fontSize={fontSize}
        questionTimings={questionTimings}
        setQuestionTimings={setQuestionTimings}
        confidences={confidences}
        setConfidences={setConfidences}
        onExit={() => setPracticing(false)}
        onReset={() => {
          setAnswers({});
          setChecked({});
          setBookmarks({});
          setIndex(0);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <section className="border-b border-slate-200 bg-linear-to-b from-orange-50 to-white">
        <div className="mx-auto max-w-5xl px-5 py-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-widest text-orange-700 shadow-sm">
            <BookOpenCheck className="h-3.5 w-3.5" /> Personal Practice Lab
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Bring questions. Start practicing.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Upload any PDF or document, import a public link, or paste formatted questions. The system automatically recognizes MCQ, MSQ, numerical, and figure-based questions.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <TypePill icon={BookOpenCheck} label="MCQ" className="bg-blue-100 text-blue-700" />
            <TypePill icon={Layers3} label="MSQ" className="bg-emerald-100 text-emerald-700" />
            <TypePill icon={Hash} label="Numerical" className="bg-amber-100 text-amber-800" />
            <TypePill icon={ImageIcon} label="Figure based" className="bg-violet-100 text-violet-700" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-5 px-5 py-8 lg:grid-cols-[1fr_310px]">
        <div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            {/* GATE Scientific Practice Presets */}
            <div className="mb-5 rounded-2xl border border-violet-200 bg-linear-to-r from-violet-50 via-white to-purple-50 p-5 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-lg">⚡</span>
                  <div>
                    <h3 className="font-display text-base font-black text-slate-900">GATE 2026 Scientific Practice Paper</h3>
                    <p className="text-xs text-slate-500">Auto-render complex circuitry &amp; mathematical equations</p>
                  </div>
                </div>
                <button
                  onClick={loadGateScientific}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-black text-white hover:bg-violet-700 shadow-md transition"
                >
                  Launch Paper
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 sm:grid-cols-4">
              <SourceButton active={source === "file"} onClick={() => { setSource("file"); setFile(null); }} icon={UploadCloud} label="Upload" />
              <SourceButton active={source === "gatepdf"} onClick={() => { setSource("gatepdf"); setFile(null); }} icon={CircuitBoard} label="GATE PDF" />
              <SourceButton active={source === "link"} onClick={() => setSource("link")} icon={Link2} label="Link" />
              <SourceButton active={source === "paste"} onClick={() => setSource("paste")} icon={ClipboardPaste} label="Paste" />
            </div>

            {source === "file" && (
              <div
                className={`mt-5 flex min-h-60 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center transition ${
                  dragging ? "border-orange-500 bg-orange-50" : "border-slate-300 bg-slate-50 hover:border-orange-400 hover:bg-orange-50/50"
                }`}
                onClick={() => fileRef.current?.click()}
                onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files[0];
                  if (f) setFile(f);
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt,.md,.json,.csv,.xlsx,.xls,.html,.htm,application/pdf,text/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                  {file ? <FileText className="h-7 w-7" /> : <UploadCloud className="h-7 w-7" />}
                </span>
                <h2 className="mt-4 font-display text-lg font-bold text-slate-900">
                  {file ? file.name : "Drop your question file here"}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  PDF · DOCX · TXT · JSON · CSV · Excel · HTML · Markdown · maximum 20 MB
                </p>
                {file && (
                  <span className="mt-3 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                    {(file.size / 1024).toFixed(1)} KB · click to replace
                  </span>
                )}
              </div>
            )}

            {source === "gatepdf" && (
              <div
                className={`mt-5 flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center transition ${
                  dragging
                    ? "border-violet-500 bg-violet-50"
                    : "border-violet-300 bg-linear-to-b from-violet-50 to-white hover:border-violet-500"
                }`}
                onClick={() => fileRef.current?.click()}
                onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files[0];
                  if (f?.type === "application/pdf" || f?.name.toLowerCase().endsWith(".pdf")) setFile(f);
                  else setError("GATE PDF mode accepts PDF files only.");
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
                  {file ? <FileText className="h-8 w-8" /> : <CircuitBoard className="h-8 w-8" />}
                </span>
                <h2 className="mt-4 font-display text-xl font-black text-slate-900">
                  {file ? file.name : "Drop GATE / engineering PDF here"}
                </h2>
                <p className="mt-2 max-w-lg text-xs leading-relaxed text-slate-600">
                  Specialized mode for two-column exam papers, circuit diagrams, geometry figures,
                  plots, equations, options in tables, and numerical-answer blanks. Every question
                  keeps its original PDF page so embedded figures are never lost.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">Circuit figures</span>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">Numerical</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">MCQ / MSQ</span>
                  <span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-700">Math symbols</span>
                </div>
                {file && (
                  <span className="mt-4 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-violet-200">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · original pages will be retained
                  </span>
                )}
              </div>
            )}

            {source === "link" && (
              <div className="mt-5 min-h-60 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex h-full flex-col justify-center">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Question source URL</label>
                  <div className="relative mt-2">
                    <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://gate2026.iitg.ac.in/doc/download/2025/EE2025.pdf"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    />
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    Works with public web pages, direct text documents, and JSON endpoints. The parser removes page markup and detects question blocks automatically.
                  </p>
                </div>
              </div>
            )}

            {source === "paste" && (
              <div className="mt-5">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={11}
                  placeholder={`Q1. Which is a prime number?\nA) 4\nB) 7\nC) 8\nD) 9\nAnswer: B\nExplanation: 7 has only two factors.\n\nQ2. Select all even numbers.\nA) 2\nB) 3\nC) 4\nAnswer: A, C`}
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-cyan-100 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Insert math operation / symbol</div>
                  <div className="flex flex-wrap gap-1.5">
                    {["+", "−", "×", "÷", "=", "≠", "≈", "<", ">", "≤", "≥", "±", "√", "∛", "∫", "∮", "∑", "∏", "∞", "π", "Ω", "μ", "α", "β", "γ", "δ", "θ", "λ", "φ", "Δ", "∂", "∇", "→", "↔", "°", "²", "³", "⁻¹", "₀", "₁", "₂"].map((symbol) => (
                      <button
                        key={symbol}
                        type="button"
                        onClick={() => setText((value) => value + symbol)}
                        className="min-w-8 rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-serif text-sm font-bold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["$\\frac{a}{b}$", "$x^{2}$", "$x_{1}$", "$\\sqrt{x}$", "$\\int_a^b f(x)dx$", "$\\lim_{x\\to0}$", "$\\sin(\\theta)$", "$\\log(x)$", "$\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix}$"].map((snippet) => (
                      <button
                        key={snippet}
                        type="button"
                        onClick={() => setText((value) => value + snippet)}
                        className="rounded-lg bg-slate-900 px-2.5 py-1.5 font-mono text-[10px] font-bold text-cyan-200 transition hover:bg-slate-800"
                      >
                        {snippet}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              onClick={parseInput}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-orange-600 to-amber-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              {loading ? "Detecting & formatting…" : "Format and preview questions"}
            </button>
          </div>

          {questions.length > 0 && (
            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Parsed · {format}</div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">{questions.length} questions ready</h2>
                </div>
                {/* Practice settings panel */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Practice Settings</div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {/* Shuffle */}
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={shuffleOnStart}
                        onChange={(e) => setShuffleOnStart(e.target.checked)}
                        className="accent-orange-600"
                      />
                      <Shuffle className="h-3.5 w-3.5 text-slate-500" />
                      Shuffle order
                    </label>
                    {/* Dark mode */}
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={darkMode}
                        onChange={(e) => setDarkMode(e.target.checked)}
                        className="accent-slate-900"
                      />
                      {darkMode ? <MoonIcon /> : <SunIcon />}
                      Dark mode
                    </label>
                    {/* Font size */}
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700">
                      <ZoomIn className="h-3.5 w-3.5 text-slate-500" />
                      <select
                        value={fontSize}
                        onChange={(e) => setFontSize(e.target.value as "sm" | "md" | "lg")}
                        className="bg-transparent text-xs font-semibold outline-none"
                      >
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                      </select>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                    <RotateCcw className="h-3.5 w-3.5" /> Clear
                  </button>
                  <button onClick={begin} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800">
                    <Play className="h-3.5 w-3.5 fill-current" /> Start Practice
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {questions.map((q, i) => (
                  <div key={i} className={`rounded-xl border p-3 transition ${q.include ? "border-slate-200 bg-slate-50" : "border-slate-100 bg-white opacity-55"}`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={q.include}
                        onChange={(e) => setQuestions((prev) => prev.map((item, x) => x === i ? { ...item, include: e.target.checked } : item))}
                        className="mt-1 h-4 w-4 accent-orange-600"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-400">Q{i + 1}</span>
                          <select
                            value={q.questionType}
                            onChange={(e) => setQuestions((prev) => prev.map((item, x) => x === i ? { ...item, questionType: e.target.value as ParsedQuestion["questionType"] } : item))}
                            className={`rounded-full border-0 px-2 py-0.5 text-[10px] font-bold uppercase outline-none ${TYPE_STYLE[q.questionType]}`}
                          >
                            <option value="mcq">MCQ</option>
                            <option value="msq">MSQ</option>
                            <option value="numerical">Numerical</option>
                            <option value="figure">Figure</option>
                          </select>
                          {q.imageUrl && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">original figure/page</span>}
                          {q.questionType === "numerical" && q.numericalAnswer == null && (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">answer required</span>
                          )}
                        </div>
                        <textarea
                          value={q.questionText}
                          onChange={(e) => setQuestions((prev) => prev.map((item, x) => x === i ? { ...item, questionText: e.target.value } : item))}
                          rows={2}
                          className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold leading-relaxed text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                        />

                        {q.questionType === "numerical" && (
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            <input
                              type="number"
                              step="any"
                              value={q.numericalAnswer ?? ""}
                              onChange={(e) => setQuestions((prev) => prev.map((item, x) => x === i ? { ...item, numericalAnswer: e.target.value === "" ? null : Number(e.target.value) } : item))}
                              placeholder="Correct answer"
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-violet-400"
                            />
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={q.numericalTolerance ?? 0}
                              onChange={(e) => setQuestions((prev) => prev.map((item, x) => x === i ? { ...item, numericalTolerance: Number(e.target.value) || 0 } : item))}
                              placeholder="Tolerance ±"
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-violet-400"
                            />
                            <input
                              value={q.numericalUnit ?? ""}
                              onChange={(e) => setQuestions((prev) => prev.map((item, x) => x === i ? { ...item, numericalUnit: e.target.value } : item))}
                              placeholder="Unit (Ω, MW...)"
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-violet-400"
                            />
                          </div>
                        )}

                        {q.questionType !== "numerical" && q.options.length > 0 && (
                          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                            {q.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setQuestions((prev) => prev.map((item, x) => {
                                    if (x !== i) return item;
                                    if (item.questionType === "msq") {
                                      const current = item.correctIndices ?? [];
                                      return {
                                        ...item,
                                        correctIndices: current.includes(optionIndex)
                                          ? current.filter((v) => v !== optionIndex)
                                          : [...current, optionIndex].sort((a, b) => a - b),
                                      };
                                    }
                                    return { ...item, correctIndex: optionIndex };
                                  }))}
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center ${q.questionType === "msq" ? "rounded-md" : "rounded-full"} text-[10px] font-black ${(q.questionType === "msq" ? (q.correctIndices ?? []).includes(optionIndex) : q.correctIndex === optionIndex) ? "bg-emerald-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"}`}
                                >
                                  {q.questionType === "msq" && (q.correctIndices ?? []).includes(optionIndex) ? "✓" : String.fromCharCode(65 + optionIndex)}
                                </button>
                                <input
                                  value={option}
                                  onChange={(e) => setQuestions((prev) => prev.map((item, x) => x === i ? { ...item, options: item.options.map((o, oi) => oi === optionIndex ? e.target.value : o) } : item))}
                                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-violet-400"
                                  aria-label={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-900 p-5 text-white shadow-xl">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Auto detection</div>
            <h2 className="mt-2 font-display text-xl font-bold">How formatting works</h2>
            <ol className="mt-4 space-y-4 text-xs leading-relaxed text-slate-300">
              <li className="flex gap-3"><Step n="1" /> Extract readable text or spreadsheet rows.</li>
              <li className="flex gap-3"><Step n="2" /> Detect question, choices, correct answer, explanation and figures.</li>
              <li className="flex gap-3"><Step n="3" /> Classify MCQ, multiple-select, numerical, or figure question.</li>
              <li className="flex gap-3"><Step n="4" /> Preview, select, and launch your private practice session.</li>
            </ol>
          </div>

          {questions.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Question mix</div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {Object.entries(stats).map(([key, value]) => (
                  <div key={key} className={`rounded-xl p-3 ${TYPE_STYLE[key as keyof typeof TYPE_STYLE]}`}>
                    <div className="font-display text-2xl font-bold tabular-nums">{value}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider">{key}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Formatting guide</div>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-slate-100 p-3 font-mono text-[10px] leading-relaxed text-slate-600">{`Q1. Question text?\nA) First option\nB) Second option\nAnswer: B\nExplanation: Why B is correct.\n\nMSQ: Answer: A, C\nNumerical: Answer: 42\nTolerance: 0.5\nFigure: Image: https://...`}</pre>
          </div>
        </aside>
      </div>
    </main>
  );
}

function isCorrect(q: ParsedQuestion, answer: Answer): boolean {
  if (q.questionType === "numerical") {
    const numeric = typeof answer === "string" ? Number(answer) : NaN;
    if (!Number.isFinite(numeric) || q.numericalAnswer == null) return false;
    return Math.abs(numeric - q.numericalAnswer) <= (q.numericalTolerance ?? 0);
  }
  if (q.questionType === "msq" || (q.questionType === "figure" && q.correctIndices.length > 0)) {
    if (!Array.isArray(answer)) return false;
    const a = [...answer].sort((x, y) => x - y);
    const b = [...q.correctIndices].sort((x, y) => x - y);
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  return typeof answer === "number" && answer === q.correctIndex;
}

function PracticeSession({
  questions,
  index,
  setIndex,
  answers,
  setAnswers,
  checked,
  setChecked,
  bookmarks,
  setBookmarks,
  score,
  darkMode,
  fontSize,
  questionTimings,
  setQuestionTimings,
  confidences,
  setConfidences,
  onExit,
  onReset,
}: {
  questions: ParsedQuestion[];
  index: number;
  setIndex: (i: number) => void;
  answers: Record<number, Answer>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, Answer>>>;
  checked: Record<number, boolean>;
  setChecked: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  bookmarks: Record<number, boolean>;
  setBookmarks: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  score: number;
  darkMode: boolean;
  fontSize: "sm" | "md" | "lg";
  questionTimings: Record<number, number>;
  setQuestionTimings: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  confidences: Record<number, 1 | 2 | 3 | 4 | 5>;
  setConfidences: React.Dispatch<React.SetStateAction<Record<number, 1 | 2 | 3 | 4 | 5>>>;
  onExit: () => void;
  onReset: () => void;
}) {
  const q = questions[index];
  const answer = answers[index] ?? (q.questionType === "msq" ? [] : null);
  const isChecked = !!checked[index];
  const correct = isChecked && isCorrect(q, answer);
  const multiple = q.questionType === "msq" || (q.questionType === "figure" && q.correctIndices.length > 0);
  const done = Object.keys(checked).length === questions.length;
  const hasAnswer = q.questionType === "numerical"
    ? typeof answer === "string" && answer.trim() !== ""
    : multiple
    ? Array.isArray(answer) && answer.length > 0
    : typeof answer === "number";

  const [calcOpen, setCalcOpen] = useState(false);
  const [calcInput, setCalcInput] = useState("");
  const [calcResult, setCalcResult] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "n" || e.key === "N") {
        e.preventDefault();
        if (index < questions.length - 1) setIndex(index + 1);
      }
      if (e.key === "ArrowLeft" || e.key === "p" || e.key === "P") {
        e.preventDefault();
        if (index > 0) setIndex(index - 1);
      }
      if ((e.key === "s" || e.key === "S") && hasAnswer && !isChecked) {
        e.preventDefault();
        setChecked((prev) => ({ ...prev, [index]: true }));
      }
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        setBookmarks((prev) => ({ ...prev, [index]: !prev[index] }));
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSidebarOpen((p) => !p);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [index, questions.length, setIndex, setChecked, setBookmarks, hasAnswer, isChecked]);

  const pressKey = (char: string) => {
    setCalcInput((p) => p + char);
  };
  const evaluateCalc = () => {
    try {
      // safe evaluation for basic math expression
      const san = calcInput
        .replace(/π/g, "Math.PI")
        .replace(/sin\(/g, "Math.sin(")
        .replace(/cos\(/g, "Math.cos(")
        .replace(/tan\(/g, "Math.tan(")
        .replace(/log\(/g, "Math.log10(")
        .replace(/ln\(/g, "Math.log(")
        .replace(/sqrt\(/g, "Math.sqrt(")
        .replace(/pow\(/g, "Math.pow(")
        .replace(/e/g, "Math.E");
      
      const res = new Function(`return ${san}`)();
      setCalcResult(Number.isFinite(res) ? String(Number(res).toFixed(4)) : "Error");
    } catch {
      setCalcResult("Error");
    }
  };
  const clearCalc = () => {
    setCalcInput("");
    setCalcResult("");
  };

  const startTimestamp = useRef(0);

  // Record timing when checking answer
  function recordTiming() {
    if (!questionTimings[index]) {
      setQuestionTimings((prev) => ({ ...prev, [index]: Date.now() - startTimestamp.current }));
    }
  }

  // Reset timestamp on question change
  useEffect(() => {
    startTimestamp.current = Date.now();
  }, [index]);

  function selectOption(i: number) {
    if (isChecked) return;
    if (multiple) {
      const current = Array.isArray(answer) ? answer : [];
      setAnswers((prev) => ({ ...prev, [index]: current.includes(i) ? current.filter((x) => x !== i) : [...current, i] }));
    } else {
      setAnswers((prev) => ({ ...prev, [index]: i }));
    }
  }

  const avgTime = useMemo(() => {
    const vals = Object.values(questionTimings);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length / 1000);
  }, [questionTimings]);

  const fontSizeClass = fontSize === "sm" ? "text-sm" : fontSize === "lg" ? "text-lg" : "text-base";
  const bg = darkMode ? "bg-slate-900" : "bg-slate-50";
  const cardBg = darkMode ? "bg-slate-800" : "bg-white";
  const border = darkMode ? "border-slate-700" : "border-slate-200";
  const text = darkMode ? "text-slate-100" : "text-slate-900";
  const subText = darkMode ? "text-slate-400" : "text-slate-500";

  return (
    <main className={`min-h-screen pb-16 transition-colors ${bg}`}>
      <header className={`${border} border-b bg-linear-to-r from-slate-900 to-slate-800 shadow-md`}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3">
          <button onClick={onExit} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900">
            <ChevronLeft className="h-4 w-4" /> Exit
          </button>
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Personal Practice</div>
            <div className="text-sm font-bold text-slate-900">Q{index + 1} / {questions.length}</div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Session timer */}
            <SessionTimer isRunning={!showAnalytics} />
            <button
              onClick={() => {
                setBookmarks((prev) => ({ ...prev, [index]: !prev[index] }));
              }}
              className="rounded-lg p-1.5 transition"
              title="Bookmark / Flag for review (B)"
            >
              {bookmarks[index] ? (
                <BookmarkCheck className="h-5 w-5 text-amber-400 fill-amber-400" />
              ) : (
                <Bookmark className="h-5 w-5 text-slate-400 hover:text-amber-400" />
              )}
            </button>
            <button
              onClick={() => setCalcOpen(!calcOpen)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              🧮
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Question navigator (Esc)"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-bold tabular-nums text-white">
              {score}/{Object.keys(checked).length}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-6">
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-orange-600 transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>

        {/* Collapsible Scientific Calculator panel matching GATE CBT interface */}
        {calcOpen && (
          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>🧮</span> GATE Scientific Calculator
              </h3>
              <button
                onClick={() => setCalcOpen(false)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                ✕ Close
              </button>
            </div>
            
            {/* Display screen */}
            <div className="mt-3 rounded-xl bg-slate-950 p-4 text-right">
              <div className="min-h-5 text-xs font-mono text-slate-500">{calcInput || "0"}</div>
              <div className="min-h-8 font-mono text-xl font-bold text-cyan-400">{calcResult || "0"}</div>
            </div>

            {/* Keypad */}
            <div className="mt-3 grid grid-cols-5 gap-1.5 text-xs font-mono">
              {/* Row 1 */}
              <button onClick={() => pressKey("sin(")} className="btn-calc">sin</button>
              <button onClick={() => pressKey("cos(")} className="btn-calc">cos</button>
              <button onClick={() => pressKey("tan(")} className="btn-calc">tan</button>
              <button onClick={() => pressKey("log(")} className="btn-calc">log₁₀</button>
              <button onClick={() => pressKey("ln(")} className="btn-calc">ln</button>

              {/* Row 2 */}
              <button onClick={() => pressKey("sqrt(")} className="btn-calc">√</button>
              <button onClick={() => pressKey("pow(")} className="btn-calc">xʸ</button>
              <button onClick={() => pressKey("π")} className="btn-calc">π</button>
              <button onClick={() => pressKey("e")} className="btn-calc">e</button>
              <button onClick={() => pressKey("(")} className="btn-calc">(</button>

              {/* Row 3 */}
              <button onClick={() => pressKey("7")} className="btn-num">7</button>
              <button onClick={() => pressKey("8")} className="btn-num">8</button>
              <button onClick={() => pressKey("9")} className="btn-num">9</button>
              <button onClick={() => pressKey(")")} className="btn-calc">)</button>
              <button onClick={() => pressKey("/")} className="btn-op">/</button>

              {/* Row 4 */}
              <button onClick={() => pressKey("4")} className="btn-num">4</button>
              <button onClick={() => pressKey("5")} className="btn-num">5</button>
              <button onClick={() => pressKey("6")} className="btn-num">6</button>
              <button onClick={() => pressKey("*")} className="btn-op">*</button>
              <button onClick={clearCalc} className="btn-clear col-span-1">C</button>

              {/* Row 5 */}
              <button onClick={() => pressKey("1")} className="btn-num">1</button>
              <button onClick={() => pressKey("2")} className="btn-num">2</button>
              <button onClick={() => pressKey("3")} className="btn-num">3</button>
              <button onClick={() => pressKey("-")} className="btn-op">-</button>
              <button onClick={evaluateCalc} className="btn-eval row-span-2 col-span-1">=</button>

              {/* Row 6 */}
              <button onClick={() => pressKey("0")} className="btn-num col-span-2">0</button>
              <button onClick={() => pressKey(".")} className="btn-num">.</button>
              <button onClick={() => pressKey("+")} className="btn-op">+</button>
            </div>
            
            <p className="mt-3 text-[10px] text-slate-400 italic">
              Tip: Press &apos;=&apos; to evaluate. Truncates/rounds up to 4 decimal places. Standard trig functions expect radian input.
            </p>
          </div>
        )}

        <article className={`mt-5 overflow-hidden rounded-3xl ${border} ${cardBg} shadow-sm transition-colors`}>
          <div className={`border-b ${border} p-5 sm:p-6 ${darkMode ? "bg-slate-800/50" : "bg-orange-50/70"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-orange-700">Q{index + 1}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${TYPE_STYLE[q.questionType]}`}>{q.questionType}</span>
              {multiple && <span className="text-[11px] font-semibold text-slate-500">Select all that apply</span>}
            </div>
            <MathText text={q.questionText} className="mt-3 text-lg font-bold leading-relaxed text-slate-950 sm:text-xl" />
          </div>

          <div className="p-5 sm:p-6">
            {q.imageUrl && <QuestionFigure value={q.imageUrl} />}

            {q.questionType === "numerical" ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Your numerical answer</label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    disabled={isChecked}
                    value={typeof answer === "string" ? answer : ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [index]: e.target.value }))}
                    placeholder="Enter value"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                  {q.numericalUnit && <span className="rounded-xl bg-slate-200 px-3 py-3 text-xs font-bold text-slate-600">{q.numericalUnit}</span>}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {q.options.map((option, i) => {
                  const selected = multiple ? Array.isArray(answer) && answer.includes(i) : answer === i;
                  const correctOpt = isChecked && (multiple ? q.correctIndices.includes(i) : i === q.correctIndex);
                  const wrong = isChecked && selected && !correctOpt;
                  return (
                    <button
                      key={i}
                      disabled={isChecked}
                      onClick={() => selectOption(i)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm transition ${
                        correctOpt
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                          : wrong
                          ? "border-rose-500 bg-rose-50 text-rose-900"
                          : selected
                          ? "border-orange-500 bg-orange-50 text-slate-900"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center text-xs font-black ${multiple ? "rounded-md" : "rounded-full"} ${selected ? "bg-orange-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"}`}>
                        {multiple && selected ? "✓" : String.fromCharCode(65 + i)}
                      </span>
                      <MathText text={option} className="min-w-0 flex-1" />
                    </button>
                  );
                })}
              </div>
            )}

            {isChecked && (
              <div className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 text-sm ${correct ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}>
                {correct ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0" />}
                <div>
                  <div className="font-bold">{correct ? "Correct!" : "Not quite."}</div>
                  {q.explanation && <MathText text={q.explanation} className="mt-1 leading-relaxed opacity-90" />}
                </div>
              </div>
            )}

            {isChecked && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Confidence:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => {
                        const val = confidences[index] ?? 0;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setConfidences((prev) => ({ ...prev, [index]: level as 1 | 2 | 3 | 4 | 5 }))}
                            className={`rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                              level <= val
                                ? level <= 2
                                  ? "bg-rose-100 text-rose-700"
                                  : level <= 3
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                            }`}
                          >
                            {level === 1 && <ThumbsDown className="h-3 w-3" />}
                            {level === 3 && <Minus className="h-3 w-3" />}
                            {level === 5 && <ThumbsUp className="h-3 w-3" />}
                            {level !== 1 && level !== 3 && level !== 5 && level}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {questionTimings[index] && (
                    <span className="text-xs font-bold text-slate-500">
                      <Clock className="mr-1 inline h-3.5 w-3.5" /> {Math.round(questionTimings[index] / 1000)}s
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => hasAnswer && setChecked((prev) => ({ ...prev, [index]: true }))}
              disabled={!hasAnswer || isChecked}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-bold text-amber-950 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-amber-100 disabled:text-amber-500"
            >
              <BookOpenCheck className="h-4 w-4" /> {isChecked ? "Answer checked" : "Check Answer"}
            </button>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                onClick={() => setIndex(Math.max(0, index - 1))}
                disabled={index === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              {index < questions.length - 1 ? (
                <button onClick={() => setIndex(index + 1)} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700">
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={onReset} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800">
                  <RotateCcw className="h-4 w-4" /> Retry
                </button>
              )}
            </div>
          </div>
        </article>

        {/* Question navigator sidebar — mobile drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-60 flex justify-end lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex w-72 flex-col bg-slate-950 shadow-2xl overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <h3 className="font-display text-sm font-bold text-white">Questions</h3>
                <button onClick={() => setSidebarOpen(false)} className="rounded p-1 text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {questions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setIndex(i); setSidebarOpen(false); }}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                      i === index
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-slate-500">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{q.questionText.slice(0, 30)}…</span>
                    <span className="flex items-center gap-1">
                      {checked[i] && (
                        <span className={`h-2 w-2 rounded-full ${isCorrect(q, answers[i]) ? "bg-emerald-400" : "bg-rose-400"}`} />
                      )}
                      {bookmarks[i] && <BookmarkCheck className="h-3 w-3 text-amber-400 fill-amber-400" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {done && !showAnalytics && (
          <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <div className="font-display text-4xl font-bold text-emerald-700">{score}/{questions.length}</div>
            <p className="mt-1 text-sm font-semibold text-emerald-800">Practice session complete</p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setShowAnalytics(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-800"
              >
                <BarChart3 className="h-4 w-4" /> View Analytics
              </button>
              <button
                onClick={onReset}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-5 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
              >
                <RotateCcw className="h-4 w-4" /> Retry
              </button>
              <Link href="/" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                <Home className="h-4 w-4" /> Home
              </Link>
            </div>
          </div>
        )}

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <div className="mt-5 space-y-4">
            <div className="rounded-3xl border border-blue-200 bg-linear-to-br from-blue-50 to-indigo-50 p-6">
              <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" /> Practice Analytics
              </h2>
              <p className="text-xs text-slate-500">Session performance breakdown</p>

              {/* Score card */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-100">
                  <div className="font-display text-3xl font-bold text-emerald-700">{score}/{questions.length}</div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">Score</div>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4 text-center ring-1 ring-blue-100">
                  <div className="font-display text-3xl font-bold text-blue-700">
                    {questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%
                  </div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">Accuracy</div>
                </div>
                <div className="rounded-2xl bg-violet-50 p-4 text-center ring-1 ring-violet-100">
                  <div className="font-display text-3xl font-bold text-violet-700">
                    {Object.keys(bookmarks).filter((k) => bookmarks[parseInt(k)]).length}
                  </div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-600">Bookmarked</div>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4 text-center ring-1 ring-amber-100">
                  <div className="font-display text-3xl font-bold text-amber-700">{avgTime}s</div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">Avg Speed</div>
                </div>
              </div>

              {/* Export button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    const exportData = questions.map((q, i) => ({
                      number: i + 1,
                      question: q.questionText,
                      type: q.questionType,
                      answer: q.questionType === "numerical" ? q.numericalAnswer : q.questionType === "msq" ? (q.correctIndices ?? []).map((c) => String.fromCharCode(65 + c)).join(",") : q.options[q.correctIndex],
                      isCorrect: checked[i] && isCorrect(q, answers[i]),
                      confidence: confidences[i] ?? 0,
                      timeSeconds: questionTimings[i] ? Math.round(questionTimings[i] / 1000) : null,
                      bookmarked: !!bookmarks[i],
                    }));
                    const blob = new Blob([JSON.stringify({ score, accuracy: Math.round((score / questions.length) * 100) + "%", questions: exportData }, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `practice-results-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" /> Export JSON
                </button>
              </div>

              {/* Question type breakdown */}
              <div className="mt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Question Type Breakdown</h3>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {(["mcq", "msq", "numerical", "figure"] as const).map((type) => {
                    const count = questions.filter((q) => q.questionType === type).length;
                    const correctCount = questions.filter((q, i) => q.questionType === type && checked[i] && isCorrect(q, answers[i])).length;
                    return (
                      <div key={type} className="rounded-xl bg-slate-900 p-3 text-center">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{type}</div>
                        <div className="mt-1 text-lg font-bold text-white">{count}</div>
                        <div className="text-[10px] text-emerald-400">{correctCount} correct</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty breakdown */}
              <div className="mt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Difficulty Analysis</h3>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(["Easy", "Medium", "Hard"] as const).map((diff) => {
                    const diffQs = questions.filter((q) => (q.difficulty ?? "Medium") === diff);
                    const diffCorrect = diffQs.filter((q) => {
                      const idx = questions.indexOf(q);
                      return checked[idx] && isCorrect(q, answers[idx]);
                    }).length;
                    return (
                      <div key={diff} className="rounded-xl bg-slate-900 p-3 text-center">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{diff}</div>
                        <div className="mt-1 text-lg font-bold text-white">{diffQs.length}</div>
                        <div className="text-[10px] text-emerald-400">{diffCorrect} correct</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bookmarked questions */}
              {Object.keys(bookmarks).filter((k) => bookmarks[parseInt(k)]).length > 0 && (
                <div className="mt-5 rounded-2xl bg-amber-50 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                    <BookmarkCheck className="h-3.5 w-3.5" /> Bookmarked for Review
                  </h3>
                  <ul className="mt-2 space-y-1">
                    {questions.map((q, i) =>
                      bookmarks[i] ? (
                        <li key={i} className="flex items-center gap-2 text-xs text-amber-800">
                          <span className="font-bold text-amber-500">Q{i + 1}</span>
                          {q.questionText.slice(0, 50)}…
                        </li>
                      ) : null
                    )}
                  </ul>
                </div>
              )}

              <div className="mt-5 flex justify-center gap-2">
                <button
                  onClick={onReset}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-700"
                >
                  <RotateCcw className="h-4 w-4" /> Retry
                </button>
                <Link href="/" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  <Home className="h-4 w-4" /> Home
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function QuestionFigure({ value }: { value: string }) {
  const pdf = parsePdfPageMarker(value);
  if (pdf) {
    return (
      <div className="mb-5">
        <PdfQuestionFigure src={pdf.src} page={pdf.page} />
      </div>
    );
  }

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={value}
        alt="Question figure"
        className="mx-auto max-h-128 max-w-full object-contain"
      />
    </div>
  );
}

function TypePill({ icon: Icon, label, className }: { icon: typeof BookOpenCheck; label: string; className: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${className}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

function SourceButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof UploadCloud; label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${active ? "bg-white text-orange-700 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function Step({ n }: { n: string }) {
  return <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white">{n}</span>;
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-amber-500">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-indigo-400">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
