import { citizens, users } from "@dragonhold/db";
import { loginSchema, registerSchema } from "@dragonhold/shared";
import { hash, verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { sessions } from "@dragonhold/db";
import { nextCitizenCode } from "../lib/citizen-code";
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

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

export const authRoutes = new Hono<AppEnv>();

authRoutes.post(
  "/register",
  authLimiter,
  validate("json", registerSchema),
  async (c) => {
    const input = c.req.valid("json");
    const config = c.get("config");

    if (config.registrationMode === "closed_beta") {
      // Fail-closed: jika server tidak punya konfigurasi kode beta, tolak pendaftaran
      if (!config.betaAccessCode || config.betaAccessCode.trim() === "") {
        throw new HttpError(
          503,
          "REGISTRATION_UNAVAILABLE",
          "Pendaftaran closed beta sedang ditutup.",
        );
      }
      const provided = input.betaCode?.trim();
      const expected = config.betaAccessCode.trim();
      if (!provided || provided.toLowerCase() !== expected.toLowerCase()) {
        throw new HttpError(
          403,
          "INVALID_BETA_CODE",
          "Kode akses closed beta tidak valid.",
        );
      }
    }

    const db = c.get("db");
    const passwordHash = await hash(input.password); // Argon2id

    let created;
    try {
      created = await db.transaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({
            username: input.username,
            email: input.email,
            passwordHash,
          })
          .returning({ id: users.id, username: users.username });

        const citizenCode = await nextCitizenCode(tx);
        const [citizen] = await tx
          .insert(citizens)
          .values({
            userId: user!.id,
            citizenCode,
            characterName: input.username,
          })
          .returning({
            id: citizens.id,
            citizenCode: citizens.citizenCode,
            characterName: citizens.characterName,
          });

        return { user: user!, citizen: citizen! };
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new HttpError(409, "ALREADY_EXISTS", "Username atau email sudah dipakai.");
      }
      throw err;
    }

    const token = await createSession(db, created.user.id);
    setSessionCookie(c, token, config.isProd, config.cookieDomain);

    return c.json(
      {
        user: { id: created.user.id, username: created.user.username, role: "CITIZEN" },
        citizen: created.citizen,
      },
      201,
    );
  },
);

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
        }
      : null,
  });
});