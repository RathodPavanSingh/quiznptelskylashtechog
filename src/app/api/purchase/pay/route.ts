import { NextResponse } from "next/server";
import { db } from "@/db";
import { coursePurchases, purchaseOtps } from "@/db/schema";
import { and, desc, eq, gt } from "drizzle-orm";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function cleanMobile(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "").slice(-10) : "";
}
function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fullName = clean(body.fullName, 120);
    const mobile = cleanMobile(body.mobile);
    const email = clean(body.email, 180).toLowerCase();
    const captchaAnswer = Number(body.captchaAnswer);
    const captchaExpected = Number(body.captchaExpected);
    const simulateFailure = body.simulateFailure === true;

    const allowedModes = new Set([
      "upi",
      "gpay",
      "paytm",
      "phonepe",
      "scanner",
      "debit-card",
      "credit-card",
      "netbanking",
    ]);
    const paymentMethod = allowedModes.has(String(body.paymentMethod))
      ? String(body.paymentMethod)
      : "upi";

    if (paymentMethod.includes("card")) {
      const pan = String(body.cardNumber ?? "").replace(/\s+/g, "");
      if (!/^\d{15,16}$/.test(pan)) {
        return NextResponse.json({ error: "Enter a valid card number." }, { status: 400 });
      }
      const cvv = String(body.cardCvv ?? "").trim();
      if (!/^\d{3,4}$/.test(cvv)) {
        return NextResponse.json({ error: "Enter a valid CVV." }, { status: 400 });
      }
    }

    if (["upi", "gpay", "paytm", "phonepe"].includes(paymentMethod)) {
      const upiId = clean(body.upiId, 80).toLowerCase();
      if (!/^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
        return NextResponse.json({ error: "Enter a valid UPI ID (example: name@bank)." }, { status: 400 });
      }
    }

    if (paymentMethod === "scanner") {
      const scannedBy = clean(body.scannedBy, 80).toUpperCase();
      if (scannedBy.length < 3) {
        return NextResponse.json({ error: "Select UPI Scanner / QR pay app." }, { status: 400 });
      }
    }

    if (paymentMethod === "netbanking") {
      const bankName = clean(body.bankName, 80).toUpperCase();
      if (bankName.length < 3) {
        return NextResponse.json({ error: "Choose a bank for net banking." }, { status: 400 });
      }
    }

    if (fullName.length < 3) return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    if (!/^[6-9]\d{9}$/.test(mobile)) return NextResponse.json({ error: "Valid mobile number is required." }, { status: 400 });
    if (!isEmail(email)) return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    if (!Number.isFinite(captchaAnswer) || captchaAnswer !== captchaExpected) {
      return NextResponse.json({ error: "Captcha answer is incorrect." }, { status: 400 });
    }

    const [verifiedOtp] = await db
      .select()
      .from(purchaseOtps)
      .where(and(eq(purchaseOtps.mobile, mobile), eq(purchaseOtps.verified, true), gt(purchaseOtps.expiresAt, new Date())))
      .orderBy(desc(purchaseOtps.createdAt))
      .limit(1);

    if (!verifiedOtp) {
      return NextResponse.json({ error: "Mobile OTP is not verified or has expired." }, { status: 400 });
    }

    const paymentRef = `QNP-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;
    const methodLabel =
      paymentMethod === "upi"
        ? "UPI"
        : paymentMethod === "debit-card"
        ? "Debit Card"
        : paymentMethod === "credit-card"
        ? "Credit Card"
        : paymentMethod === "scanner"
        ? "UPI Scanner / QR"
        : paymentMethod === "netbanking"
        ? "Net Banking"
        : paymentMethod.toUpperCase();

    // Store only safe payment metadata. Never persist full PAN or CVV.
    const paymentDetails: Record<string, string> = {
      method: paymentMethod,
      ...(paymentMethod === "scanner" ? { provider: clean(body.scannedBy, 80).toUpperCase() } : {}),
      ...(paymentMethod === "netbanking" ? { bank: clean(body.bankName, 80).toUpperCase() } : {}),
      ...(["upi", "gpay", "paytm", "phonepe"].includes(paymentMethod)
        ? { upiId: clean(body.upiId, 80).toLowerCase() }
        : {}),
    };
    const cardDigits = paymentMethod.includes("card")
      ? String(body.cardNumber ?? "").replace(/\D/g, "").slice(-4)
      : null;

    const success = !simulateFailure;
    const ua = req.headers.get("user-agent")?.slice(0, 300) ?? null;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;

    const [purchase] = await db
      .insert(coursePurchases)
      .values({
        fullName,
        mobile,
        email,
        courseName: "Full Course Access",
        amountRupees: 500,
        paymentRef,
        status: success ? "success" : "failed",
        paymentMode: methodLabel,
        paymentDetails,
        paymentLast4: cardDigits,
        joinedCourse: success,
        ip,
        userAgent: ua,
      })
      .returning();

    return NextResponse.json({
      ok: true,
      status: purchase.status,
      joinedCourse: purchase.joinedCourse,
      amountRupees: purchase.amountRupees,
      paymentRef: purchase.paymentRef,
      purchaseId: purchase.id,
      paymentMethod: purchase.paymentMode,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Payment failed." }, { status: 500 });
  }
}
