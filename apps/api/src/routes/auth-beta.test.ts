import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app";
import type { AppConfig } from "../types";

function createTestApp(configOverrides: Partial<AppConfig> = {}) {
  const config: AppConfig = {
    webOrigins: ["http://localhost:3000"],
    isProd: false,
    trustedProxyHops: 0,
    registrationMode: "closed_beta",
    betaAccessCode: "SECRET-DRAGON-2026",
    ...configOverrides,
  };

  // Mock database
  const mockDb = {
    execute: async () => [{ n: "2" }],
    transaction: async (cb: any) => {
      const tx = {
        insert: () => ({
          values: (vals: any) => ({
            returning: () => [
              {
                id: "test-user-id",
                username: vals.username ?? "citizen_one",
                citizenCode: vals.citizenCode ?? "DH-000002",
                characterName: vals.characterName ?? vals.username ?? "citizen_one",
              },
            ],
          }),
        }),
        execute: async () => [{ n: "2" }],
      };
      return cb(tx);
    },
    insert: () => ({
      values: () => Promise.resolve(),
    }),
    delete: () => ({
      where: () => Promise.resolve(),
    }),
  } as any;

  return createApp(mockDb, config);
}

test("Closed beta: fails closed (503) if BETA_ACCESS_CODE is not configured", async () => {
  const app = createTestApp({ betaAccessCode: undefined });

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
      betaCode: "ANY-CODE",
    }),
  });

  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.error.code, "REGISTRATION_UNAVAILABLE");
  assert.equal(body.error.message, "Pendaftaran closed beta sedang ditutup.");
  // Pastikan tidak ada rahasia yang bocor
  assert.equal(JSON.stringify(body).includes("SECRET"), false);
});

test("Closed beta: rejects invalid beta access code with 403", async () => {
  const app = createTestApp();

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
      betaCode: "WRONG-CODE",
    }),
  });

  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.error.code, "INVALID_BETA_CODE");
  assert.equal(body.error.message, "Kode akses closed beta tidak valid.");
  // Pastikan kode yang benar tidak bocor di response
  assert.equal(JSON.stringify(body).includes("SECRET-DRAGON-2026"), false);
});

test("Closed beta: rejects registration when beta code is omitted with 403", async () => {
  const app = createTestApp();

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
  assert.equal(body.error.code, "INVALID_BETA_CODE");
});

test("Closed beta: allows registration with valid beta code (case-insensitive)", async () => {
  const app = createTestApp();

  const res = await app.request("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify({
      username: "citizen_valid",
      email: "valid@example.com",
      password: "strongpassword123",
      confirmPassword: "strongpassword123",
      betaCode: "secret-dragon-2026", // Huruf kecil tetap valid
    }),
  });

  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.user.username, "citizen_valid");
  // Pastikan cookie sesi diset
  const setCookie = res.headers.get("set-cookie");
  assert.ok(setCookie);
  assert.ok(setCookie.includes("dh_session="));
});

test("Open mode: allows registration without beta code", async () => {
  const app = createTestApp({
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
      password: "strongpassword123",
      confirmPassword: "strongpassword123",
    }),
  });

  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.user.username, "citizen_open");
});
