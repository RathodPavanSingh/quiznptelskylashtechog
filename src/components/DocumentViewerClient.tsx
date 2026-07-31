"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  FileText,
  Table,
  Copy,
  Check,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  Code,
  FileSpreadsheet,
} from "lucide-react";

// Dynamically import PDF Canvas Viewer to prevent SSR issues
const PdfCanvasViewer = dynamic(() => import("@/components/PdfCanvasViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-slate-900 text-slate-100">
      <Loader2 className="mb-3 h-10 w-10 animate-spin text-blue-500" />
      <div className="text-sm font-semibold">Initializing PDF Canvas Engine...</div>
    </div>
  ),
});

type BookProps = {
  id: number;
  title: string;
  fileUrl: string;
  category: string;
};

export default function DocumentViewerClient({ book }: { book: BookProps }) {
  const [docData, setDocData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Normalize URL and prepare stream endpoint
  let rawUrl = book.fileUrl.trim();
  if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://") && !rawUrl.startsWith("/")) {
    rawUrl = "/" + rawUrl;
  }
  const fileApiUrl = `/api/books/${book.id}/file`;
  const lowerUrl = rawUrl.toLowerCase();
  const isPdf = lowerUrl.endsWith(".pdf");
  const isImage = /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(lowerUrl);
  const shouldFetchPreview = !(isPdf || isImage);

  const [loadingState, setLoadingState] = useState<boolean>(shouldFetchPreview);

  useEffect(() => {
    if (!shouldFetchPreview) {
      return;
    }

    let isMounted = true;

    fetch(`/api/books/${book.id}/render`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data.error) throw new Error(data.error);
        setDocData(data);
        if (data.type === "spreadsheet" && data.sheets) {
          const keys = Object.keys(data.sheets);
          if (keys.length > 0) setActiveSheet(keys[0]);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error("Doc render error:", err);
        setError(err.message || "Failed to load document preview");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [book.id, isPdf, isImage, shouldFetchPreview]);

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // 1. PDF File -> PDF.js Canvas Viewer
  if (isPdf) {
    return <PdfCanvasViewer url={fileApiUrl} title={book.title} />;
  }

  // 2. Image File -> Responsive Image Viewer
  if (isImage) {
    return (
      <div className="flex h-full w-full items-center justify-center overflow-auto bg-slate-900 p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={rawUrl}
          alt={book.title}
          className="max-h-full max-w-full rounded-xl object-contain shadow-2xl ring-1 ring-slate-800"
        />
      </div>
    );
  }

  // Loading state for converted documents
  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-900 p-8 text-center text-slate-100">
        <Loader2 className="mb-3 h-10 w-10 animate-spin text-blue-500" />
        <div className="text-sm font-semibold">Opening document preview...</div>
      </div>
    );
  }

  // Error or fallback
  if (error || !docData) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-900 p-8 text-center text-slate-100">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-white">Document Preview</h3>
        <p className="mt-1 max-w-md text-xs text-slate-400">
          {error || "This document format is best viewed by downloading."}
        </p>
        <a
          href={rawUrl}
          download
          className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 shadow-lg"
        >
          <Download className="h-4 w-4" /> Download File
        </a>
      </div>
    );
  }

  // 3. Word Document -> Rendered HTML Page
  if (docData.type === "html") {
    return (
      <div className="h-full w-full overflow-y-auto bg-slate-100 p-4 sm:p-8">
        <div className="mx-auto max-w-3xl min-h-full rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xl text-slate-900 prose prose-slate">
          <div
            dangerouslySetInnerHTML={{ __html: docData.html }}
            className="leading-relaxed"
          />
        </div>
      </div>
    );
  }

  // 4. Spreadsheet -> Interactive Table with Sheet Tabs
  if (docData.type === "spreadsheet" && docData.sheets) {
    const sheetNames = Object.keys(docData.sheets);
    const rows: any[][] = docData.sheets[activeSheet] || [];

    return (
      <div className="flex h-full w-full flex-col bg-slate-900 text-slate-100">
        {/* Sheet Tabs */}
        {sheetNames.length > 1 && (
          <div className="flex gap-1 overflow-x-auto border-b border-slate-800 bg-slate-950 px-4 py-2">
            {sheetNames.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSheet(s)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeSheet === s
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Sheet Table */}
        <div className="flex-1 overflow-auto p-4">
          <div className="inline-block min-w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={
                      rowIndex === 0
                        ? "bg-slate-800 font-bold text-slate-100 border-b border-slate-700"
                        : "border-b border-slate-800/60 hover:bg-slate-900/80"
                    }
                  >
                    <td className="w-10 bg-slate-900 px-2 py-1.5 text-center font-mono text-[10px] text-slate-500 border-r border-slate-800 select-none">
                      {rowIndex + 1}
                    </td>
                    {Array.isArray(row) &&
                      row.map((cell: any, cellIndex: number) => (
                        <td
                          key={cellIndex}
                          className="px-3 py-2 text-slate-300 border-r border-slate-800/40 whitespace-nowrap"
                        >
                          {cell !== null && cell !== undefined ? String(cell) : ""}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 5. Code / JSON / Plain Text
  if (docData.type === "text") {
    let formattedText = docData.text;
    if (lowerUrl.endsWith(".json")) {
      try {
        formattedText = JSON.stringify(JSON.parse(docData.text), null, 2);
      } catch {
        // Keep raw text
      }
    }

    const lines = formattedText.split("\n");

    return (
      <div className="flex h-full w-full flex-col bg-slate-950 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Code className="h-4 w-4 text-blue-400" />
            <span>{lines.length} lines</span>
            <span>·</span>
            <span>{formattedText.length} bytes</span>
          </div>
          <button
            onClick={() => copyContent(formattedText)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy Content"}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
          <div className="inline-block min-w-full rounded-xl border border-slate-800/80 bg-slate-900 p-4 shadow-xl">
            <table className="w-full text-left">
              <tbody>
                {lines.map((line: string, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/50">
                    <td className="w-10 select-none pr-4 text-right font-mono text-slate-600">
                      {i + 1}
                    </td>
                    <td className="whitespace-pre-wrap break-all font-mono text-cyan-200">
                      {line}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-slate-900 p-8 text-center text-slate-100">
      <h3 className="text-lg font-bold text-white">{book.title}</h3>
      <a
        href={rawUrl}
        download
        className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 shadow-lg"
      >
        <Download className="h-4 w-4" /> Download File
      </a>
    </div>
  );
}
