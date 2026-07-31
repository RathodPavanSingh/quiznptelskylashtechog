import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { hashPassword, validateSignup, createSession, recordLogin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      username?: string;
      email?: string;
      password?: string;
    };

    const error = validateSignup({
      username: body.username ?? "",
      email: body.email ?? "",
      password: body.password ?? "",
    });
    if (error) return NextResponse.json({ error }, { status: 400 });

    const username = (body.username ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();

    // Repeated user? Point them straight to login.
    const [dup] = await db
      .select({ id: users.id, email: users.email, regNo: users.regNo })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (dup) {
      return NextResponse.json(
        { error: "An account with this email already exists — please Sign In instead.", exists: true },
        { status: 409 },
      );
    }

    // First registered account becomes the admin; everyone else is a student.
    const [{ count }] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(users);
    const role = count === 0 ? "admin" : "student";
    const passwordHash = hashPassword(body.password ?? "");

    let inserted;
    try {
      [inserted] = await db
        .insert(users)
        .values({
          username,
          regNo: username,
          email,
          passwordHash,
          role,
          name: username,
        })
        .returning();
    } catch {
      return NextResponse.json(
        { error: "That username or email is already taken — Sign In instead.", exists: true },
        { status: 409 },
      );
    }

    await createSession(inserted.id);
    await recordLogin(inserted, "password", "signup", req);

    return NextResponse.json({
      user: {
        id: inserted.id,
        username: inserted.username,
        regNo: inserted.regNo,
        email: inserted.email,
        name: inserted.name,
        role: inserted.role,
      },
      isFirstUser: role === "admin",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Signup failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
