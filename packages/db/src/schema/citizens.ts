import {
  index,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { citizenStatus } from "./enums";
import { users } from "./users";

// DH-000001 dipakai SUPER_ADMIN dari seed, jadi mulai dari 2
export const citizenCodeSeq = pgSequence("citizen_code_seq", { startWith: 2 });
export const citizens = pgTable(
  "citizens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // restrict: akun tidak boleh terhapus begitu saja, riwayat harus aman
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "restrict" }),
    citizenCode: varchar("citizen_code", { length: 16 }).notNull().unique(),
    characterName: varchar("character_name", { length: 64 }).notNull(),
    biography: text("biography").notNull().default(""),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    status: citizenStatus("status").notNull().default("ACTIVE"),
  },
  (t) => [
    index("citizens_status_idx").on(t.status),
    index("citizens_name_idx").on(t.characterName),
  ],
);