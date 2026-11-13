import { z } from "zod";

export {
  isOriginAllowed,
  normalizeOrigin,
  normalizeOriginList,
  normalizeVercelOrigin,
  resolveWebOrigins,
} from "./middleware/origin-guard";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().int().default(4000),
  PORT: z.coerce.number().int().optional(),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  VERCEL_URL: z.string().optional(),
  VERCEL_BRANCH_URL: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  TRUSTED_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  REGISTRATION_MODE: z.enum(["closed_beta", "open"]).default("open"),
  BETA_ACCESS_CODE: z.string().optional(),
  COOKIE_DOMAIN: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
});

export function getEnv(raw = process.env) {
  return envSchema.parse(raw);
}

export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof z.infer<typeof envSchema>];
  },
});
