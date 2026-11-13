import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { verifyWithJwks } from "hono/jwt";
import { HttpError } from "./errors";

export const OAUTH_STATE_COOKIE = "dh_oauth_state";
export const ONBOARDING_COOKIE = "dh_onboarding";
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const ONBOARDING_TTL_MS = 15 * 60 * 1000; // 15 minutes

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS_URI = "https://www.googleapis.com/oauth2/v3/certs";

export type OAuthIntent = "login" | "register" | "link";

export type OAuthStatePayload = {
  state: string;
  nonce: string;
  codeVerifier: string;
  intent: OAuthIntent;
  linkUserId?: string;
  expiresAt: number;
};

export type VerifiedGoogleProfile = {
  sub: string;
  email: string;
  emailVerified: true;
  name: string | null;
  picture: string | null;
};

export interface GoogleOAuthClient {
  buildAuthorizationUrl(params: {
    state: string;
    nonce: string;
    codeChallenge: string;
  }): string;
  exchangeCodeAndVerify(params: {
    code: string;
    codeVerifier: string;
    expectedNonce: string;
  }): Promise<VerifiedGoogleProfile>;
}

export function generateOAuthSecret(): string {
  return randomBytes(32).toString("base64url");
}

export function generatePkcePair(): {
  codeVerifier: string;
  codeChallenge: string;
} {
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
}

function safeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function deriveHmacKey(secret: string): Buffer {
  return createHash("sha256").update(`dragonhold-oauth-state:${secret}`).digest();
}

