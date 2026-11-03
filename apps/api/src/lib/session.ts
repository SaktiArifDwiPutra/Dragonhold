import { createHash, randomBytes } from "node:crypto";
import type { Database } from "@dragonhold/db";
import { sessions } from "@dragonhold/db";
import { lt } from "drizzle-orm";
import type { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";

export const SESSION_COOKIE = "dh_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 hari

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

// Yang disimpan di DB hanya hash-nya (64 karakter hex)
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(db: Database, userId: string) {
  // bersihkan sesi kedaluwarsa sambil jalan
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));

  const token = generateToken();
  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

export function setSessionCookie(c: Context, token: string, isProd: boolean) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}