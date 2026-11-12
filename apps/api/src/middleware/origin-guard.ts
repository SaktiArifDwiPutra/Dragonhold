import { createMiddleware } from "hono/factory";
import { HttpError } from "../lib/errors";
import type { AppEnv } from "../types";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Normalizes an HTTP(S) origin string into canonical `<scheme>://<hostname>[:<port>]` form.
 * - Lowercases scheme and hostname
 * - Strips default ports (:80 for http, :443 for https) and preserves non-default ports
 * - Rejects wildcards (`*`), `"null"`, non-http(s) schemes, credentials, paths, queries, and hashes
 */
export function normalizeOrigin(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "*" || trimmed.toLowerCase() === "null") {
    return null;
  }

  const candidate = trimmed.replace(/\/$/, "");
  if (candidate.includes("?") || candidate.includes("#")) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  if (url.username || url.password) {
    return null;
  }

  if (url.pathname !== "/" || url.search || url.hash) {
    return null;
  }

  if (!url.hostname || url.origin === "null") {
    return null;
  }

  return url.origin;
}

/**
 * Normalizes a Vercel system URL (`VERCEL_URL` or `VERCEL_BRANCH_URL`),
 * which Vercel provides as a bare hostname (e.g. `my-app-git-branch.vercel.app`)
 * without the `https://` protocol prefix.
 */
export function normalizeVercelOrigin(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "*") return null;

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) {
    if (!trimmed.toLowerCase().startsWith("https://")) {
      return null;
    }
    return normalizeOrigin(trimmed);
  }

  return normalizeOrigin(`https://${trimmed}`);
}

/**
 * Normalizes and deduplicates a list of origin strings, discarding invalid entries.
 */
export function normalizeOriginList(origins: readonly string[]): string[] {
  const result = new Set<string>();
  for (const entry of origins) {
    const normalized = normalizeOrigin(entry);
    if (normalized) {
      result.add(normalized);
    }
  }
  return Array.from(result);
}

/**
 * Builds the trusted origin allowlist from `WEB_ORIGIN` plus optional
 * Vercel preview deployment URLs (`VERCEL_URL`, `VERCEL_BRANCH_URL`).
 */
export function resolveWebOrigins(input: {
  WEB_ORIGIN: string;
  VERCEL_URL?: string;
  VERCEL_BRANCH_URL?: string;
}): string[] {
  const origins = new Set<string>();

  for (const raw of input.WEB_ORIGIN.split(",")) {
    const normalized = normalizeOrigin(raw);
    if (normalized) {
      origins.add(normalized);
    }
  }

  for (const vercelUrl of [input.VERCEL_URL, input.VERCEL_BRANCH_URL]) {
    const normalized = normalizeVercelOrigin(vercelUrl);
    if (normalized) {
      origins.add(normalized);
    }
  }

  return Array.from(origins);
}

/**
 * Checks whether a request `Origin` header matches the trusted origin allowlist
 * after normalizing scheme, hostname, and port.
 */
export function isOriginAllowed(
  originHeader: string,
  allowedOrigins: readonly string[],
): boolean {
  const normalizedRequestOrigin = normalizeOrigin(originHeader);
  if (!normalizedRequestOrigin) {
    return false;
  }

  for (const allowed of allowedOrigins) {
    const normalizedAllowed = normalizeOrigin(allowed);
    if (normalizedAllowed && normalizedAllowed === normalizedRequestOrigin) {
      return true;
    }
  }

  return false;
}

// Proteksi CSRF dasar: browser selalu mengirim Origin pada request yang mengubah data
export const originGuard = createMiddleware<AppEnv>(async (c, next) => {
  if (MUTATING.has(c.req.method)) {
    const origin = c.req.header("origin");
    if (origin !== undefined && !isOriginAllowed(origin, c.get("config").webOrigins)) {
      throw new HttpError(403, "BAD_ORIGIN", "Origin tidak diizinkan.");
    }
  }
  await next();
});
