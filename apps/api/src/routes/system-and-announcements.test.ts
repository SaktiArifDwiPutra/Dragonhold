import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app";
import type { AppConfig } from "../types";

function createMockApp(dbMock: any) {
  const config: AppConfig = {
    webOrigins: ["http://localhost:3000"],
    isProd: false,
    trustedProxyHops: 0,
  };
  return createApp(dbMock, config);
}

test("GET /health: liveness probe returns 200 ok unconditionally", async () => {
  const app = createMockApp({});
  const res = await app.request("/health");
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.deepEqual(data, { status: "ok" });
});

test("GET /ready: returns 200 ready when database connection succeeds", async () => {
  const mockDb = {
    execute: async () => [{ "?column?": 1 }],
  } as any;
  const app = createMockApp(mockDb);

  const res = await app.request("/ready");
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.deepEqual(data, { status: "ready", database: "connected" });
});

test("GET /ready: returns 503 not_ready when database connection fails", async () => {
  const mockDb = {
    execute: async () => {
      throw new Error("Connection refused");
    },
  } as any;
  const app = createMockApp(mockDb);

  const res = await app.request("/ready");
  assert.equal(res.status, 503);
  const data = await res.json();
  assert.deepEqual(data, { status: "not_ready", database: "disconnected" });
});

test("GET /announcements: returns only published announcements", async () => {
  const sampleAnnouncements = [
    {
      id: "ann-1",
      title: "Episode 001 Teaser",
      content: "The dragon war has ended. Dragonhold is founded.",
      category: "OFFICIAL",
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  const mockDb = {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve(sampleAnnouncements),
          }),
        }),
      }),
    }),
  } as any;

  const app = createMockApp(mockDb);
  const res = await app.request("/announcements");
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.announcements.length, 1);
  assert.equal(data.announcements[0].title, "Episode 001 Teaser");
});

test("Unhandled Postgres 42P01 (missing table) returns 503 DATABASE_MIGRATION_PENDING", async () => {
  const mockDb = {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: async () => {
              const err = new Error('relation "polls" does not exist') as Error & {
                code: string;
              };
              err.code = "42P01";
              throw err;
            },
          }),
        }),
      }),
    }),
  } as any;

  const app = createMockApp(mockDb);
  const res = await app.request("/announcements");
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.error.code, "DATABASE_MIGRATION_PENDING");
});
