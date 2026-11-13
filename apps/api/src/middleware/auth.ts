import { citizens, sessions, users } from "@dragonhold/db";
import { eq } from "drizzle-orm";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { HttpError } from "../lib/errors";
import { SESSION_COOKIE, clearSessionCookie, hashToken } from "../lib/session";
import type { AppEnv, AuthContext } from "../types";

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) {
    throw new HttpError(401, "UNAUTHENTICATED", "Kamu belum masuk.");
  }

  const db = c.get("db");
  const [row] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      userStatus: users.status,
      citizenId: citizens.id,
      citizenCode: citizens.citizenCode,
      characterName: citizens.characterName,
      avatarUrl: citizens.avatarUrl,
      citizenStatus: citizens.status,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .leftJoin(citizens, eq(citizens.userId, users.id))
    .where(eq(sessions.tokenHash, hashToken(token)))
    .limit(1);

  if (!row || row.expiresAt.getTime() <= Date.now()) {
    clearSessionCookie(c, c.get("config").cookieDomain);
    throw new HttpError(401, "UNAUTHENTICATED", "Sesi tidak valid atau sudah berakhir.");
  }

  // Akun yang disuspend langsung kehilangan akses
  if (row.userStatus !== "ACTIVE") {
    throw new HttpError(403, "ACCOUNT_SUSPENDED", "Akun ini sedang disuspend.");
  }

  const auth: AuthContext = {
    sessionId: row.sessionId,
    userId: row.userId,
    username: row.username,
    email: row.email,
    role: row.role,
    citizenId: row.citizenId,
    citizenCode: row.citizenCode,
    characterName: row.characterName,
    avatarUrl: row.avatarUrl ?? null,
    citizenStatus: row.citizenId ? (row.citizenStatus ?? "ACTIVE") : null,
  };
  c.set("auth", auth);
  await next();
});

export const optionalAuth = createMiddleware<AppEnv>(async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) {
    await next();
    return;
  }

  try {
    const db = c.get("db");
    const [row] = await db
      .select({
        sessionId: sessions.id,
        expiresAt: sessions.expiresAt,
        userId: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        userStatus: users.status,
        citizenId: citizens.id,
        citizenCode: citizens.citizenCode,
        characterName: citizens.characterName,
        avatarUrl: citizens.avatarUrl,
        citizenStatus: citizens.status,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .leftJoin(citizens, eq(citizens.userId, users.id))
      .where(eq(sessions.tokenHash, hashToken(token)))
      .limit(1);

    if (row && row.expiresAt.getTime() > Date.now() && row.userStatus === "ACTIVE") {
      c.set("auth", {
        sessionId: row.sessionId,
        userId: row.userId,
        username: row.username,
        email: row.email,
        role: row.role,
        citizenId: row.citizenId,
        citizenCode: row.citizenCode,
        characterName: row.characterName,
        avatarUrl: row.avatarUrl ?? null,
        citizenStatus: row.citizenId ? (row.citizenStatus ?? "ACTIVE") : null,
      });
    }
  } catch {
    // Public routes remain accessible even if optional session lookup fails
  }

  await next();
});

// Dipakai setelah requireAuth, misalnya: requireRole("ADMIN", "SUPER_ADMIN")
export const requireRole = (...roles: AuthContext["role"][]) =>
  createMiddleware<AppEnv>(async (c, next) => {
    if (!roles.includes(c.get("auth").role)) {
      throw new HttpError(403, "FORBIDDEN", "Kamu tidak punya izin untuk aksi ini.");
    }
    await next();
  });
