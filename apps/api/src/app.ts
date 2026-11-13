import type { Database } from "@dragonhold/db";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { HttpError } from "./lib/errors";
import {
  isOriginAllowed,
  normalizeOrigin,
  normalizeOriginList,
  originGuard,
} from "./middleware/origin-guard";
import { adminRoutes } from "./routes/admin";
import { announcementRoutes } from "./routes/announcements";
import { authRoutes } from "./routes/auth";
import { votingRoutes } from "./routes/voting";
import type { AppConfig, AppEnv } from "./types";

export function createApp(db: Database, config: AppConfig) {
  const normalizedConfig: AppConfig = {
    ...config,
    webOrigins: normalizeOriginList(config.webOrigins),
  };

  const app = normalizedConfig.basePath
    ? new Hono<AppEnv>().basePath(normalizedConfig.basePath)
    : new Hono<AppEnv>();

  app.use(async (c, next) => {
    c.set("db", db);
    c.set("config", normalizedConfig);
    await next();
  });

  app.use(
    "*",
    cors({
      origin: (origin, c) => {
        const allowed = c.get("config").webOrigins;
        if (!origin) return allowed[0] ?? "";
        return isOriginAllowed(origin, allowed) ? normalizeOrigin(origin) : null;
      },
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400,
    }),
  );

  app.use(originGuard);

  // Liveness probe (fast 200 OK)
  app.get("/health", (c) => c.json({ status: "ok" }));

  // Readiness probe (verifikasi koneksi database aktif)
  app.get("/ready", async (c) => {
    try {
      await c.get("db").execute(sql`SELECT 1`);
      return c.json({ status: "ready", database: "connected" });
    } catch {
      return c.json(
        { status: "not_ready", database: "disconnected" },
        503,
      );
    }
  });

  app.route("/auth", authRoutes);
  app.route("/announcements", announcementRoutes);
  app.route("/voting", votingRoutes);
  app.route("/admin", adminRoutes);

  app.notFound((c) =>
    c.json({ error: { code: "NOT_FOUND", message: "Endpoint tidak ditemukan." } }, 404),
  );

  // Semua error keluar dengan format yang sama: { error: { code, message, details? } }
  app.onError((err, c) => {
    if (err instanceof HttpError) {
      return c.json(
        { error: { code: err.code, message: err.message, details: err.details } },
        err.status,
      );
    }
    if (err instanceof HTTPException) {
      return c.json(
        { error: { code: "HTTP_ERROR", message: err.message } },
        err.status,
      );
    }
    console.error(err);
    const pgCode =
      (err as { code?: string; cause?: { code?: string } } | null)?.code ??
      (err as { cause?: { code?: string } } | null)?.cause?.code;
    if (pgCode === "42P01") {
      return c.json(
        {
          error: {
            code: "DATABASE_MIGRATION_PENDING",
            message: "Skema database belum lengkap. Jalankan migrasi database terlebih dahulu.",
          },
        },
        503,
      );
    }
    return c.json(
      { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan pada server." } },
      500,
    );
  });

  return app;
}
