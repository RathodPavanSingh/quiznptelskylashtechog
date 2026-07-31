import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { sessions, users, loginLogs, type User } from "@/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";

export type { User };

export const SESSION_COOKIE = "nq_session";
export const SESSION_DAYS = 7;

// ---------- Password hashing ----------
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

// ---------- Sessions ----------
export async function createSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ token, userId, expiresAt });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return token;
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({ user: users, session: sessions })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (rows.length === 0) return null;
  return rows[0].user;
}

export async function checkAdminAuth(): Promise<{ authorized: boolean; user: User | null }> {
  // Direct access: always authorized
  return { authorized: true, user: null };
}

export async function getSessionUser(tokenOverride?: string): Promise<{
  user: User | null;
  session: null;
}> {
  return { user: null, session: null };
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const t = store.get(SESSION_COOKIE)?.value;
  if (t) {
    await db.delete(sessions).where(eq(sessions.token, t));
  }
  store.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function deleteSession(token: string): Promise<void> {
  return destroySession();
}

// ---------- Login bookkeeping ----------
export async function recordLogin(
  user: User,
  provider: string,
  action: "login" | "signup" | "social" = "login",
  req?: Request,
): Promise<void> {
  const ua = req?.headers.get("user-agent")?.slice(0, 300) ?? null;
  const fwd = req?.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : req?.headers.get("x-real-ip") ?? null;

  await db
    .update(users)
    .set({ lastLoginAt: new Date(), loginCount: sql`${users.loginCount} + 1` })
    .where(eq(users.id, user.id));
  await db.insert(loginLogs).values({ userId: user.id, provider, action, userAgent: ua, ip });
}

/** Sign-in / sign-up via a federated provider (Google / Apple). */
export async function findOrCreateFederatedUser(
  provider: "google" | "apple",
  email: string,
  name?: string | null,
): Promise<{ user: User; created: boolean }> {
  const normalized = email.trim().toLowerCase();
  const [existing] = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
  if (existing) return { user: existing, created: false };

  const base = normalized.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "") || "user";
  let regNo = base;
  let n = 1;
  while (true) {
    const [dup] = await db.select({ id: users.id }).from(users).where(eq(users.regNo, regNo)).limit(1);
    if (!dup) break;
    n += 1;
    regNo = `${base}${n}`;
  }

  const [created] = await db
    .insert(users)
    .values({
      username: base,
      regNo,
      email: normalized,
      passwordHash: randomBytes(32).toString("hex"),
      provider,
      role: "student",
      name: name?.trim() || null,
    })
    .returning();
  return { user: created, created: true };
}

// ---------- Validation ----------
export function validateSignup(input: {
  username: string;
  email: string;
  password: string;
}): string | null {
  if (!input.username || input.username.trim().length < 3) return "Username must be at least 3 characters.";
  if (!/^[a-zA-Z0-9._-]+$/.test(input.username.trim())) return "Username may contain letters, numbers, dots and dashes only.";
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return "Enter a valid email address.";
  if (!input.password || input.password.length < 6) return "Password must be at least 6 characters.";
  return null;
}
