import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app";
import {
  isOriginAllowed,
  normalizeOrigin,
  normalizeVercelOrigin,
  resolveWebOrigins,
} from "../env";
import type { AppConfig } from "../types";

function createCorsApp(webOrigins = ["https://dragonhold.my.id", "http://localhost:3000"]) {
  const config: AppConfig = {
    webOrigins,
    isProd: true,
    trustedProxyHops: 1,
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

test("Origin Guard: permits mutating request with authorized Production origin", async () => {
  const app = createCorsApp();

  const res = await app.request("/auth/logout", {
    method: "POST",
    headers: {
      Origin: "https://dragonhold.my.id",
    },
  });

  assert.equal(res.status, 204);
});

test("Origin Guard: permits mutating request with local development origin", async () => {
  const origins = resolveWebOrigins({
    WEB_ORIGIN: "http://localhost:3000",
  });
  const app = createCorsApp(origins);

  const res = await app.request("/auth/logout", {
    method: "POST",
    headers: {
      Origin: "http://localhost:3000",
    },
  });

  assert.equal(res.status, 204);
});

test("Origin Guard: permits Vercel Preview origins from VERCEL_URL and VERCEL_BRANCH_URL", async () => {
  const origins = resolveWebOrigins({
    WEB_ORIGIN: "https://dragonhold.my.id",
    VERCEL_URL: "dragonhold-abc1234-team.vercel.app",
    VERCEL_BRANCH_URL: "dragonhold-git-feat-vercel-api-integration-team.vercel.app",
  });

  assert.deepEqual(origins, [
    "https://dragonhold.my.id",
    "https://dragonhold-abc1234-team.vercel.app",
    "https://dragonhold-git-feat-vercel-api-integration-team.vercel.app",
  ]);

  const app = createCorsApp(origins);

  // Deployment-specific preview URL
  const deployRes = await app.request("/auth/logout", {
    method: "POST",
    headers: {
      Origin: "https://dragonhold-abc1234-team.vercel.app",
    },
  });
  assert.equal(deployRes.status, 204);

  // Branch preview URL
  const branchRes = await app.request("/auth/logout", {
    method: "POST",
    headers: {
      Origin: "https://dragonhold-git-feat-vercel-api-integration-team.vercel.app",
    },
  });
  assert.equal(branchRes.status, 204);

  // Production URL remains permitted
  const prodRes = await app.request("/auth/logout", {
    method: "POST",
    headers: {
      Origin: "https://dragonhold.my.id",
    },
  });
  assert.equal(prodRes.status, 204);

  // Unrelated Vercel deployment is rejected
  const untrustedVercelRes = await app.request("/auth/logout", {
    method: "POST",
    headers: {
      Origin: "https://other-project-xyz.vercel.app",
    },
  });
  assert.equal(untrustedVercelRes.status, 403);
  const untrustedData = await untrustedVercelRes.json();
  assert.equal(untrustedData.error.code, "BAD_ORIGIN");
});

test("Origin Guard: normalizes scheme, hostname casing, and default/custom ports", async () => {
  assert.equal(
    normalizeOrigin("HTTPS://DragonHold.MY.ID:443/"),
    "https://dragonhold.my.id",
  );
  assert.equal(
    normalizeOrigin("http://LocalHost:80"),
    "http://localhost",
  );
  assert.equal(
    normalizeOrigin("http://localhost:3000/"),
    "http://localhost:3000",
  );
  assert.equal(
    normalizeVercelOrigin("DragonHold-Git-Main.Vercel.App"),
    "https://dragonhold-git-main.vercel.app",
  );
  assert.equal(
    normalizeVercelOrigin("https://DragonHold-Git-Main.Vercel.App:443/"),
    "https://dragonhold-git-main.vercel.app",
  );

  const app = createCorsApp(["https://DragonHold.my.id/", "http://localhost:3000"]);

  // Normalized match with uppercase hostname and explicit default :443 port
  const normalizedMatchRes = await app.request("/auth/logout", {
    method: "POST",
    headers: {
      Origin: "https://DRAGONHOLD.MY.ID:443",
    },
  });
  assert.equal(normalizedMatchRes.status, 204);

  // Rejects mismatched scheme (http instead of https)
  const wrongSchemeRes = await app.request("/auth/logout", {
    method: "POST",
    headers: {
      Origin: "http://dragonhold.my.id",
    },
  });
  assert.equal(wrongSchemeRes.status, 403);

  // Rejects mismatched port (http://localhost:4000 vs http://localhost:3000)
  const wrongPortRes = await app.request("/auth/logout", {
    method: "POST",
    headers: {
      Origin: "http://localhost:4000",
    },
  });
  assert.equal(wrongPortRes.status, 403);
});

test("Origin Guard: rejects wildcard, null, and malformed origins", async () => {
  assert.equal(normalizeOrigin("*"), null);
  assert.equal(normalizeOrigin("null"), null);
  assert.equal(normalizeOrigin("ftp://dragonhold.my.id"), null);
  assert.equal(normalizeOrigin("https://dragonhold.my.id/path"), null);
  assert.equal(normalizeOrigin("https://dragonhold.my.id?query=1"), null);
  assert.equal(normalizeOrigin("https://user:pass@dragonhold.my.id"), null);
  assert.equal(isOriginAllowed("*", ["*"]), false);

  // Even if "*" is passed into config, it is stripped and never trusted
  const app = createCorsApp(["*", "https://dragonhold.my.id"]);

  for (const invalidOrigin of [
    "*",
    "null",
    "not-a-valid-origin",
    "https://dragonhold.my.id/evil",
  ]) {
    const res = await app.request("/auth/logout", {
      method: "POST",
      headers: {
        Origin: invalidOrigin,
      },
    });
    assert.equal(res.status, 403, `Expected 403 for Origin: ${invalidOrigin}`);
    const body = await res.json();
    assert.equal(body.error.code, "BAD_ORIGIN");
  }
});

test("Origin Guard: permits mutating request when Origin header is omitted per existing policy", async () => {
  const app = createCorsApp();

  const res = await app.request("/auth/logout", {
    method: "POST",
  });

  assert.equal(res.status, 204);
});

