import { NextResponse } from "next/server";
import { db } from "@/db";
import { purchaseOtps } from "@/db/schema";
import { and, desc, eq, gt } from "drizzle-orm";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

function cleanMobile(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "").slice(-10) : "";
}

function cleanOtp(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "").slice(0, 6) : "";
}

function hashOtp(mobile: string, otp: string) {
  return createHash("sha256").update(`${mobile}:${otp}:quiz-nptel-buy`).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mobile = cleanMobile(body.mobile);
    const otp = cleanOtp(body.otp);

    if (!/^[6-9]\d{9}$/.test(mobile) || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "Invalid mobile number or OTP." }, { status: 400 });
    }

    const [latest] = await db
      .select()
      .from(purchaseOtps)
      .where(and(eq(purchaseOtps.mobile, mobile), gt(purchaseOtps.expiresAt, new Date())))
      .orderBy(desc(purchaseOtps.createdAt))
      .limit(1);

    if (!latest) return NextResponse.json({ error: "OTP expired. Please request a new one." }, { status: 400 });
    if (latest.verified) return NextResponse.json({ ok: true, verified: true });
    if (latest.attempts >= 5) return NextResponse.json({ error: "Too many attempts. Request a new OTP." }, { status: 429 });

    const ok = latest.otpHash === hashOtp(mobile, otp);
    if (!ok) {
      await db
        .update(purchaseOtps)
        .set({ attempts: latest.attempts + 1 })
        .where(eq(purchaseOtps.id, latest.id));
      return NextResponse.json({ error: "Incorrect OTP." }, { status: 400 });
    }

    await db.update(purchaseOtps).set({ verified: true }).where(eq(purchaseOtps.id, latest.id));
    return NextResponse.json({ ok: true, verified: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to verify OTP." }, { status: 500 });
  }
}
