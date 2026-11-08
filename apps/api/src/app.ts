import type { Database } from "@dragonhold/db";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { HttpError } from "./lib/errors";
import { originGuard } from "./middleware/origin-guard";
import { announcementRoutes } from "./routes/announcements";
import { authRoutes } from "./routes/auth";
import type { AppConfig, AppEnv } from "./types";

export function createApp(db: Database, config: AppConfig) {
  const app = new Hono<AppEnv>();

  app.use(async (c, next) => {
    c.set("db", db);
    c.set("config", config);
    await next();
  });
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
    return c.json(
      { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan pada server." } },
      500,
    );
  });

  return app;
}