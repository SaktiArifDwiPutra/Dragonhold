import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { announcementCategory, announcementStatus } from "./enums";
import { users } from "./users";

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 160 }).notNull(),
    content: text("content").notNull(),
    category: announcementCategory("category").notNull().default("OFFICIAL"),
    status: announcementStatus("status").notNull().default("DRAFT"),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("announcements_status_published_idx").on(t.status, t.publishedAt),
    index("announcements_category_idx").on(t.category),
  ],
);