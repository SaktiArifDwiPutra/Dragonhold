import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type DbOptions = {
  max?: number;
  idleTimeout?: number;
  connectTimeout?: number;
  maxLifetime?: number;
};

export function createDb(databaseUrl: string, options?: DbOptions) {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const client = postgres(databaseUrl, {
    max: options?.max ?? (isServerless ? 3 : 10),
    idle_timeout: options?.idleTimeout ?? (isServerless ? 20 : undefined),
    connect_timeout: options?.connectTimeout ?? 10,
    max_lifetime: options?.maxLifetime ?? (isServerless ? 60 * 30 : undefined),
  });
  const db = drizzle(client, { schema });
  return { db, client };
}

export type Database = ReturnType<typeof createDb>["db"];