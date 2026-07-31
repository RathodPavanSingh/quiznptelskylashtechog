import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ARCHIVE_SEARCH_URL = "https://archive.org/advancedsearch.php";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "subject:(gate OR nptel OR engineering) mediatype:texts";
  const rows = searchParams.get("rows") || "20";
  const page = searchParams.get("page") || "1";

  const url = new URL(ARCHIVE_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("fl[]", "identifier");
  url.searchParams.set("fl[]", "title");
  url.searchParams.set("fl[]", "description");
  url.searchParams.set("fl[]", "year");
  url.searchParams.set("fl[]", "mediatype");
  url.searchParams.set("rows", rows);
  url.searchParams.set("page", page);
  url.searchParams.set("output", "json");

  try {
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("Failed to fetch from Archive.org");
    const data = await response.json();

    const docs = data.response?.docs || [];

    const results = docs.map((doc: any) => ({
      identifier: doc.identifier,
      title: doc.title,
      description: doc.description ? (Array.isArray(doc.description) ? doc.description[0] : doc.description) : "",
      year: doc.year ? parseInt(doc.year, 10) : null,
      // Construct a direct link to the PDF if it exists, or a details page link.
      // For simplicity, we use the identifier to construct a PDF link assumption.
      pdfUrl: `https://archive.org/download/${doc.identifier}/${doc.identifier}.pdf`,
      detailsUrl: `https://archive.org/details/${doc.identifier}`,
    }));

    return NextResponse.json({ results, total: data.response?.numFound || 0 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Search failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
