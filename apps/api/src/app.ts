import type { Database } from "@dragonhold/db";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { HttpError } from "./lib/errors";
import { originGuard } from "./middleware/origin-guard";
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

  app.get("/health", (c) => c.json({ status: "ok" }));
  app.route("/auth", authRoutes);

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