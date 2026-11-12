import { citizens, sessions, users } from "@dragonhold/db";
import { loginSchema } from "@dragonhold/shared";
import { hash, verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HttpError } from "../lib/errors";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  createSession,
  hashToken,
  setSessionCookie,
} from "../lib/session";
import { validate } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import { rateLimit } from "../middleware/rate-limit";
import type { AppEnv } from "../types";

// Hash palsu agar waktu respons login tetap mirip meski email tidak terdaftar
const DUMMY_HASH = await hash("dragonhold-dummy-password");

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/register", authLimiter, async () => {
  throw new HttpError(
    403,
    "REGISTRATION_DISABLED",
    "Pendaftaran publik sedang ditutup.",
  );
});

authRoutes.post(
  "/login",
  authLimiter,
  validate("json", loginSchema),
  async (c) => {
    const { email, password } = c.req.valid("json");
    const db = c.get("db");
    const config = c.get("config");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const valid = await verify(user?.passwordHash ?? DUMMY_HASH, password);
    if (!user || !valid) {
      throw new HttpError(401, "INVALID_CREDENTIALS", "Email atau password salah.");
    }
    if (user.status !== "ACTIVE") {
      throw new HttpError(403, "ACCOUNT_SUSPENDED", "Akun ini sedang disuspend.");
    }

    const [citizen] = await db
      .select({
        id: citizens.id,
        citizenCode: citizens.citizenCode,
        characterName: citizens.characterName,
      })
      .from(citizens)
      .where(eq(citizens.userId, user.id))
      .limit(1);

    const token = await createSession(db, user.id);
    setSessionCookie(c, token, config.isProd, config.cookieDomain);

    return c.json({
      user: { id: user.id, username: user.username, role: user.role },
      citizen: citizen ?? null,
    });
  },
);

authRoutes.post("/logout", async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    await c
      .get("db")
      .delete(sessions)
      .where(eq(sessions.tokenHash, hashToken(token)));
  }
  clearSessionCookie(c, c.get("config").cookieDomain);
  return c.body(null, 204);
});

authRoutes.get("/me", requireAuth, (c) => {
  const a = c.get("auth");
  return c.json({
    user: { id: a.userId, username: a.username, email: a.email, role: a.role },
    citizen: a.citizenId
      ? {
          id: a.citizenId,
          citizenCode: a.citizenCode,
          characterName: a.characterName,
          status: a.citizenStatus ?? "ACTIVE",
        }
      : null,
  });
});
