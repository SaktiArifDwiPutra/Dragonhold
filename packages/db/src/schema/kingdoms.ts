import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { kingdomStatus } from "./enums";

export const kingdoms = pgTable("kingdoms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  description: text("description").notNull().default(""),
  status: kingdomStatus("status").notNull().default("NEWLY_ESTABLISHED"),
  foundedAt: timestamp("founded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});