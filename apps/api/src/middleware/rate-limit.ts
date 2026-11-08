import { createMiddleware } from "hono/factory";
import { getClientIp } from "../lib/client-ip";
import { HttpError } from "../lib/errors";
import type { AppEnv } from "../types";

// In-memory: cukup untuk satu instance. Kalau nanti multi-instance, pindah ke Redis/DB.
export function rateLimit(opts: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, opts.windowMs).unref();

  return createMiddleware<AppEnv>(async (c, next) => {
    const key = getClientIp(c, c.get("config").trustedProxyHops);

    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + opts.windowMs });
    } else {
      entry.count += 1;
      if (entry.count > opts.max) {
        c.header("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
        throw new HttpError(
          429,
          "RATE_LIMITED",
          "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.",
        );
      }
    }
    await next();
  });
}