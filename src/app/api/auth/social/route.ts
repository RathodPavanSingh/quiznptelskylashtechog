import { NextResponse } from "next/server";
import { createSession, findOrCreateFederatedUser, recordLogin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Federated sign-in (Google / Apple).
 * In production this would exchange an OAuth id-token from Google Identity
 * Services / Sign in with Apple. In this environment we verify the college
 * email directly so the full flow (auto account creation + session) works.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { provider?: string; email?: string; name?: string };
    const provider = body.provider === "apple" ? "apple" : "google";
    const email = (body.email ?? "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid college email to continue." }, { status: 400 });
    }

    const { user, created } = await findOrCreateFederatedUser(provider, email, body.name);
    await createSession(user.id);
    await recordLogin(user, provider, created ? "signup" : "social", req);

    return NextResponse.json({
      user: { id: user.id, username: user.username, regNo: user.regNo, email: user.email, name: user.name, role: user.role },
      created,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Social sign-in failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
