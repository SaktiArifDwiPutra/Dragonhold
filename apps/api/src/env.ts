import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().int().default(4000),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  TRUSTED_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
});

export const env = schema.parse(process.env);