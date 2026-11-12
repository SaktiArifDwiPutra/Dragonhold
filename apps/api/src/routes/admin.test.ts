import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app";
import { hashToken } from "../lib/session";
import type { AppConfig } from "../types";

type MockSessionOption = {
  role: "SUPER_ADMIN" | "ADMIN" | "CITIZEN";
  userStatus?: "ACTIVE" | "SUSPENDED";
  expired?: boolean;
};

const VALID_TOKEN = "test-session-token-admin-1234567890";
const VALID_TOKEN_HASH = hashToken(VALID_TOKEN);

function createAdminTestApp(sessionOpt?: MockSessionOption) {
  const config: AppConfig = {
    webOrigins: ["http://localhost:3000"],
    isProd: false,
    trustedProxyHops: 0,
  };

  const sessionRow = sessionOpt
    ? {
        sessionId: "sess-1",
        expiresAt: new Date(Date.now() + (sessionOpt.expired ? -60_000 : 3600_000)),
        userId: "user-1",
        username: "archdragon",
        email: "archdragon@dragonhold.realm",
        role: sessionOpt.role,
        userStatus: sessionOpt.userStatus ?? "ACTIVE",
        citizenId: "cit-1",
        citizenCode: "DH-000001",
        characterName: "The Creator",
      }
    : null;

  const sampleUsers = [
    {
      id: "user-1",
      username: "archdragon",
      role: "SUPER_ADMIN" as const,
      status: "ACTIVE" as const,
      createdAt: new Date("2026-11-01T00:00:00Z").toISOString(),
      citizenId: "cit-1",
      citizenCode: "DH-000001",
      characterName: "The Creator",
      citizenStatus: "ACTIVE" as const,
      joinedAt: new Date("2026-11-01T00:00:00Z").toISOString(),
    },
    {
      id: "user-2",
      username: "aedan_vance",
      role: "CITIZEN" as const,
      status: "ACTIVE" as const,
      createdAt: new Date("2026-11-05T12:00:00Z").toISOString(),
      citizenId: "cit-2",
      citizenCode: "DH-000002",
      characterName: "Aedan Vance",
      citizenStatus: "ACTIVE" as const,
      joinedAt: new Date("2026-11-05T12:00:00Z").toISOString(),
    },
  ];

  const sampleAuditLogs = [
    {
      id: "audit-1",
      action: "announcement.publish",
      targetType: "announcement",
      targetId: "ann-0001-2222-3333",
      metadata: { category: "ROYAL_DECREE" },
      createdAt: new Date("2026-11-10T09:30:00Z").toISOString(),
      actorId: "user-1",
      actorUsername: "archdragon",
      actorRole: "SUPER_ADMIN" as const,
    },
  ];

  const mockDb = {
    execute: async () => [
      {
        totalUsers: 2,
        activeUsers: 2,
        suspendedUsers: 0,
        totalCitizens: 2,
        activeSessions: 1,
        activeSessionUsers: 1,
        publishedAnnouncements: 1,
        totalAnnouncements: 2,
        totalAuditLogs: 1,
      },
    ],
    select: (fields: Record<string, unknown>) => ({
      from: () => ({
        // Used by requireAuth: .from(sessions).innerJoin(users).leftJoin(citizens).where(...).limit(1)
        // Used by /admin/overview: .from(auditLogs).innerJoin(users).orderBy(...).limit(20)
        innerJoin: () => ({
          leftJoin: () => ({
            where: () => ({
              limit: async () => (sessionRow ? [sessionRow] : []),
            }),
          }),
          orderBy: () => ({
            limit: async () => sampleAuditLogs,
          }),
        }),
        // Used by /admin/users: .from(users).leftJoin(citizens).where(...)
        leftJoin: () => ({
          where: () => {
            if ("total" in fields) {
              return Promise.resolve([{ total: sampleUsers.length }]);
            }
            return {
              orderBy: () => ({
                limit: () => ({
                  offset: async () => sampleUsers,
                }),
              }),
            };
          },
        }),
      }),
    }),
  } as any;

  return { app: createApp(mockDb, config), tokenHash: VALID_TOKEN_HASH };
}

