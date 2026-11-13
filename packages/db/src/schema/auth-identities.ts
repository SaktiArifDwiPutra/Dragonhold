import {
  boolean,
  index,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const authIdentities = pgTable(
  "auth_identities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).notNull(),
    providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("auth_identities_provider_user_id_unique").on(
      t.provider,
      t.providerUserId,
    ),
    unique("auth_identities_user_provider_unique").on(t.userId, t.provider),
    index("auth_identities_user_idx").on(t.userId),
    index("auth_identities_email_idx").on(t.email),
  ],
);

// Short-lived, single-use onboarding transaction after verifying Google identity.
// Only stores the SHA-256 hash of the cookie token (64 hex chars), never raw tokens or Google API tokens.
export const oauthOnboardingSessions = pgTable(
  "oauth_onboarding_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    provider: varchar("provider", { length: 32 }).notNull(),
    providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    suggestedDisplayName: varchar("suggested_display_name", { length: 64 }),
    suggestedAvatarUrl: varchar("suggested_avatar_url", { length: 512 }),
    usedAt: timestamp("used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("oauth_onboarding_expires_idx").on(t.expiresAt),
    index("oauth_onboarding_provider_sub_idx").on(t.provider, t.providerUserId),
  ],
);

