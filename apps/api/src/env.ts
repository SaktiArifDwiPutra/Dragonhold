import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().int().default(4000),
  PORT: z.coerce.number().int().optional(),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  TRUSTED_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  REGISTRATION_MODE: z.enum(["closed_beta", "open"]).default("closed_beta"),
  BETA_ACCESS_CODE: z.string().optional(),
  COOKIE_DOMAIN: z.string().optional(),
});

export const env = schema.parse(process.env);