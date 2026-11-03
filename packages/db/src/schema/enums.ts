import { pgEnum } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["SUPER_ADMIN", "ADMIN", "CITIZEN"]);
export const userStatus = pgEnum("user_status", ["ACTIVE", "SUSPENDED"]);
export const citizenStatus = pgEnum("citizen_status", [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
]);
export const kingdomStatus = pgEnum("kingdom_status", [
  "NEWLY_ESTABLISHED",
  "DEVELOPING",
  "ESTABLISHED",
]);
export const announcementCategory = pgEnum("announcement_category", [
  "OFFICIAL",
  "ROYAL_DECREE",
  "RECRUITMENT",
  "ELECTION",
  "COMMUNITY",
]);
export const announcementStatus = pgEnum("announcement_status", [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);