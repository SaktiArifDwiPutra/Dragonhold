import type { Database } from "@dragonhold/db";
import { sql } from "drizzle-orm";

// Bisa dipakai di dalam transaksi (tx) maupun db biasa
export async function nextCitizenCode(db: Pick<Database, "execute">) {
  const rows = (await db.execute(
    sql`select nextval('citizen_code_seq') as n`,
  )) as unknown as Array<{ n: string }>;
  const n = Number(rows[0]!.n);
  return `DH-${String(n).padStart(6, "0")}`;
}