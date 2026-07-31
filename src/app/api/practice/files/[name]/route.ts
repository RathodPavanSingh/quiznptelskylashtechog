import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const safe = path.basename(name);
  if (!/^[a-zA-Z0-9._-]+\.pdf$/i.test(safe)) {
    return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
  }

  try {
    const file = await readFile(path.join(process.cwd(), "public", "uploads", "practice", safe));
    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(file.length),
        "Content-Disposition": `inline; filename="${safe}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Practice PDF not found" }, { status: 404 });
  }
}
