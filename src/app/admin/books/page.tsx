"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { UploadCloud, FileText, Loader2, Trash2 } from "lucide-react";

type Book = {
  id: number;
  title: string;
  description: string | null;
  fileUrl: string;
  coverUrl: string | null;
  category: string;
  year: number | null;
};

export default function AdminBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("PYQ");
  const [year, setYear] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const showToast = useCallback((t: { type: "ok" | "err"; msg: string }) => {
    setToast(t);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/books");
      const data = await res.json();
      setBooks(data.books ?? []);
    } catch {
      showToast({ type: "err", msg: "Failed to load library" });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const loadBooks = async () => {
      await fetchBooks();
    };

    void loadBooks();
  }, [fetchBooks]);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-file", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setFileUrl(data.url);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
      showToast({ type: "ok", msg: "File uploaded successfully!" });
    } catch (err) {
      showToast({ type: "err", msg: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const deleteBook = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document from the library?")) return;
    try {
      const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete book");
      showToast({ type: "ok", msg: "Document deleted from library!" });
      fetchBooks();
    } catch (err) {
      showToast({ type: "err", msg: err instanceof Error ? err.message : "Failed to delete" });
    }
  };

  const submitBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileUrl) {
      return showToast({ type: "err", msg: "Title and File URL are required." });
    }
    setUploading(true);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, description: desc, fileUrl, category, year }),
      });
      if (!res.ok) throw new Error("Failed to save book");
      showToast({ type: "ok", msg: "Book added to library!" });
      setTitle("");
      setDesc("");
      setFileUrl("");
      setYear("");
      fetchBooks();
    } catch (err) {
      showToast({ type: "err", msg: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 pb-24">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Book & Document Library</h1>
            <p className="text-sm text-slate-500">Upload PDFs, notes, and previous year papers for students.</p>
          </div>
          <Link href="/admin" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            ← Back to Admin
          </Link>
        </div>

        <form onSubmit={submitBook} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Add New Document</h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Title *</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="e.g. GATE 2026 Math" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">File *</span>
              {fileUrl ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  <FileText className="h-4 w-4" />
                  <span className="truncate">File ready</span>
                  <button type="button" onClick={() => setFileUrl("")} className="ml-auto text-xs font-bold text-emerald-700 hover:text-emerald-900">Clear</button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:border-slate-400">
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleUploadFile} disabled={uploading} />
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  {uploading ? "Uploading..." : "Select PDF / Doc"}
                </label>
              )}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500">
                <option value="PYQ">Previous Year Paper (PYQ)</option>
                <option value="Textbook">Textbook</option>
                <option value="Notes">Notes</option>
                <option value="General">General</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Year (optional)</span>
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="e.g. 2024" />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Description</span>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Short summary of the document" />
          </label>

          <button type="submit" disabled={uploading || !title || !fileUrl} className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">
            {uploading ? "Saving..." : "Add to Library"}
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-900">Current Library ({books.length})</h2>
          {loading ? (
            <div className="text-center text-sm text-slate-500 py-10">Loading library...</div>
          ) : books.length === 0 ? (
            <div className="text-center text-sm text-slate-500 py-10 border border-dashed rounded-xl">No documents yet.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {books.map(b => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-bold text-slate-800">{b.title}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{b.category}</span>
                      {b.year && <span className="bg-slate-100 px-2 py-0.5 rounded">{b.year}</span>}
                      <Link href={`/books/${b.id}`} target="_blank" className="text-blue-600 hover:underline">View Document</Link>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteBook(b.id)}
                    className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    title="Delete document"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
          <div className={`rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg ${toast.type === "ok" ? "bg-emerald-600" : "bg-rose-600"}`}>
            {toast.msg}
          </div>
        </div>
      )}
    </main>
  );
}
