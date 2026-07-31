import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { or, eq, sql } from "drizzle-orm";
import { verifyPassword, createSession, recordLogin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { identifier?: string; password?: string };
    const identifier = (body.identifier ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (!identifier || !password) {
      return NextResponse.json({ error: "Username/email and password are required." }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(sql`LOWER(${users.regNo})`, identifier),
          eq(sql`LOWER(${users.username})`, identifier),
          eq(users.email, identifier),
        ),
      )
      .limit(1);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid credentials. Check your username/email and password." }, { status: 401 });
    }

    await createSession(user.id);
    await recordLogin(user, user.provider, "login", req);

    return NextResponse.json({
      user: { id: user.id, username: user.username, regNo: user.regNo, email: user.email, name: user.name, role: user.role },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Login failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
