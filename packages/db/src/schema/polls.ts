import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { citizens } from "./citizens";
import { pollResultsVisibility, pollStatus, pollType } from "./enums";
import { users } from "./users";

export const polls = pgTable(
  "polls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description").notNull(),
    type: pollType("type").notNull(),
    status: pollStatus("status").notNull().default("DRAFT"),
    resultsVisibility: pollResultsVisibility("results_visibility")
      .notNull()
      .default("HIDDEN"),
    scheduledStartAt: timestamp("scheduled_start_at", { withTimezone: true }),
    scheduledEndAt: timestamp("scheduled_end_at", { withTimezone: true }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    openedBy: uuid("opened_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    closedBy: uuid("closed_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelledBy: uuid("cancelled_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    resultsPublishedAt: timestamp("results_published_at", {
      withTimezone: true,
    }),
    publishedBy: uuid("published_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    resultsWithdrawnAt: timestamp("results_withdrawn_at", {
      withTimezone: true,
    }),
    withdrawnBy: uuid("withdrawn_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("polls_status_visibility_idx").on(t.status, t.resultsVisibility),
    index("polls_type_idx").on(t.type),
    index("polls_created_at_idx").on(t.createdAt),
  ],
);

export const pollOptions = pgTable(
  "poll_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 120 }).notNull(),
    shortDescription: varchar("short_description", { length: 280 })
      .notNull()
      .default(""),
    details: text("details").notNull().default(""),
    imageUrl: varchar("image_url", { length: 512 }),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("poll_options_poll_order_idx").on(t.pollId, t.displayOrder)],
);

export const pollVotes = pgTable(
  "poll_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "restrict" }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => pollOptions.id, { onDelete: "restrict" }),
    citizenId: uuid("citizen_id")
      .notNull()
      .references(() => citizens.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("poll_votes_poll_citizen_unique").on(t.pollId, t.citizenId),
    index("poll_votes_poll_idx").on(t.pollId),
    index("poll_votes_option_idx").on(t.optionId),
    index("poll_votes_citizen_idx").on(t.citizenId),
  ],
);

export const pollAuditLogs = pgTable(
  "poll_audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "restrict" }),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    action: varchar("action", { length: 64 }).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("poll_audit_logs_poll_idx").on(t.pollId, t.createdAt),
    index("poll_audit_logs_actor_idx").on(t.actorUserId),
  ],
);
