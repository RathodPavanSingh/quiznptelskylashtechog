import { NextResponse } from "next/server";
//import { writeFile, mkdir } from "fs/promises";
import{put} from "@vercel/blob";
import path from "path";
import crypto from "crypto";
import { checkAdminAuth } from "@/lib/auth";
/*
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(req: Request) {
  try {
    const { authorized } = await checkAdminAuth();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const fd = await req.formData();
    const file = fd.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    // retain original extension safely
    const originalExt = path.extname(file.name) || ".bin";
    const ext = originalExt.replace(/[^a-zA-Z0-9.]/g, "").toLowerCase();

    const dir = path.join(process.cwd(), "public", "uploads", "books");
    await mkdir(dir, { recursive: true });
    
    const id = crypto.randomBytes(8).toString("hex");
    const fileName = `${Date.now()}-${id}${ext}`;
    const full = path.join(dir, fileName);
    
    await writeFile(full, buf);
    const url = `/uploads/books/${fileName}`;
    
    return NextResponse.json({ url, size: file.size, type: file.type });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
*/
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const { authorized } = await checkAdminAuth();
    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const fd = await req.formData();
    const file = fd.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large (max 20 MB)" },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;

    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({
      url: blob.url,
      size: file.size,
      type: file.type,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}