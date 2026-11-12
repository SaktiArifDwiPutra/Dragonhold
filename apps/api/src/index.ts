import { serve } from "@hono/node-server";
import { createDb } from "@dragonhold/db";
import { createApp } from "./app";
import { env, resolveWebOrigins } from "./env";

const { db } = createDb(env.DATABASE_URL);

const app = createApp(db, {
  webOrigins: resolveWebOrigins(env),
  isProd: env.NODE_ENV === "production",
  trustedProxyHops: env.TRUSTED_PROXY_HOPS,
  registrationMode: env.REGISTRATION_MODE,
  betaAccessCode: env.BETA_ACCESS_CODE,
  cookieDomain: env.COOKIE_DOMAIN,
});

const port = env.PORT ?? env.API_PORT;

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, (info) => {
  console.log(`Dragonhold API berjalan di http://${info.address}:${info.port}`);
});