export function encodeStateCookie(
  payload: OAuthStatePayload,
  secret: string,
): string {
  const data = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", deriveHmacKey(secret))
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

export function decodeStateCookie(
  rawCookie: string | undefined,
  secret: string,
): OAuthStatePayload | null {
  if (!rawCookie) return null;
  const dotIdx = rawCookie.indexOf(".");
  if (dotIdx <= 0 || dotIdx === rawCookie.length - 1) return null;

  const data = rawCookie.slice(0, dotIdx);
  const sig = rawCookie.slice(dotIdx + 1);
  if (!data || !sig || rawCookie.indexOf(".", dotIdx + 1) !== -1) return null;

  const expectedSig = createHmac("sha256", deriveHmacKey(secret))
    .update(data)
    .digest("base64url");

  if (!safeEqualString(sig, expectedSig)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Partial<OAuthStatePayload>;
  if (
    typeof obj.state !== "string" ||
    typeof obj.nonce !== "string" ||
    typeof obj.codeVerifier !== "string" ||
    (obj.intent !== "login" && obj.intent !== "register" && obj.intent !== "link") ||
    typeof obj.expiresAt !== "number" ||
    !Number.isFinite(obj.expiresAt) ||
    obj.expiresAt <= Date.now()
  ) {
    return null;
  }

  return {
    state: obj.state,
    nonce: obj.nonce,
    codeVerifier: obj.codeVerifier,
    intent: obj.intent,
    linkUserId: typeof obj.linkUserId === "string" ? obj.linkUserId : undefined,
    expiresAt: obj.expiresAt,
  };
}

export function verifyStateMatch(expected: string, actual: string | undefined): boolean {
  if (!actual) return false;
  return safeEqualString(expected, actual);
}

export function sanitizeSuggestedUsername(
  name: string | null,
  email: string,
): string {
  const emailLocal = email.split("@")[0] ?? "";
  const candidateSource = (emailLocal || name || "citizen")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 28);

  if (candidateSource.length >= 3) {
    return candidateSource;
  }
  return `citizen_${candidateSource || "dh"}`.slice(0, 28);
}

export function createGoogleOAuthClient(opts: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  fetchImpl?: typeof fetch;
  jwksKeys?: Parameters<typeof verifyWithJwks>[1]["keys"];
}): GoogleOAuthClient {
  const fetchFn = opts.fetchImpl ?? fetch;

  return {
    buildAuthorizationUrl({ state, nonce, codeChallenge }) {
      const url = new URL(GOOGLE_AUTH_ENDPOINT);
      url.searchParams.set("client_id", opts.clientId);
      url.searchParams.set("redirect_uri", opts.redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "openid email profile");
      url.searchParams.set("state", state);
      url.searchParams.set("nonce", nonce);
      url.searchParams.set("code_challenge", codeChallenge);
      url.searchParams.set("code_challenge_method", "S256");
      url.searchParams.set("prompt", "select_account");
      return url.toString();
    },

    async exchangeCodeAndVerify({ code, codeVerifier, expectedNonce }) {
      const body = new URLSearchParams({
        code,
        client_id: opts.clientId,
        client_secret: opts.clientSecret,
        redirect_uri: opts.redirectUri,
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
      });

      let tokenRes: Response;
      try {
        tokenRes = await fetchFn(GOOGLE_TOKEN_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        });
      } catch {
        throw new HttpError(
          502,
          "OAUTH_UPSTREAM_ERROR",
          "Gagal menghubungi layanan autentikasi Google.",
        );
      }

      if (!tokenRes.ok) {
        throw new HttpError(
          401,
          "INVALID_ID_TOKEN",
          "Gagal menukar kode otorisasi Google.",
        );
      }

      const tokenJson = (await tokenRes.json().catch(() => null)) as {
        id_token?: unknown;
      } | null;

      if (!tokenJson || typeof tokenJson.id_token !== "string" || !tokenJson.id_token) {
        throw new HttpError(
          401,
          "INVALID_ID_TOKEN",
          "Respons Google tidak menyertakan token identitas yang valid.",
        );
      }

      let payload: Record<string, unknown>;
      try {
        payload = (await verifyWithJwks(tokenJson.id_token, {
          allowedAlgorithms: ["RS256"],
          ...(opts.jwksKeys
            ? { keys: opts.jwksKeys }
            : { jwks_uri: GOOGLE_JWKS_URI }),
          verification: {
            iss: /^(https:\/\/accounts\.google\.com|accounts\.google\.com)$/,
            aud: opts.clientId,
            exp: true,
            nbf: true,
            iat: false,
          },
        })) as Record<string, unknown>;
      } catch {
        throw new HttpError(
          401,
          "INVALID_ID_TOKEN",
          "Token identitas Google tidak valid atau sudah kedaluwarsa.",
        );
      }

      // Enforce exp explicitly even if omitted by a malformed token
      const nowSec = Math.floor(Date.now() / 1000);
      if (typeof payload.exp !== "number" || payload.exp <= nowSec) {
        throw new HttpError(
          401,
          "INVALID_ID_TOKEN",
          "Token identitas Google sudah kedaluwarsa.",
        );
      }

      // Enforce nonce replay protection in constant time
      if (
        typeof payload.nonce !== "string" ||
        !safeEqualString(expectedNonce, payload.nonce)
      ) {
        throw new HttpError(
          401,
          "INVALID_OAUTH_NONCE",
          "Nonce autentikasi Google tidak valid.",
        );
      }

      // Require stable Google subject identifier (sub)
      if (typeof payload.sub !== "string" || payload.sub.trim().length === 0) {
        throw new HttpError(
          401,
          "INVALID_ID_TOKEN",
          "Identitas Google (sub) tidak ditemukan.",
        );
      }

      // Require verified email claim
      if (
        typeof payload.email !== "string" ||
        payload.email.trim().length === 0 ||
        payload.email_verified !== true
      ) {
        throw new HttpError(
          403,
          "EMAIL_NOT_VERIFIED",
          "Email akun Google harus sudah terverifikasi.",
        );
      }

      const rawName =
        typeof payload.name === "string" && payload.name.trim().length > 0
          ? payload.name.trim().slice(0, 64)
          : null;
      const rawPicture =
        typeof payload.picture === "string" &&
        /^https?:\/\/[^\s]+$/i.test(payload.picture.trim())
          ? payload.picture.trim().slice(0, 512)
          : null;

      return {
        sub: payload.sub.trim(),
        email: payload.email.trim().toLowerCase(),
        emailVerified: true,
        name: rawName,
        picture: rawPicture,
      };
    },
  };
}

