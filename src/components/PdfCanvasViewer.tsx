"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Loader2,
  Maximize2,
  Search,
  FileText,
  AlertCircle,
} from "lucide-react";

type Props = {
  url: string;
  title?: string;
};

export default function PdfCanvasViewer({ url, title = "PDF Document" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [mode, setMode] = useState<"continuous" | "single">("continuous");

  // Load PDF.js dynamically on client
  useEffect(() => {
    let isCancelled = false;
    // Defer state updates to avoid synchronous setState inside effect
    Promise.resolve().then(() => {
      setLoading(true);
      setError(null);
      setLoadingProgress(10);
    });

    async function loadPdf() {
      try {
        const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js");
        
        // Configure worker
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        }

        // Fetch PDF array buffer to avoid CORS or header issues
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF (${response.status} ${response.statusText})`);
        }

        const contentLength = response.headers.get("content-length");
        const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

        const reader = response.body?.getReader();
        let receivedBytes = 0;
        const chunks: Uint8Array[] = [];

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              receivedBytes += value.length;
              if (totalBytes > 0) {
                setLoadingProgress(Math.min(90, Math.round((receivedBytes / totalBytes) * 100)));
              } else {
                setLoadingProgress((prev) => Math.min(90, prev + 5));
              }
            }
          }
        }

        const fullArray = new Uint8Array(receivedBytes);
        let offset = 0;
        for (const chunk of chunks) {
          fullArray.set(chunk, offset);
          offset += chunk.length;
        }

        const loadingTask = pdfjsLib.getDocument({ data: fullArray });
        loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
          if (progress.total > 0) {
            setLoadingProgress(Math.round((progress.loaded / progress.total) * 100));
          }
        };

        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setLoadingProgress(100);
          setLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("PDF.js load error:", err);
          setError(err.message || "Failed to render PDF document.");
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [url]);

  // Search in PDF text
  const handleSearch = useCallback(async () => {
    if (!pdfDoc || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase().trim();
    const matches: number[] = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item: any) => item.str).join(" ").toLowerCase();
        if (text.includes(query)) {
          matches.push(pageNum);
        }
      } catch {
        // ignore page text extraction errors
      }
    }
    setSearchResults(matches);
    if (matches.length > 0) {
      setCurrentPage(matches[0]);
    }
  }, [pdfDoc, searchQuery]);

  return (
    <div className="flex h-full w-full flex-col bg-slate-900 text-slate-100">
      {/* PDF Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950 px-4 py-2.5 shadow-md">
        {/* Left: Mode & Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-slate-800 p-1 text-xs">
            <button
              onClick={() => setMode("continuous")}
              className={`rounded px-2.5 py-1 font-semibold transition ${
                mode === "continuous" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Scroll
            </button>
            <button
              onClick={() => setMode("single")}
              className={`rounded px-2.5 py-1 font-semibold transition ${
                mode === "single" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Single
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || mode === "continuous"}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
            title="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold tabular-nums text-slate-300">
            Page {currentPage} of {numPages || "..."}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages || mode === "continuous"}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
            title="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Center: Search */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Find in PDF..."
              className="w-36 rounded-lg border border-slate-800 bg-slate-900 py-1 pl-3 pr-8 text-xs text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:w-48"
            />
            <button
              onClick={handleSearch}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
          {searchResults.length > 0 && (
            <span className="text-[11px] font-semibold text-emerald-400">
              {searchResults.length} page(s) found
            </span>
          )}
        </div>

        {/* Right: Zoom & Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-xs font-semibold tabular-nums text-slate-300">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(3.0, s + 0.2))}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Rotate"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <a
            href={url}
            download
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        </div>
      </div>

      {/* Main Canvas Container */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-auto bg-slate-900 p-4"
      >
        {loading && (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-blue-500" />
            <div className="text-sm font-semibold text-slate-200">
              Rendering document canvas ({loadingProgress}%)...
            </div>
            <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Could not render PDF canvas</h3>
            <p className="mt-1 max-w-md text-xs text-slate-400">{error}</p>
            <a
              href={url}
              download
              className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500"
            >
              <Download className="h-4 w-4" /> Download PDF File Directly
            </a>
          </div>
        )}

        {pdfDoc && !loading && !error && (
          <div className="flex flex-col items-center space-y-6 pb-12">
            {mode === "continuous" ? (
              Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <PdfPageCanvas
                  key={pageNum}
                  pdfDoc={pdfDoc}
                  pageNum={pageNum}
                  scale={scale}
                  rotation={rotation}
                  onInView={() => setCurrentPage(pageNum)}
                />
              ))
            ) : (
              <PdfPageCanvas
                pdfDoc={pdfDoc}
                pageNum={currentPage}
                scale={scale}
                rotation={rotation}
                onInView={() => {}}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Individual PDF Page Canvas Component
function PdfPageCanvas({
  pdfDoc,
  pageNum,
  scale,
  rotation,
  onInView,
}: {
  pdfDoc: any;
  pageNum: number;
  scale: number;
  rotation: number;
  onInView: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState<boolean>(false);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    let renderTask: any = null;
    let isCancelled = false;

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        setPageDimensions({ width: viewport.width, height: viewport.height });

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
        if (!isCancelled) {
          setRendered(true);
        }
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Page ${pageNum} render error:`, err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // ignore task cancel exception
        }
      }
    };
  }, [pdfDoc, pageNum, scale, rotation]);

  return (
    <div className="relative rounded-lg shadow-2xl transition-all">
      <div className="absolute right-3 top-3 z-10 rounded bg-slate-950/80 px-2 py-1 text-[10px] font-bold text-slate-300 backdrop-blur">
        Page {pageNum}
      </div>
      <canvas
        ref={canvasRef}
        className="rounded bg-white transition-all shadow-md"
        style={{
          width: pageDimensions ? `${pageDimensions.width}px` : "auto",
          height: pageDimensions ? `${pageDimensions.height}px` : "auto",
        }}
      />
    </div>
  );
}
