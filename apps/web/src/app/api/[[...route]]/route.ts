import { createApp } from "@dragonhold/api";
import { envSchema } from "@dragonhold/api/env";
import { createDb } from "@dragonhold/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cachedApp: ReturnType<typeof createApp> | null = null;

function getApp() {
  if (cachedApp) return cachedApp;

  const env = envSchema.parse(process.env);
  const { db } = createDb(env.DATABASE_URL);

  cachedApp = createApp(db, {
    basePath: "/api",
    webOrigins: env.WEB_ORIGIN.split(",").map((s) => s.trim()),
    isProd: env.NODE_ENV === "production",
    trustedProxyHops: env.TRUSTED_PROXY_HOPS,
    registrationMode: env.REGISTRATION_MODE,
    betaAccessCode: env.BETA_ACCESS_CODE,
    cookieDomain: env.COOKIE_DOMAIN,
  });

  return cachedApp;
}

const handler = (req: Request) => getApp().fetch(req);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;

