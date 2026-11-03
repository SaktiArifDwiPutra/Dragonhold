import { createMiddleware } from "hono/factory";
import { HttpError } from "../lib/errors";
import type { AppEnv } from "../types";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Proteksi CSRF dasar: browser selalu mengirim Origin pada request yang mengubah data
export const originGuard = createMiddleware<AppEnv>(async (c, next) => {
  if (MUTATING.has(c.req.method)) {
    const origin = c.req.header("origin");
    if (origin && !c.get("config").webOrigins.includes(origin)) {
      throw new HttpError(403, "BAD_ORIGIN", "Origin tidak diizinkan.");
    }
  }
  await next();
});