import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app";
import type { AppConfig } from "../types";

function createCorsApp() {
  const config: AppConfig = {
    webOrigins: ["https://dragonhold.my.id", "http://localhost:3000"],
    isProd: true,
    trustedProxyHops: 1,
    registrationMode: "closed_beta",
    cookieDomain: ".dragonhold.my.id",
  };
  const mockDb = {
    execute: async () => [{ "?column?": 1 }],
  } as any;
  return createApp(mockDb, config);
}

test("CORS: preflight OPTIONS request returns allowed origin and credentials", async () => {
  const app = createCorsApp();

  const res = await app.request("/auth/login", {
    method: "OPTIONS",
    headers: {
      Origin: "https://dragonhold.my.id",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "Content-Type",
    },
  });

  assert.equal(res.status, 204);
  assert.equal(
    res.headers.get("access-control-allow-origin"),
    "https://dragonhold.my.id",
  );
  assert.equal(res.headers.get("access-control-allow-credentials"), "true");
});

test("CORS: rejects unauthorized origin in preflight", async () => {
  const app = createCorsApp();

  const res = await app.request("/auth/login", {
    method: "OPTIONS",
    headers: {
      Origin: "https://malicious-site.com",
      "Access-Control-Request-Method": "POST",
    },
  });

  assert.notEqual(
    res.headers.get("access-control-allow-origin"),
    "https://malicious-site.com",
  );
});

test("Origin Guard: blocks mutating request with unauthorized origin header", async () => {
  const app = createCorsApp();

  const res = await app.request("/auth/logout", {
    method: "POST",
    headers: {
      Origin: "https://evil-hacker.com",
    },
  });

  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.error.code, "BAD_ORIGIN");
});

test("Origin Guard: permits mutating request with authorized origin", async () => {
  const app = createCorsApp();

  const res = await app.request("/auth/logout", {
    method: "POST",
    headers: {
      Origin: "https://dragonhold.my.id",
    },
  });

  assert.equal(res.status, 204);
});
