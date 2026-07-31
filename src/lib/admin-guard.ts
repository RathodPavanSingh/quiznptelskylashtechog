import type { User } from "@/lib/auth";

export type AdminAccess = { allowed: true; user: User | null };

export async function checkAdminAccess(): Promise<AdminAccess> {
  return { allowed: true, user: null };
}
