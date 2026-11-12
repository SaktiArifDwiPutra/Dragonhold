import assert from "node:assert/strict";
import test from "node:test";
import { hash } from "@node-rs/argon2";
import { createApp } from "../app";
import type { AppConfig } from "../types";

const TEST_PASSWORD = "strongpassword123";
const TEST_PASSWORD_HASH = await hash(TEST_PASSWORD);

function createAuthTestApp(options: { onInsertCalled?: () => void } = {}) {
  const config: AppConfig = {
    webOrigins: ["http://localhost:3000"],
    isProd: false,
    trustedProxyHops: 0,
  };

  let selectCall = 0;

  const mockDb = {
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
              },
            ];
          },
        }),
      }),
    }),
    transaction: async () => {
      options.onInsertCalled?.();
      throw new Error("Transaction should never be called when registration is disabled");
    },
    insert: () => ({
      values: async () => {
        options.onInsertCalled?.();
      },
    }),
    delete: () => ({
      where: async () => {},
    }),
  } as any;

  return createApp(mockDb, config);
}

test("POST /auth/register: rejects public registration with 403 REGISTRATION_DISABLED and does not create accounts", async () => {
  let dbMutated = false;
  const app = createAuthTestApp({
    onInsertCalled: () => {
      dbMutated = true;
    },
  });

  const res = await app.request("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify({
      username: "citizen_new",
      email: "citizen@example.com",
      password: "strongpassword123",
      confirmPassword: "strongpassword123",
    }),
  });

  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.error.code, "REGISTRATION_DISABLED");
  assert.equal(dbMutated, false);
});

test("POST /auth/login: existing user login still succeeds and issues session cookie", async () => {
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
