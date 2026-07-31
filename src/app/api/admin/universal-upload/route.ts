import { NextResponse } from "next/server";
import {
  parseTextToQuestions,
  parseJsonQuestions,
  parseRowsToQuestions,
  type ParsedQuestion,
} from "@/lib/universal-parser";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// --- Extract text per PDF page so each question can retain its original figure page ---
async function extractPdfPages(buf: Buffer): Promise<string[]> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: false });
  return (Array.isArray(text) ? text : [text]).map((page) => String(page ?? ""));
}

async function persistPracticePdf(buf: Buffer): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", "practice");
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.pdf`;
  await writeFile(path.join(dir, name), buf);
  return `/api/practice/files/${name}`;
}

async function parsePdfBuffer(
  buf: Buffer,
  defaults: { year: number; unit: number },
): Promise<UploadResult> {
  const pages = await extractPdfPages(buf);
  const pdfUrl = await persistPracticePdf(buf);
  const questions: ParsedQuestion[] = [];

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const parsed = parseTextToQuestions(pages[pageIndex], defaults);
    for (const item of parsed) {
      // Keep the original page so PDF-embedded circuit diagrams, plots,
      // geometry and equations are always visible in Practice.
      item.imageUrl = `pdf-page:${pdfUrl}#${pageIndex + 1}`;
      questions.push(item);
    }
  }

  const fullText = pages.join("\n");
  if (questions.length === 0) {
    // Scanned/image-only PDF fallback: one editable numerical figure card per page.
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      questions.push({
        questionText: `Scanned PDF — Page ${pageIndex + 1}. Edit this question and enter its answer in the preview before starting.`,
        questionType: "numerical",
        options: [],
        correctIndex: 0,
        correctIndices: [],
        numericalAnswer: null,
        numericalTolerance: 0,
        numericalUnit: "",
        explanation: "The original PDF page is preserved below for figure-based practice.",
        imageUrl: `pdf-page:${pdfUrl}#${pageIndex + 1}`,
        year: defaults.year,
        unit: defaults.unit,
        include: true,
      });
    }
  }

  return {
    questions,
    format: fullText.trim() ? "pdf-with-original-pages" : "scanned-pdf-pages",
    totalChars: fullText.length,
  };
}

async function fetchRemotePdf(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: { "User-Agent": "NPTELQuiz/1.0 PDF Practice" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`PDF link returned HTTP ${response.status}.`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("pdf") && !/\.pdf(?:[?#]|$)/i.test(url)) {
    throw new Error("The URL did not return a PDF document.");
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 5 || buffer.subarray(0, 5).toString() !== "%PDF-") {
    throw new Error("The URL response is not a readable PDF file.");
  }
  return buffer;
}

// --- Extract text from DOCX ---
async function extractDocx(buf: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const r = await mammoth.extractRawText({ buffer: buf });
  return r.value;
}

// --- Parse Excel (xls/xlsx) ---
async function parseExcel(
  buf: Buffer,
): Promise<Record<string, string>[]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
    defval: "",
    raw: false,
  });
}

// --- Parse CSV robustly ---
function parseCsvText(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === "," && !inQ) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((c) => c.trim());
  };

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = cols[j] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

