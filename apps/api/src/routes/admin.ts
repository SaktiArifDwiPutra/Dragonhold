import { auditLogs, citizens, users } from "@dragonhold/db";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { validate } from "../lib/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import type { AppEnv } from "../types";

export const adminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z
    .string()
    .trim()
    .max(64)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "CITIZEN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});

type OverviewCountRow = {
  totalUsers: number | string;
  activeUsers: number | string;
  suspendedUsers: number | string;
  totalCitizens: number | string;
  activeSessions: number | string;
  activeSessionUsers: number | string;
  publishedAnnouncements: number | string;
  totalAnnouncements: number | string;
  totalAuditLogs: number | string;
};

export const adminRoutes = new Hono<AppEnv>();

// Every admin route requires a valid session and an explicit ADMIN or SUPER_ADMIN role
adminRoutes.use("*", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"));

adminRoutes.get("/overview", async (c) => {
  const db = c.get("db");

  const countRows = (await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM users) AS "totalUsers",
      (SELECT count(*)::int FROM users WHERE status = 'ACTIVE') AS "activeUsers",
      (SELECT count(*)::int FROM users WHERE status = 'SUSPENDED') AS "suspendedUsers",
      (SELECT count(*)::int FROM citizens) AS "totalCitizens",
      (SELECT count(*)::int FROM sessions WHERE expires_at > now()) AS "activeSessions",
      (SELECT count(DISTINCT user_id)::int FROM sessions WHERE expires_at > now()) AS "activeSessionUsers",
      (SELECT count(*)::int FROM announcements WHERE status = 'PUBLISHED') AS "publishedAnnouncements",
      (SELECT count(*)::int FROM announcements) AS "totalAnnouncements",
      (SELECT count(*)::int FROM audit_logs) AS "totalAuditLogs"
  `)) as unknown as OverviewCountRow[];

  const rawStats = countRows[0];
  const stats = {
    totalUsers: Number(rawStats?.totalUsers ?? 0),
    activeUsers: Number(rawStats?.activeUsers ?? 0),
    suspendedUsers: Number(rawStats?.suspendedUsers ?? 0),
    totalCitizens: Number(rawStats?.totalCitizens ?? 0),
    activeSessions: Number(rawStats?.activeSessions ?? 0),
    activeSessionUsers: Number(rawStats?.activeSessionUsers ?? 0),
    publishedAnnouncements: Number(rawStats?.publishedAnnouncements ?? 0),
    totalAnnouncements: Number(rawStats?.totalAnnouncements ?? 0),
    totalAuditLogs: Number(rawStats?.totalAuditLogs ?? 0),
  };

  const activityRows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorId: users.id,
      actorUsername: users.username,
      actorRole: users.role,
    })
    .from(auditLogs)
    .innerJoin(users, eq(users.id, auditLogs.actorUserId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(20);

  const recentActivity = activityRows.map((row) => ({
    id: row.id,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt,
    actor: {
      id: row.actorId,
      username: row.actorUsername,
      role: row.actorRole,
    },
  }));

  return c.json({ stats, recentActivity });
});

adminRoutes.get("/users", validate("query", adminUsersQuerySchema), async (c) => {
  const { page, limit, search, role, status } = c.req.valid("query");
  const db = c.get("db");

  const conditions = [];
  if (role) {
    conditions.push(eq(users.role, role));
  }
  if (status) {
    conditions.push(eq(users.status, status));
  }
  if (search) {
    const escaped = search.replace(/[\\%_]/g, "\\$&");
    const pattern = `%${escaped}%`;
    conditions.push(
      or(
        ilike(users.username, pattern),
        ilike(citizens.characterName, pattern),
        ilike(citizens.citizenCode, pattern),
      )!,
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(users)
    .leftJoin(citizens, eq(citizens.userId, users.id))
    .where(whereClause);

  const total = Number(countRow?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const offset = (page - 1) * limit;

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      citizenId: citizens.id,
      citizenCode: citizens.citizenCode,
      characterName: citizens.characterName,
      citizenStatus: citizens.status,
      joinedAt: citizens.joinedAt,
    })
    .from(users)
    .leftJoin(citizens, eq(citizens.userId, users.id))
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  const items = rows.map((row) => ({
    id: row.id,
    username: row.username,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt,
    citizen: row.citizenId
      ? {
          id: row.citizenId,
          citizenCode: row.citizenCode!,
          characterName: row.characterName!,
          status: row.citizenStatus!,
          joinedAt: row.joinedAt!,
        }
      : null,
  }));

  return c.json({
    users: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
});

