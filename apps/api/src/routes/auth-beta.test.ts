import assert from "node:assert/strict";
import test from "node:test";
import { hash } from "@node-rs/argon2";
import { createApp } from "../app";
import type { AppConfig } from "../types";

const TEST_PASSWORD = "strongpassword123";
const TEST_PASSWORD_HASH = await hash(TEST_PASSWORD);

function createAuthTestApp(configOverrides: Partial<AppConfig> = {}) {
  const config: AppConfig = {
    webOrigins: ["http://localhost:3000"],
    isProd: false,
    trustedProxyHops: 0,
    ...configOverrides,
  };

  let selectCall = 0;

  const mockDb = {
    execute: async () => [{ n: "2" }],
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => {
            selectCall += 1;
            if (selectCall === 1) {
              return [
                {
                  id: "user-admin-1",
                  username: "archdragon",
                  email: "archdragon@dragonhold.realm",
                  passwordHash: TEST_PASSWORD_HASH,
                  role: "SUPER_ADMIN",
                  status: "ACTIVE",
                },
              ];
            }
            return [
              {
                id: "citizen-1",
                citizenCode: "DH-000001",
                characterName: "The Creator",
                avatarUrl: null,
              },
            ];
          },
        }),
      }),
    }),
    insert: () => ({
      values: async () => {},
    }),
    delete: () => ({
      where: async () => {},
    }),
  } as any;

  return createApp(mockDb, config);
}

test("GET /auth/registration-config: returns google_oauth open mode", async () => {
  const app = createAuthTestApp();
  const res = await app.request("/auth/registration-config");
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { mode: "google_oauth", open: true });
});

test("POST /auth/register: rejects local password sign-up with 403 PASSWORD_REGISTRATION_DISABLED", async () => {
  const app = createAuthTestApp();

  const res = await app.request("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify({
      username: "citizen_open",
      email: "open@example.com",
      password: TEST_PASSWORD,
      confirmPassword: TEST_PASSWORD,
    }),
  });

  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.error.code, "PASSWORD_REGISTRATION_DISABLED");
});

test("POST /auth/login: preserves existing SUPER_ADMIN / legacy password login and issues session cookie", async () => {
  const app = createAuthTestApp();

  const res = await app.request("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify({
      email: "archdragon@dragonhold.realm",
      password: TEST_PASSWORD,
    }),
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.user.username, "archdragon");
  assert.equal(body.user.role, "SUPER_ADMIN");
  assert.equal(body.citizen.citizenCode, "DH-000001");
  const setCookie = res.headers.get("set-cookie");
  assert.ok(setCookie);
  assert.ok(setCookie.includes("dh_session="));
});
