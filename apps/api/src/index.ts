import { serve } from "@hono/node-server";
import { createDb } from "@dragonhold/db";
import { createApp } from "./app";
import { env } from "./env";

const { db } = createDb(env.DATABASE_URL);

const app = createApp(db, {
  webOrigins: env.WEB_ORIGIN.split(",").map((s) => s.trim()),
  isProd: env.NODE_ENV === "production",
});

serve({ fetch: app.fetch, port: env.API_PORT }, (info) => {
  console.log(`Dragonhold API berjalan di http://localhost:${info.port}`);
});