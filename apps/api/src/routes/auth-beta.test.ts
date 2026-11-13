import assert from "node:assert/strict";
import test from "node:test";
import { hash } from "@node-rs/argon2";
import { createApp } from "../app";
import type { AppConfig } from "../types";

const TEST_PASSWORD = "strongpassword123";
const TEST_PASSWORD_HASH = await hash(TEST_PASSWORD);

function createAuthTestApp(
  configOverrides: Partial<AppConfig> = {},
  options: { transactionError?: unknown } = {},
) {
  const config: AppConfig = {
    webOrigins: ["http://localhost:3000"],
    isProd: false,
    trustedProxyHops: 0,
    registrationMode: "open",
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
              },
            ];
          },
        }),
      }),
    }),
    transaction: async (cb: (tx: any) => Promise<any>) => {
      if (options.transactionError) {
        throw options.transactionError;
      }
      const tx = {
        insert: () => ({
          values: (vals: any) => ({
            returning: async () => [
              {
                id: "test-user-id",
                username: vals.username ?? "citizen_one",
                citizenCode: vals.citizenCode ?? "DH-000002",
                characterName:
                  vals.characterName ?? vals.username ?? "citizen_one",
              },
            ],
          }),
        }),
        execute: async () => [{ n: "2" }],
      };
      return cb(tx);
    },
    insert: () => ({
      values: async () => {},
    }),
    delete: () => ({
      where: async () => {},
    }),
  } as any;

  return createApp(mockDb, config);
}

test("GET /auth/registration-config: returns active registration mode", async () => {
  const openApp = createAuthTestApp({ registrationMode: "open" });
  const openRes = await openApp.request("/auth/registration-config");
  assert.equal(openRes.status, 200);
  assert.deepEqual(await openRes.json(), { mode: "open" });

  const betaApp = createAuthTestApp({ registrationMode: "closed_beta" });
  const betaRes = await betaApp.request("/auth/registration-config");
  assert.equal(betaRes.status, 200);
  assert.deepEqual(await betaRes.json(), { mode: "closed_beta" });
});

test("Open mode: allows public registration without beta code and sets session cookie", async () => {
  const app = createAuthTestApp({
    registrationMode: "open",
    betaAccessCode: undefined,
  });

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

  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.user.username, "citizen_open");
  assert.equal(body.user.role, "CITIZEN");
  assert.equal(body.citizen.citizenCode, "DH-000002");
  const setCookie = res.headers.get("set-cookie");
  assert.ok(setCookie);
  assert.ok(setCookie.includes("dh_session="));
});

test("Open mode: returns 409 ALREADY_EXISTS on duplicate username or email", async () => {
  const app = createAuthTestApp(
    { registrationMode: "open" },
    { transactionError: { code: "23505" } },
  );

  const res = await app.request("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify({
      username: "citizen_dup",
      email: "dup@example.com",
      password: TEST_PASSWORD,
      confirmPassword: TEST_PASSWORD,
    }),
  });

  assert.equal(res.status, 409);
  const body = await res.json();
  assert.equal(body.error.code, "ALREADY_EXISTS");
});

test("Closed beta: fails closed (503) if BETA_ACCESS_CODE is not configured", async () => {
  const app = createAuthTestApp({
    registrationMode: "closed_beta",
    betaAccessCode: undefined,
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
      password: TEST_PASSWORD,
      confirmPassword: TEST_PASSWORD,
      betaCode: "ANY-CODE",
    }),
  });

  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.error.code, "REGISTRATION_UNAVAILABLE");
});

test("Closed beta: rejects invalid beta access code with 403", async () => {
  const app = createAuthTestApp({
    registrationMode: "closed_beta",
    betaAccessCode: "SECRET-DRAGON-2026",
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
      password: TEST_PASSWORD,
      confirmPassword: TEST_PASSWORD,
      betaCode: "WRONG-CODE",
    }),
  });

  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.error.code, "INVALID_BETA_CODE");
  assert.equal(JSON.stringify(body).includes("SECRET-DRAGON-2026"), false);
});

test("Closed beta: allows registration with valid beta code (case-insensitive)", async () => {
  const app = createAuthTestApp({
    registrationMode: "closed_beta",
    betaAccessCode: "SECRET-DRAGON-2026",
  });

  const res = await app.request("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify({
      username: "citizen_valid",
      email: "valid@example.com",
      password: TEST_PASSWORD,
      confirmPassword: TEST_PASSWORD,
      betaCode: "secret-dragon-2026",
    }),
  });

  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.user.username, "citizen_valid");
  const setCookie = res.headers.get("set-cookie");
  assert.ok(setCookie);
  assert.ok(setCookie.includes("dh_session="));
});

test("POST /auth/login: existing user login succeeds and issues session cookie", async () => {
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