test("Admin API: rejects unauthenticated requests with 401 UNAUTHENTICATED", async () => {
  const { app } = createAdminTestApp();

  const overviewRes = await app.request("/admin/overview");
  assert.equal(overviewRes.status, 401);
  const overviewBody = await overviewRes.json();
  assert.equal(overviewBody.error.code, "UNAUTHENTICATED");

  const usersRes = await app.request("/admin/users");
  assert.equal(usersRes.status, 401);
  const usersBody = await usersRes.json();
  assert.equal(usersBody.error.code, "UNAUTHENTICATED");
});

test("Admin API: rejects authenticated CITIZEN (non-admin) requests with 403 FORBIDDEN", async () => {
  const { app } = createAdminTestApp({ role: "CITIZEN" });
  const cookieHeader = `dh_session=${VALID_TOKEN}`;

  const overviewRes = await app.request("/admin/overview", {
    headers: { Cookie: cookieHeader },
  });
  assert.equal(overviewRes.status, 403);
  const overviewBody = await overviewRes.json();
  assert.equal(overviewBody.error.code, "FORBIDDEN");

  const usersRes = await app.request("/admin/users", {
    headers: { Cookie: cookieHeader },
  });
  assert.equal(usersRes.status, 403);
  const usersBody = await usersRes.json();
  assert.equal(usersBody.error.code, "FORBIDDEN");
});

test("Admin API: rejects suspended admin accounts with 403 ACCOUNT_SUSPENDED", async () => {
  const { app } = createAdminTestApp({
    role: "ADMIN",
    userStatus: "SUSPENDED",
  });

  const res = await app.request("/admin/overview", {
    headers: { Cookie: `dh_session=${VALID_TOKEN}` },
  });
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.error.code, "ACCOUNT_SUSPENDED");
});

test("Admin API: allows authenticated ADMIN and SUPER_ADMIN to fetch overview and recent activity", async () => {
  for (const role of ["ADMIN", "SUPER_ADMIN"] as const) {
    const { app } = createAdminTestApp({ role });

    const res = await app.request("/admin/overview", {
      headers: { Cookie: `dh_session=${VALID_TOKEN}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(body.stats.totalUsers, 2);
    assert.equal(body.stats.activeUsers, 2);
    assert.equal(body.stats.totalCitizens, 2);
    assert.equal(body.stats.activeSessions, 1);
    assert.equal(body.stats.publishedAnnouncements, 1);
    assert.equal(body.stats.totalAuditLogs, 1);

    assert.equal(body.recentActivity.length, 1);
    assert.equal(body.recentActivity[0].action, "announcement.publish");
    assert.equal(body.recentActivity[0].actor.username, "archdragon");
  }
});

test("Admin API: returns monitored users without leaking passwordHash, email, or session tokens", async () => {
  const { app } = createAdminTestApp({ role: "SUPER_ADMIN" });

  const res = await app.request("/admin/users?page=1&limit=20", {
    headers: { Cookie: `dh_session=${VALID_TOKEN}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.equal(body.users.length, 2);
  assert.equal(body.pagination.total, 2);
  assert.equal(body.pagination.page, 1);

  for (const u of body.users) {
    assert.equal("passwordHash" in u, false);
    assert.equal("password_hash" in u, false);
    assert.equal("email" in u, false);
    assert.equal("tokenHash" in u, false);
    assert.ok(u.id);
    assert.ok(u.username);
    assert.ok(u.role);
    assert.ok(u.status);
  }
});

test("Admin API: validates pagination and filter parameters and rejects invalid inputs with 400", async () => {
  const { app } = createAdminTestApp({ role: "ADMIN" });
  const headers = { Cookie: `dh_session=${VALID_TOKEN}` };

  const badPageRes = await app.request("/admin/users?page=0", { headers });
  assert.equal(badPageRes.status, 400);
  const badPageBody = await badPageRes.json();
  assert.equal(badPageBody.error.code, "VALIDATION_ERROR");

  const badLimitRes = await app.request("/admin/users?limit=500", { headers });
  assert.equal(badLimitRes.status, 400);

  const badRoleRes = await app.request("/admin/users?role=EMPEROR", { headers });
  assert.equal(badRoleRes.status, 400);

  const badStatusRes = await app.request("/admin/users?status=DELETED", { headers });
  assert.equal(badStatusRes.status, 400);
});