// --- Fetch URL content ---
async function fetchUrl(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: { "User-Agent": "NPTELQuizBot/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`Failed to fetch URL: ${r.status}`);
  const ct = r.headers.get("content-type") ?? "";
  if (ct.includes("json")) {
    return JSON.stringify(await r.json());
  }
  return await r.text();
}

// --- Detect and parse JSON from string ---
function tryParseJson(text: string): unknown | null {
  const trimmed = text.trim();
  if (
    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    (trimmed.startsWith("{") && trimmed.endsWith("}"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  return null;
}

type UploadResult = {
  questions: ParsedQuestion[];
  format: string;
  rawPreview?: string;
  totalChars: number;
};

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let defaults = { year: new Date().getFullYear(), unit: 1 };

    // --- JSON body (API / paste) ---
    if (contentType.includes("application/json")) {
      const body = await req.json();

      // Extract defaults
      if (body.year) defaults.year = parseInt(body.year, 10) || defaults.year;
      if (body.unit) defaults.unit = parseInt(body.unit, 10) || defaults.unit;

      // If raw text is pasted
      if (typeof body.text === "string" && body.text.trim()) {
        const text = body.text.trim();
        // Try JSON first
        const jsonParsed = tryParseJson(text);
        if (jsonParsed) {
          const qs = parseJsonQuestions(jsonParsed, defaults);
          return NextResponse.json({ questions: qs, format: "json-paste", totalChars: text.length });
        }
        // Try CSV (has headers with comma)
        const lines = text.split(/\r?\n/).filter((l: string) => l.trim());
        const firstLine = lines[0]?.toLowerCase() ?? "";
        if (
          lines.length >= 2 &&
          (firstLine.includes("question") || firstLine.includes("option")) &&
          firstLine.includes(",")
        ) {
          const rows = parseCsvText(text);
          const qs = parseRowsToQuestions(rows, defaults);
          return NextResponse.json({ questions: qs, format: "csv-paste", totalChars: text.length });
        }
        // Default: treat as freeform text
        const qs = parseTextToQuestions(text, defaults);
        return NextResponse.json({
          questions: qs,
          format: "text-paste",
          totalChars: text.length,
          rawPreview: qs.length === 0 ? text.slice(0, 2000) : undefined,
        });
      }

      // If URL: direct PDFs get page-preserving figure support.
      if (typeof body.url === "string" && body.url.trim()) {
        const url = body.url.trim();
        if (/\.pdf(?:[?#]|$)/i.test(url)) {
          const pdfBuffer = await fetchRemotePdf(url);
          const result = await parsePdfBuffer(pdfBuffer, defaults);
          return NextResponse.json({ ...result, format: "url-pdf-with-original-pages" });
        }

        const content = await fetchUrl(url);
        const jsonParsed = tryParseJson(content);
        if (jsonParsed) {
          const qs = parseJsonQuestions(jsonParsed, defaults);
          return NextResponse.json({ questions: qs, format: "url-json", totalChars: content.length });
        }
        // Try as HTML / plain text
        const cleanText = content
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, "\n")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&#\d+;/g, "");
        const qs = parseTextToQuestions(cleanText, defaults);
        return NextResponse.json({
          questions: qs,
          format: "url-text",
          totalChars: content.length,
          rawPreview: qs.length === 0 ? cleanText.slice(0, 2000) : undefined,
        });
      }

      // If questions array directly
      if (body.questions || Array.isArray(body)) {
        const data = body.questions ?? body;
        const qs = parseJsonQuestions(data, defaults);
        return NextResponse.json({ questions: qs, format: "json-api", totalChars: JSON.stringify(body).length });
      }

      return NextResponse.json({ error: "Provide text, url, or questions array" }, { status: 400 });
    }

    // --- FormData (file upload) ---
    const fd = await req.formData();
    const file = fd.get("file");
    const yearStr = fd.get("year");
    const unitStr = fd.get("unit");
    if (yearStr) defaults.year = parseInt(String(yearStr), 10) || defaults.year;
    if (unitStr) defaults.unit = parseInt(String(unitStr), 10) || defaults.unit;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const maxBytes = 20 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 400 });
    }

    const name = file.name.toLowerCase();
    const buf = Buffer.from(await file.arrayBuffer());

    let result: UploadResult;

    if (name.endsWith(".json") || file.type === "application/json") {
      const text = buf.toString("utf-8");
      const parsed = JSON.parse(text);
      const qs = parseJsonQuestions(parsed, defaults);
      result = { questions: qs, format: "json", totalChars: text.length };
    } else if (name.endsWith(".csv") || file.type === "text/csv") {
      const text = buf.toString("utf-8");
      const rows = parseCsvText(text);
      const qs = parseRowsToQuestions(rows, defaults);
      result = { questions: qs, format: "csv", totalChars: text.length };
    } else if (
      name.endsWith(".xlsx") ||
      name.endsWith(".xls") ||
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel"
    ) {
      const rows = await parseExcel(buf);
      const qs = parseRowsToQuestions(rows, defaults);
      result = { questions: qs, format: "excel", totalChars: JSON.stringify(rows).length };
    } else if (name.endsWith(".pdf") || file.type === "application/pdf") {
      const pages = await extractPdfPages(buf);
      const pdfUrl = await persistPracticePdf(buf);
      const qs: ParsedQuestion[] = [];

      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const pageText = pages[pageIndex];
        const parsed = parseTextToQuestions(pageText, defaults);
        for (const item of parsed) {
          // Preserve the complete original page. This guarantees all diagrams,
          // equations, circuit figures and table layouts remain visible even
          // when the PDF text extractor cannot extract embedded images.
          item.imageUrl = `pdf-page:${pdfUrl}#${pageIndex + 1}`;
          qs.push(item);
        }
      }

      const fullText = pages.join("\n");

      // Scanned/image-only PDFs have no extractable text. Never return an empty
      // result: expose every original page as an editable figure-numerical card.
      // The user can type the question/answer in preview while retaining the
      // complete page image, including diagrams and mathematical notation.
      if (qs.length === 0) {
        for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
          qs.push({
            questionText: `Scanned GATE PDF — Page ${pageIndex + 1}. Read the original question and figure shown below, then enter the numerical answer. Edit this title and answer in preview if required.`,
            questionType: "numerical",
            options: [],
            correctIndex: 0,
            correctIndices: [],
            numericalAnswer: null,
            numericalTolerance: 0,
            numericalUnit: "",
            explanation: "Original scanned PDF page preserved for figure-based practice.",
            imageUrl: `pdf-page:${pdfUrl}#${pageIndex + 1}`,
            year: defaults.year,
            unit: defaults.unit,
            include: true,
          });
        }
      }

      result = {
        questions: qs,
        format: fullText.trim() ? "pdf-with-original-pages" : "scanned-pdf-pages",
        totalChars: fullText.length,
        rawPreview: undefined,
      };
    } else if (
      name.endsWith(".docx") ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const text = await extractDocx(buf);
      const qs = parseTextToQuestions(text, defaults);
      result = {
        questions: qs,
        format: "docx",
        totalChars: text.length,
        rawPreview: qs.length === 0 ? text.slice(0, 2000) : undefined,
      };
    } else if (
      name.endsWith(".txt") ||
      name.endsWith(".md") ||
      name.endsWith(".markdown") ||
      file.type.startsWith("text/")
    ) {
      const text = buf.toString("utf-8");
      // Auto-detect if it's JSON
      const jsonParsed = tryParseJson(text);
      if (jsonParsed) {
        const qs = parseJsonQuestions(jsonParsed, defaults);
        result = { questions: qs, format: "json", totalChars: text.length };
      } else {
        // Check if CSV-like
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        const firstLine = lines[0]?.toLowerCase() ?? "";
        if (
          lines.length >= 2 &&
          (firstLine.includes("question") || firstLine.includes("option")) &&
          firstLine.includes(",")
        ) {
          const rows = parseCsvText(text);
          const qs = parseRowsToQuestions(rows, defaults);
          result = { questions: qs, format: "csv", totalChars: text.length };
        } else {
          const qs = parseTextToQuestions(text, defaults);
          result = {
            questions: qs,
            format: "text",
            totalChars: text.length,
            rawPreview: qs.length === 0 ? text.slice(0, 2000) : undefined,
          };
        }
      }
    } else if (name.endsWith(".doc")) {
      return NextResponse.json(
        { error: "Legacy .doc is not supported. Please save as .docx or PDF." },
        { status: 400 },
      );
    } else if (name.endsWith(".html") || name.endsWith(".htm")) {
      const text = buf.toString("utf-8");
      const cleanText = text
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, "\n")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
      const qs = parseTextToQuestions(cleanText, defaults);
      result = {
        questions: qs,
        format: "html",
        totalChars: text.length,
        rawPreview: qs.length === 0 ? cleanText.slice(0, 2000) : undefined,
      };
    } else {
      // Try as text
      const text = buf.toString("utf-8");
      const qs = parseTextToQuestions(text, defaults);
      result = {
        questions: qs,
        format: "unknown",
        totalChars: text.length,
        rawPreview: qs.length === 0 ? text.slice(0, 2000) : undefined,
      };
    }

    return NextResponse.json({
      fileName: file.name,
      ...result,
      parsedCount: result.questions.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to process";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
