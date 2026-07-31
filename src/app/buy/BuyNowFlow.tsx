"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeIndianRupee,
  Banknote,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Landmark,
  Loader2,
  LockKeyhole,
  Phone,
  QrCode,
  RefreshCw,
  ShieldCheck,
  SmartphoneNfc,
  Sparkles,
  XCircle,
} from "lucide-react";

type Step = "mobile" | "details" | "payment" | "result";
type Result = null | { status: "success" | "failed"; paymentRef: string; joinedCourse: boolean; amountRupees: number; paymentMethod?: string };

function onlyDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

export default function BuyNowFlow() {
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forceFail, setForceFail] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [scannedBy, setScannedBy] = useState("GPAY");
  const [bankName, setBankName] = useState("SBI");

  const captcha = useMemo(() => {
    const a = 4 + (mobile.charCodeAt(0) || 3) % 8;
    const b = 6 + (mobile.charCodeAt(3) || 5) % 9;
    return { a, b, expected: a + b };
  }, [mobile]);

  async function sendOtp() {
    setError(null);
    if (!/^[6-9]\d{9}$/.test(mobile)) return setError("Enter a valid 10-digit Indian mobile number.");
    setLoading(true);
    try {
      const res = await fetch("/api/purchase/send-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "Could not send OTP.");
      setDemoOtp(data.demoOtp);
      setStep("details");
    } finally {
      setLoading(false);
    }
  }

  async function verifyDetails() {
    setError(null);
    if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit OTP.");
    if (fullName.trim().length < 3) return setError("Enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter a valid email.");
    if (Number(captchaAnswer) !== captcha.expected) return setError("Captcha answer is incorrect.");

    setLoading(true);
    try {
      const res = await fetch("/api/purchase/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "OTP verification failed.");
      setStep("payment");
    } finally {
      setLoading(false);
    }
  }

  async function payNow() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/purchase/pay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName,
          mobile,
          email,
          captchaAnswer: Number(captchaAnswer),
          captchaExpected: captcha.expected,
          simulateFailure: forceFail,
          paymentMethod,
          upiId,
          cardNumber,
          cardName,
          cardExpiry,
          cardCvv,
          scannedBy,
          bankName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ status: "failed", paymentRef: "N/A", joinedCourse: false, amountRupees: 500 });
        setError(data.error ?? "Payment failed.");
      } else {
        setResult({
          status: data.status,
          paymentRef: data.paymentRef,
          joinedCourse: data.joinedCourse,
          amountRupees: data.amountRupees,
          paymentMethod: data.paymentMethod,
        });
      }
      setStep("result");
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setStep("mobile");
    setMobile("");
    setOtp("");
    setDemoOtp(null);
    setFullName("");
    setEmail("");
    setCaptchaAnswer("");
    setResult(null);
    setError(null);
    setForceFail(false);
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-orange-50 via-white to-amber-50 pb-20">
      <section className="mx-auto max-w-5xl px-5 py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
          <div className="rounded-4xl border border-orange-100 bg-white/80 p-8 shadow-xl shadow-orange-950/10 backdrop-blur">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-orange-700">
              <Sparkles className="h-3.5 w-3.5" /> Limited full-course access
            </span>
            <h1 className="mt-5 font-display text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Buy full course access
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
              Unlock every quiz, coding module, practice library, entrance exam section, MNC placement desk, and upcoming materials with one secure enrollment.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["10,000+", "Questions"],
                ["All", "Exam sections"],
                ["Lifetime", "Library updates"],
              ].map(([a, b]) => (
                <div key={b} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-display text-2xl font-bold text-slate-900">{a}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">{b}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/10">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">Secure checkout</div>
                <div className="mt-1 flex items-center gap-2 font-display text-3xl font-black text-slate-950">
                  <BadgeIndianRupee className="h-7 w-7 text-orange-600" /> 500
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                Full Course
              </span>
            </div>

            <StepIndicator step={step} />

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            )}

            {step === "mobile" && (
              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mobile number</span>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={mobile}
                      onChange={(e) => setMobile(onlyDigits(e.target.value))}
                      placeholder="9876543210"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />
                  </div>
                </label>
                <button onClick={sendOtp} disabled={loading} className="checkout-btn">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  Send OTP
                </button>
              </div>
            )}

            {step === "details" && (
              <div className="mt-6 space-y-4">
                {demoOtp && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
                    Demo OTP: <span className="font-mono text-base">{demoOtp}</span>
                  </div>
                )}
                <Input label="OTP" value={otp} onChange={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit OTP" />
                <Input label="Full name" value={fullName} onChange={setFullName} placeholder="Your full name" />
                <Input label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Captcha</span>
                  <div className="mt-1.5 grid grid-cols-[1fr_120px] gap-2">
                    <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-700">
                      {captcha.a} + {captcha.b} = ?
                    </div>
                    <input
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      placeholder="Answer"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    />
                  </div>
                </label>
                <button onClick={verifyDetails} disabled={loading} className="checkout-btn">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Verify & Continue
                </button>
              </div>
            )}

            {step === "payment" && (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Course</span>
                    <span className="font-bold text-slate-900">Full Course Access</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Amount</span>
                    <span className="font-display text-xl font-black text-slate-950">₹500</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
                    <LockKeyhole className="h-4 w-4 text-emerald-600" />
                    Sandbox checkout: banking details are validated but never charged.
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Choose payment mode</div>
                  <div className="grid grid-cols-2 gap-2">
                    <MethodButton active={paymentMethod === "upi"} onClick={() => setPaymentMethod("upi")} icon={SmartphoneNfc} label="UPI" sub="Any UPI ID" />
                    <MethodButton active={paymentMethod === "gpay"} onClick={() => setPaymentMethod("gpay")} icon={SmartphoneNfc} label="GPay" sub="Google Pay" />
                    <MethodButton active={paymentMethod === "paytm"} onClick={() => setPaymentMethod("paytm")} icon={SmartphoneNfc} label="Paytm" sub="Paytm UPI" />
                    <MethodButton active={paymentMethod === "phonepe"} onClick={() => setPaymentMethod("phonepe")} icon={SmartphoneNfc} label="PhonePe" sub="PhonePe UPI" />
                    <MethodButton active={paymentMethod === "scanner"} onClick={() => setPaymentMethod("scanner")} icon={QrCode} label="Scanner" sub="Scan & Pay" />
                    <MethodButton active={paymentMethod === "debit-card"} onClick={() => setPaymentMethod("debit-card")} icon={CreditCard} label="Debit" sub="Card" />
                    <MethodButton active={paymentMethod === "credit-card"} onClick={() => setPaymentMethod("credit-card")} icon={CreditCard} label="Credit" sub="Card" />
                    <MethodButton active={paymentMethod === "netbanking"} onClick={() => setPaymentMethod("netbanking")} icon={Landmark} label="NetBanking" sub="Bank login" />
                  </div>
                </div>

                {["upi", "gpay", "paytm", "phonepe"].includes(paymentMethod) && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {paymentMethod === "upi" ? "UPI ID" : `${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} UPI ID`}
                    </label>
                    <input
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="name@okhdfcbank"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />
                  </div>
                )}

                {["debit-card", "credit-card"].includes(paymentMethod) && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                    <input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "))}
                      placeholder="Card number"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />
                    <input
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Name on card"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value.replace(/\D/g, "").slice(0, 4).replace(/(\d{2})(?=\d)/, "$1/"))}
                        placeholder="MM/YY"
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />
                      <input
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="CVV"
                        type="password"
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === "scanner" && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                    <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50">
                      <div>
                        <QrCode className="mx-auto h-14 w-14 text-orange-600" />
                        <div className="mt-2 font-mono text-[10px] font-bold text-orange-700">UPI-QR-₹500</div>
                      </div>
                    </div>
                    <select
                      value={scannedBy}
                      onChange={(e) => setScannedBy(e.target.value)}
                      className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-400"
                    >
                      <option value="GPAY">Pay with Google Pay</option>
                      <option value="PHONEPE">Pay with PhonePe</option>
                      <option value="PAYTM">Pay with Paytm</option>
                      <option value="BHIM">Pay with BHIM UPI</option>
                    </select>
                  </div>
                )}

                {paymentMethod === "netbanking" && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-400"
                    >
                      {["SBI", "HDFC", "ICICI", "AXIS", "PNB", "KOTAK"].map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                )}

                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                  <input type="checkbox" checked={forceFail} onChange={(e) => setForceFail(e.target.checked)} className="accent-rose-600" />
                  Simulate unsuccessful payment
                </label>

                <button onClick={payNow} disabled={loading} className="checkout-btn">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  Pay ₹500 Securely
                </button>
              </div>
            )}

            {step === "result" && result && (
              <div className="mt-6 text-center">
                {result.status === "success" ? (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                    <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
                    <h2 className="mt-3 font-display text-2xl font-black text-emerald-900">Payment Successful</h2>
                    <p className="mt-2 text-sm text-emerald-800">
                      You have joined the full course. Access is activated for all modules.
                    </p>
                    <div className="mt-4 rounded-xl bg-white px-4 py-3 text-xs font-semibold text-slate-600 ring-1 ring-emerald-100">
                      Payment Ref: <span className="font-mono text-slate-900">{result.paymentRef}</span>
                      {result.paymentMethod && (
                        <>
                          <br />Mode: <span className="text-slate-900">{result.paymentMethod}</span>
                        </>
                      )}
                    </div>
                    <Link href="/" className="mt-5 inline-flex rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">
                      Go to courses
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
                    <XCircle className="mx-auto h-14 w-14 text-rose-600" />
                    <h2 className="mt-3 font-display text-2xl font-black text-rose-900">Payment Unsuccessful</h2>
                    <p className="mt-2 text-sm text-rose-800">No amount was captured in this simulation. Please try again.</p>
                    <button onClick={() => setStep("payment")} className="mt-5 inline-flex rounded-xl bg-rose-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-800">
                      Try payment again
                    </button>
                  </div>
                )}
                <button onClick={restart} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900">
                  <RefreshCw className="h-3.5 w-3.5" /> Start new enrollment
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <style jsx>{`
        .checkout-btn {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 0.75rem;
          background: linear-gradient(to right, #ea580c, #d97706);
          padding: 0.9rem 1rem;
          font-size: 0.875rem;
          font-weight: 800;
          color: white;
          box-shadow: 0 12px 28px rgba(249, 115, 22, 0.22);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .checkout-btn:hover { transform: translateY(-1px); box-shadow: 0 16px 34px rgba(249,115,22,.28); }
        .checkout-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
      `}</style>
    </main>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const all: Step[] = ["mobile", "details", "payment", "result"];
  const idx = all.indexOf(step);
  return (
    <div className="grid grid-cols-4 gap-2">
      {all.map((s, i) => (
        <div key={s} className="space-y-1">
          <div className={`h-1.5 rounded-full ${i <= idx ? "bg-orange-600" : "bg-slate-200"}`} />
          <div className={`text-[10px] font-bold uppercase tracking-wider ${i <= idx ? "text-orange-700" : "text-slate-400"}`}>{s}</div>
        </div>
      ))}
    </div>
  );
}

function MethodButton({
  active,
  onClick,
  icon: Icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof SmartphoneNfc;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 items-center gap-2.5 rounded-2xl border p-3 text-left transition ${
        active
          ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? "bg-orange-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"}`}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0">
        <span className={`block truncate text-sm font-black ${active ? "text-orange-800" : "text-slate-800"}`}>{label}</span>
        <span className={`block truncate text-[10px] font-semibold uppercase tracking-wide ${active ? "text-orange-500" : "text-slate-400"}`}>{sub}</span>
      </span>
      {active && <span className="ml-auto h-2 w-2 rounded-full bg-orange-500" />}
    </button>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
      />
    </label>
  );
}
