import { NextResponse } from "next/server";
import { db } from "@/db";
import { purchaseOtps } from "@/db/schema";
import { createHash, randomInt } from "crypto";

export const dynamic = "force-dynamic";

function cleanMobile(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "").slice(-10) : "";
}

function hashOtp(mobile: string, otp: string) {
  return createHash("sha256").update(`${mobile}:${otp}:quiz-nptel-buy`).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mobile = cleanMobile(body.mobile);
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json({ error: "Enter a valid 10-digit Indian mobile number." }, { status: 400 });
    }

    const otp = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.insert(purchaseOtps).values({
      mobile,
      otpHash: hashOtp(mobile, otp),
      expiresAt,
    });

    // In production this would be sent via SMS gateway.
    // Returning demoOtp keeps the sandbox flow testable.
    return NextResponse.json({ ok: true, mobile, demoOtp: otp, expiresInSeconds: 300 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to send OTP." }, { status: 500 });
  }
}
