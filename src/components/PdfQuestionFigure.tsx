"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, ZoomIn, ZoomOut, FileImage } from "lucide-react";

export function PdfQuestionFigure({ src, page }: { src: string; page: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const [scale, setScale] = useState(1.25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let resetTimer: number | undefined;

    const resetRenderState = () => {
      if (!disposed) {
        setLoading(true);
        setError(null);
      }
    };

    resetTimer = window.setTimeout(resetRenderState, 0);

    async function render() {
      try {
        let attempts = 0;
        let pdfjs: any = null;
        while (!pdfjs && attempts < 50) {
          pdfjs = (window as unknown as { pdfjsLib?: any }).pdfjsLib;
          if (!pdfjs) await new Promise((resolve) => window.setTimeout(resolve, 100));
          attempts += 1;
        }
        if (!pdfjs) throw new Error("PDF rendering engine did not load. Reload the page and try again.");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
        const response = await fetch(src);
        if (!response.ok) throw new Error(`Figure page could not load (${response.status}).`);
        const data = new Uint8Array(await response.arrayBuffer());
        const document = await pdfjs.getDocument({ data }).promise;
        const pdfPage = await document.getPage(Math.max(1, Math.min(page, document.numPages)));
        if (disposed) return;

        const viewport = pdfPage.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return;

        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        renderTaskRef.current?.cancel();
        const task = pdfPage.render({
          canvasContext: context,
          viewport,
          transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
        });
        renderTaskRef.current = task;
        await task.promise;
        if (!disposed) setLoading(false);
      } catch (e) {
        if (!disposed && (e as { name?: string }).name !== "RenderingCancelledException") {
          setError(e instanceof Error ? e.message : "Unable to render the original PDF page.");
          setLoading(false);
        }
      }
    }

    render();
    return () => {
      disposed = true;
      renderTaskRef.current?.cancel();
    };
  }, [src, page, scale]);

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-200 bg-slate-900 shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2 text-xs text-slate-300">
        <span className="inline-flex items-center gap-1.5 font-bold">
          <FileImage className="h-3.5 w-3.5 text-violet-400" /> Original PDF page {page}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => setScale((s) => Math.max(0.6, s - 0.2))} className="rounded p-1 hover:bg-slate-700" aria-label="Zoom out">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="w-10 text-center font-mono text-[10px]">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.min(2.5, s + 0.2))} className="rounded p-1 hover:bg-slate-700" aria-label="Zoom in">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="relative max-h-136 overflow-auto bg-slate-700 p-3">
        {loading && (
          <div className="absolute inset-0 z-10 flex min-h-48 items-center justify-center bg-slate-800/80 text-sm font-semibold text-white backdrop-blur-sm">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Rendering figure page…
          </div>
        )}
        {error ? (
          <div className="flex min-h-40 items-center justify-center rounded-xl bg-slate-800 p-6 text-center text-sm text-rose-300">{error}</div>
        ) : (
          <canvas ref={canvasRef} className="mx-auto max-w-none rounded bg-white shadow-2xl" />
        )}
      </div>
    </div>
  );
}

export function parsePdfPageMarker(value: string): { src: string; page: number } | null {
  if (!value.startsWith("pdf-page:")) return null;
  const marker = value.slice("pdf-page:".length);
  const hash = marker.lastIndexOf("#");
  if (hash < 0) return { src: marker, page: 1 };
  const page = Number(marker.slice(hash + 1));
  return { src: marker.slice(0, hash), page: Number.isFinite(page) ? page : 1 };
}
