import assert from "node:assert/strict";
import { generateKeyPairSync, randomUUID } from "node:crypto";
import test from "node:test";
import {
  auditLogs,
  authIdentities,
  citizens,
  oauthOnboardingSessions,
  sessions,
  users,
} from "@dragonhold/db";
import { hash } from "@node-rs/argon2";
import { sign } from "hono/jwt";
import { PgDialect } from "drizzle-orm/pg-core";
import { createApp } from "../app";
import { createGoogleOAuthClient } from "../lib/google-oauth";
import type { AppConfig } from "../types";

const dialect = new PgDialect();

// Real RS256 keypair generated once per test run for genuine JWT/JWKS verification
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const PUBLIC_JWK = {
  ...(publicKey.export({ format: "jwk" }) as Record<string, unknown>),
  kid: "test-google-kid-1",
  alg: "RS256",
  use: "sig",
};
const PRIVATE_PEM = privateKey.export({ format: "pem", type: "pkcs8" }).toString();

async function signGoogleIdToken(claims: Record<string, unknown>, pem = PRIVATE_PEM) {
  const now = Math.floor(Date.now() / 1000);
  const fullClaims = {
    iss: "https://accounts.google.com",
    aud: "test-google-client-id",
    iat: now - 5,
    exp: now + 3600,
    ...claims,
  };
  return sign(fullClaims, pem, "RS256");
}

function withKidHeader(jwtToken: string, kid = "test-google-kid-1") {
  const [headerB64, payloadB64, sigB64] = jwtToken.split(".");
  const decodedHeader = JSON.parse(
    Buffer.from(headerB64!, "base64url").toString("utf8"),
  );
  decodedHeader.kid = kid;
  const newHeaderB64 = Buffer.from(JSON.stringify(decodedHeader), "utf8").toString(
    "base64url",
  );
  // Re-sign is required because header changed; instead, generate via JOSE helper:
  return `${newHeaderB64}.${payloadB64}.${sigB64}`;
}

// Helper that builds a real RS256 JWS with `kid` header using node:crypto
import { createSign } from "node:crypto";
function createSignedJwt(
  claims: Record<string, unknown>,
  opts: { kid?: string; pem?: string } = {},
) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: opts.kid ?? "test-google-kid-1",
  };
  const payload = {
    iss: "https://accounts.google.com",
    aud: "test-google-client-id",
    iat: now - 5,
    exp: now + 3600,
    ...claims,
  };
  const encHeader = Buffer.from(JSON.stringify(header), "utf8").toString("base64url");
  const encPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signingInput = `${encHeader}.${encPayload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  const signature = signer
    .sign(opts.pem ?? PRIVATE_PEM)
    .toString("base64url");
  return `${signingInput}.${signature}`;
}

type TableRow = Record<string, any>;

type DbState = {
  users: TableRow[];
  citizens: TableRow[];
  sessions: TableRow[];
  auth_identities: TableRow[];
  oauth_onboarding_sessions: TableRow[];
  audit_logs: TableRow[];
};

function createStatefulMockDb() {
  let seqCounter = 1;

  const state: DbState = {
    users: [],
    citizens: [],
    sessions: [],
    auth_identities: [],
    oauth_onboarding_sessions: [],
    audit_logs: [],
  };

  function getTableName(t: any): keyof DbState {
    if (t === users) return "users";
    if (t === citizens) return "citizens";
    if (t === sessions) return "sessions";
    if (t === authIdentities) return "auth_identities";
    if (t === oauthOnboardingSessions) return "oauth_onboarding_sessions";
    if (t === auditLogs) return "audit_logs";
    throw new Error(`Unknown table in mock DB: ${String(t)}`);
  }

  function snapshotState(): DbState {
    return structuredClone(state);
  }

  function restoreState(snap: DbState) {
    state.users = snap.users;
    state.citizens = snap.citizens;
    state.sessions = snap.sessions;
    state.auth_identities = snap.auth_identities;
    state.oauth_onboarding_sessions = snap.oauth_onboarding_sessions;
    state.audit_logs = snap.audit_logs;
  }

  function toSnakeColMap(tName: string): Record<string, string> {
    if (tName === "users") {
      return {
        id: "id",
        username: "username",
        email: "email",
        password_hash: "passwordHash",
        role: "role",
        status: "status",
        created_at: "createdAt",
        updated_at: "updatedAt",
      };
    }
    if (tName === "citizens") {
      return {
        id: "id",
        user_id: "userId",
        citizen_code: "citizenCode",
        character_name: "characterName",
        avatar_url: "avatarUrl",
        biography: "biography",
        joined_at: "joinedAt",
        status: "status",
      };
    }
    if (tName === "sessions") {
      return {
        id: "id",
        user_id: "userId",
        token_hash: "tokenHash",
        expires_at: "expiresAt",
        created_at: "createdAt",
      };
    }
    if (tName === "auth_identities") {
      return {
        id: "id",
        user_id: "userId",
        provider: "provider",
        provider_user_id: "providerUserId",
        email: "email",
        email_verified: "emailVerified",
        created_at: "createdAt",
      };
    }
    if (tName === "oauth_onboarding_sessions") {
      return {
        id: "id",
        token_hash: "tokenHash",
        provider: "provider",
        provider_user_id: "providerUserId",
        email: "email",
        email_verified: "emailVerified",
        suggested_display_name: "suggestedDisplayName",
        suggested_avatar_url: "suggestedAvatarUrl",
        used_at: "usedAt",
        expires_at: "expiresAt",
        created_at: "createdAt",
      };
    }
    return {
      id: "id",
      actor_user_id: "actorUserId",
      action: "action",
      target_type: "targetType",
      target_id: "targetId",
      metadata: "metadata",
      created_at: "createdAt",
    };
  }

  // Evaluates simple Drizzle WHERE predicates generated via PgDialect
  function evalWhere(whereCond: any, contexts: Array<{ table: string; row: TableRow }>): boolean {
    if (!whereCond) return true;
    const { sql: sqlStr, params } = dialect.sqlToQuery(whereCond);
    const conditions = sqlStr
      .replace(/^\(+|\)+$/g, "")
      .split(/\s+and\s+/i);

    for (const rawClause of conditions) {
      const clause = rawClause.replace(/^\(+|\)+$/g, "").trim();

      let m = clause.match(/^"([^"]+)"\."([^"]+)"\s*=\s*"([^"]+)"\."([^"]+)"$/i);
      if (m) {
        const [, tbl1, col1, tbl2, col2] = m;
        const prop1 = toSnakeColMap(tbl1!)[col1!] ?? col1!;
        const prop2 = toSnakeColMap(tbl2!)[col2!] ?? col2!;
        const ctx1 = contexts.find((c) => c.table === tbl1);
        const ctx2 = contexts.find((c) => c.table === tbl2);
        if (!ctx1 || !ctx2 || ctx1.row[prop1] !== ctx2.row[prop2]) return false;
        continue;
      }

      m = clause.match(/^"([^"]+)"\."([^"]+)"\s*=\s*\$(\d+)$/i);
      if (m) {
        const [, tbl, col, pIdx] = m;
        const prop = toSnakeColMap(tbl!)[col!] ?? col!;
        const ctx = contexts.find((c) => c.table === tbl);
        const val = params[Number(pIdx) - 1];
        if (!ctx || ctx.row[prop] !== val) return false;
        continue;
      }

      m = clause.match(/^"([^"]+)"\."([^"]+)"\s*is\s+null$/i);
      if (m) {
        const [, tbl, col] = m;
        const prop = toSnakeColMap(tbl!)[col!] ?? col!;
        const ctx = contexts.find((c) => c.table === tbl);
        if (!ctx || (ctx.row[prop] !== null && ctx.row[prop] !== undefined)) return false;
        continue;
      }

      m = clause.match(/^"([^"]+)"\."([^"]+)"\s*(>|<)\s*\$(\d+)$/i);
      if (m) {
        const [, tbl, col, op, pIdx] = m;
        const prop = toSnakeColMap(tbl!)[col!] ?? col!;
        const ctx = contexts.find((c) => c.table === tbl);
        const actual = ctx?.row[prop];
        const expected = params[Number(pIdx) - 1];
        const toMs = (v: any) =>
          v instanceof Date
            ? v.getTime()
            : typeof v === "string"
              ? new Date(v).getTime()
              : Number(v);
        const actualMs = toMs(actual);
        const expectedMs = toMs(expected);
        if (op === ">" && !(actualMs > expectedMs)) return false;
        if (op === "<" && !(actualMs < expectedMs)) return false;
        continue;
      }

      throw new Error(`Unsupported SQL clause in mock DB: ${clause} (full: ${sqlStr})`);
    }
    return true;
  }

  function projectRow(selectFields: any, contexts: Array<{ table: string; row: TableRow }>) {
    if (!selectFields) {
      return { ...contexts[0]!.row };
    }
    const out: TableRow = {};
    for (const [alias, colExpr] of Object.entries(selectFields) as Array<[string, any]>) {
      const tbl = getTableName(colExpr.table);
      const prop = colExpr.name ? toSnakeColMap(tbl)[colExpr.name] ?? colExpr.name : alias;
      const ctx = contexts.find((c) => c.table === tbl);
      out[alias] = ctx ? (ctx.row[prop] ?? null) : null;
    }
    return out;
  }

  function insertRow(table: any, values: TableRow) {
    const tName = getTableName(table);
    const now = new Date();
    const row: TableRow = {
      id: values.id ?? randomUUID(),
      createdAt: values.createdAt ?? now,
      ...values,
    };

    if (tName === "users") {
      row.passwordHash = values.passwordHash ?? null;
      row.role = values.role ?? "CITIZEN";
      row.status = values.status ?? "ACTIVE";
      row.updatedAt = values.updatedAt ?? now;

      if (state.users.some((u) => u.username === row.username)) {
        throw Object.assign(new Error("unique violation"), {
          code: "23505",
          constraint: "users_username_unique",
        });
      }
      if (state.users.some((u) => u.email === row.email)) {
        throw Object.assign(new Error("unique violation"), {
          code: "23505",
          constraint: "users_email_unique",
        });
      }
    } else if (tName === "citizens") {
      row.biography = values.biography ?? "";
      row.avatarUrl = values.avatarUrl ?? null;
      row.joinedAt = values.joinedAt ?? now;
      row.status = values.status ?? "ACTIVE";
      if (state.citizens.some((c) => c.userId === row.userId)) {
        throw Object.assign(new Error("unique violation"), {
          code: "23505",
          constraint: "citizens_user_id_unique",
        });
      }
      if (state.citizens.some((c) => c.citizenCode === row.citizenCode)) {
        throw Object.assign(new Error("unique violation"), {
          code: "23505",
          constraint: "citizens_citizen_code_unique",
        });
      }
    } else if (tName === "auth_identities") {
      row.emailVerified = values.emailVerified ?? false;
      if (
        state.auth_identities.some(
          (i) => i.provider === row.provider && i.providerUserId === row.providerUserId,
        )
      ) {
        throw Object.assign(new Error("unique violation"), {
          code: "23505",
          constraint: "auth_identities_provider_user_id_unique",
        });
      }
      if (
        state.auth_identities.some(
          (i) => i.userId === row.userId && i.provider === row.provider,
        )
      ) {
        throw Object.assign(new Error("unique violation"), {
          code: "23505",
          constraint: "auth_identities_user_provider_unique",
        });
      }
    } else if (tName === "oauth_onboarding_sessions") {
      row.usedAt = values.usedAt ?? null;
      row.suggestedDisplayName = values.suggestedDisplayName ?? null;
      row.suggestedAvatarUrl = values.suggestedAvatarUrl ?? null;
    }

    state[tName]!.push(row);
    return row;
  }

  function makeExecutor(): any {
    const executor: any = {
      execute: async () => {
        seqCounter += 1;
        return [{ n: String(seqCounter) }];
      },
      select: (fields?: any) => ({
        from: (baseTable: any) => {
          const baseName = getTableName(baseTable);
          const joins: Array<{ tableName: keyof DbState; kind: "inner" | "left"; on: any }> = [];
          let whereCond: any = null;

          const runSelect = (limitNum?: number) => {
            let matches: Array<Array<{ table: string; row: TableRow }>> = [];
            for (const baseRow of state[baseName]!) {
              let combinations: Array<Array<{ table: string; row: TableRow }>> = [
                [{ table: baseName, row: baseRow }],
              ];
              for (const j of joins) {
                const nextCombos: Array<Array<{ table: string; row: TableRow }>> = [];
                for (const combo of combinations) {
                  let matchedAny = false;
                  for (const jRow of state[j.tableName]!) {
                    const candidate = [...combo, { table: j.tableName, row: jRow }];
                    if (evalWhere(j.on, candidate)) {
                      matchedAny = true;
                      nextCombos.push(candidate);
                    }
                  }
                  if (!matchedAny && j.kind === "left") {
                    nextCombos.push([...combo, { table: j.tableName, row: {} }]);
                  }
                }
                combinations = nextCombos;
              }
              matches.push(...combinations);
            }

            if (whereCond) {
              matches = matches.filter((ctx) => evalWhere(whereCond, ctx));
            }
            const projected = matches.map((ctx) => projectRow(fields, ctx));
            return typeof limitNum === "number" ? projected.slice(0, limitNum) : projected;
          };

          const builder: any = {
            innerJoin: (tbl: any, on: any) => {
              joins.push({ tableName: getTableName(tbl), kind: "inner", on });
              return builder;
            },
            leftJoin: (tbl: any, on: any) => {
              joins.push({ tableName: getTableName(tbl), kind: "left", on });
              return builder;
            },
            where: (cond: any) => {
              whereCond = cond;
              return builder;
            },
            limit: async (n: number) => runSelect(n),
          };
          return builder;
        },
      }),
      insert: (table: any) => ({
        values: (vals: TableRow) => {
          const inserted = insertRow(table, vals);
          return {
            returning: async (fields?: any) => [
              projectRow(fields, [{ table: getTableName(table), row: inserted }]),
            ],
            then: (resolve: (val: any) => void) => resolve(undefined),
          };
        },
      }),
      update: (table: any) => {
        const tName = getTableName(table);
        return {
          set: (updates: TableRow) => ({
            where: (cond: any) => {
              const updatedRows: TableRow[] = [];
              for (const row of state[tName]!) {
                if (evalWhere(cond, [{ table: tName, row }])) {
                  Object.assign(row, updates);
                  updatedRows.push({ ...row });
                }
              }
              return {
                returning: async (fields?: any) =>
                  updatedRows.map((r) => projectRow(fields, [{ table: tName, row: r }])),
                then: (resolve: (val: any) => void) => resolve(undefined),
              };
            },
          }),
        };
      },
      delete: (table: any) => {
        const tName = getTableName(table);
        return {
          where: async (cond: any) => {
            state[tName] = state[tName]!.filter(
              (row) => !evalWhere(cond, [{ table: tName, row }]),
            );
          },
        };
      },
      transaction: async (cb: (tx: any) => Promise<any>) => {
        const snap = snapshotState();
        try {
          return await cb(makeExecutor());
        } catch (err) {
          restoreState(snap);
          throw err;
        }
      },
    };
    return executor;
  }

  return { db: makeExecutor(), state };
}

function extractCookieValue(setCookieHeaders: string[], name: string): string | null {
  for (const h of setCookieHeaders) {
    const m = h.match(new RegExp(`(?:^|,\\s*)${name}=([^;]+)`));
    if (m) return m[1]!;
  }
  return null;
}

function getAllSetCookies(res: Response): string[] {
  const headersAny = res.headers as unknown as { getSetCookie?: () => string[] };
  if (typeof headersAny.getSetCookie === "function") {
    return headersAny.getSetCookie();
  }
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

function createGoogleTestEnv(
  nextTokenResponse: () => { ok?: boolean; status?: number; json: any },
  configOverrides: Partial<AppConfig> = {},
) {
  const { db, state } = createStatefulMockDb();
  const googleClientSecret = "test-google-client-secret";
  const googleOAuthClient = createGoogleOAuthClient({
    clientId: "test-google-client-id",
    clientSecret: googleClientSecret,
    redirectUri: "http://localhost:3000/api/auth/google/callback",
    jwksKeys: [PUBLIC_JWK as any],
    fetchImpl: async () => {
      const r = nextTokenResponse();
      return new Response(JSON.stringify(r.json), {
        status: r.status ?? (r.ok === false ? 400 : 200),
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  const app = createApp(db, {
    webOrigins: ["http://localhost:3000"],
    isProd: false,
    trustedProxyHops: 0,
    googleClientId: "test-google-client-id",
    googleClientSecret,
    googleRedirectUri: "http://localhost:3000/api/auth/google/callback",
    googleOAuthClient,
    ...configOverrides,
  });

  return { app, state, db };
}

async function startOAuthFlow(
  app: ReturnType<typeof createApp>,
  intent: "login" | "register" | "link" = "login",
  extraHeaders: Record<string, string> = {},
) {
  const startRes = await app.request(`/auth/google/start?intent=${intent}`, {
    headers: extraHeaders,
  });
  assert.equal(startRes.status, 302);
  const location = startRes.headers.get("location")!;
  const authUrl = new URL(location);
  const stateParam = authUrl.searchParams.get("state")!;
  const nonce = authUrl.searchParams.get("nonce")!;
  const codeChallenge = authUrl.searchParams.get("code_challenge");
  assert.equal(authUrl.searchParams.get("scope"), "openid email profile");
  assert.equal(authUrl.searchParams.get("response_type"), "code");
  assert.equal(authUrl.searchParams.get("code_challenge_method"), "S256");
  assert.ok(codeChallenge);

  const stateCookie = extractCookieValue(getAllSetCookies(startRes), "dh_oauth_state")!;
  assert.ok(stateCookie);

  return { stateParam, nonce, stateCookie };
}

test("1 & 2 & 16: First-time Google registration -> onboarding -> returning login -> /auth/me -> /auth/logout", async () => {
  let nextJwt = "";
  const { app, state } = createGoogleTestEnv(() => ({
    json: { id_token: nextJwt, access_token: "unused-token", refresh_token: "unused-refresh" },
  }));

  // 1. Start OAuth for new citizen
  const { stateParam, nonce, stateCookie } = await startOAuthFlow(app, "register");
  nextJwt = createSignedJwt({
    sub: "google-sub-100",
    email: "Aedan.Vance@gmail.com",
    email_verified: true,
    name: "Aedan Vance",
    picture: "https://lh3.googleusercontent.com/a/aedan.png",
    nonce,
  });

  // Callback redirects to /onboarding with dh_onboarding cookie
  const cbRes = await app.request(
    `/auth/google/callback?code=auth-code-1&state=${encodeURIComponent(stateParam)}`,
    { headers: { Cookie: `dh_oauth_state=${stateCookie}` } },
  );
  assert.equal(cbRes.status, 302);
  assert.ok(cbRes.headers.get("location")!.endsWith("/onboarding"));
  const onboardingCookie = extractCookieValue(getAllSetCookies(cbRes), "dh_onboarding")!;
  assert.ok(onboardingCookie);
  assert.equal(state.users.length, 0, "Should not create user before onboarding finishes");

  // Fetch onboarding metadata
  const infoRes = await app.request("/auth/google/onboarding", {
    headers: { Cookie: `dh_onboarding=${onboardingCookie}` },
  });
  assert.equal(infoRes.status, 200);
  const info = await infoRes.json();
  assert.equal(info.email, "aedan.vance@gmail.com");
  assert.equal(info.suggestedDisplayName, "Aedan Vance");
  assert.equal(info.suggestedAvatarUrl, "https://lh3.googleusercontent.com/a/aedan.png");
  assert.equal(info.hasUnlinkedEmailAccount, false);

  // Check username availability
  const availRes = await app.request("/auth/username-available?username=aedan_vance");
  assert.equal(availRes.status, 200);
  assert.equal((await availRes.json()).available, true);

  // Complete onboarding
  const completeRes = await app.request("/auth/google/onboarding", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
      Cookie: `dh_onboarding=${onboardingCookie}`,
    },
    body: JSON.stringify({
      username: "aedan_vance",
      displayName: "Lord Aedan",
      avatarUrl: "https://lh3.googleusercontent.com/a/custom.png",
    }),
  });
  assert.equal(completeRes.status, 201);
  const createdBody = await completeRes.json();
  assert.equal(createdBody.user.username, "aedan_vance");
  assert.equal(createdBody.user.role, "CITIZEN");
  assert.equal(createdBody.citizen.characterName, "Lord Aedan");
  assert.equal(createdBody.citizen.avatarUrl, "https://lh3.googleusercontent.com/a/custom.png");

  // Verify DB records: no passwordHash, no Google tokens stored
  assert.equal(state.users.length, 1);
  assert.equal(state.users[0]!.passwordHash, null);
  assert.equal(state.users[0]!.role, "CITIZEN");
  assert.equal(state.citizens.length, 1);
  assert.equal(state.auth_identities.length, 1);
  assert.equal(state.auth_identities[0]!.provider, "google");
  assert.equal(state.auth_identities[0]!.providerUserId, "google-sub-100");
  assert.equal("accessToken" in state.auth_identities[0]!, false);

  const sessionCookie = extractCookieValue(getAllSetCookies(completeRes), "dh_session")!;
  assert.ok(sessionCookie);

  // 16a. GET /auth/me includes Google connection without tokens
  const meRes = await app.request("/auth/me", {
    headers: { Cookie: `dh_session=${sessionCookie}` },
  });
  assert.equal(meRes.status, 200);
  const meBody = await meRes.json();
  assert.equal(meBody.googleIdentity.provider, "google");
  assert.equal(meBody.googleIdentity.email, "aedan.vance@gmail.com");
  assert.equal(meBody.googleIdentity.emailVerified, true);
  assert.equal(JSON.stringify(meBody).includes("unused-token"), false);

  // 16b. Logout invalidates session
  const logoutRes = await app.request("/auth/logout", {
    method: "POST",
    headers: {
      Origin: "http://localhost:3000",
      Cookie: `dh_session=${sessionCookie}`,
    },
  });
  assert.equal(logoutRes.status, 204);
  assert.equal(state.sessions.length, 0);

  // 2. Returning user skips onboarding and signs directly into /dashboard
  const loginFlow = await startOAuthFlow(app, "login");
  nextJwt = createSignedJwt({
    sub: "google-sub-100",
    email: "aedan.vance@gmail.com",
    email_verified: true,
    nonce: loginFlow.nonce,
  });
  const loginCb = await app.request(
    `/auth/google/callback?code=auth-code-2&state=${encodeURIComponent(loginFlow.stateParam)}`,
    { headers: { Cookie: `dh_oauth_state=${loginFlow.stateCookie}` } },
  );
  assert.equal(loginCb.status, 302);
  assert.ok(loginCb.headers.get("location")!.endsWith("/dashboard"));
  assert.equal(state.users.length, 1);
  assert.equal(state.citizens.length, 1);
});

test("3 & 4: Duplicate Google identity prevention & username uniqueness", async () => {
  let nextJwt = "";
  const { app, state } = createGoogleTestEnv(() => ({
    json: { id_token: nextJwt },
  }));

  state.users.push(
    {
      id: "user-1",
      username: "taken_name",
      email: "user1@example.com",
      passwordHash: null,
      role: "CITIZEN",
      status: "ACTIVE",
    },
    {
      id: "user-2",
      username: "user_two",
      email: "user2@example.com",
      passwordHash: null,
      role: "CITIZEN",
      status: "ACTIVE",
    },
  );
  state.auth_identities.push({
    id: "ident-1",
    userId: "user-1",
    provider: "google",
    providerUserId: "google-sub-1",
    email: "user1@example.com",
    emailVerified: true,
    createdAt: new Date(),
  });
  state.sessions.push({
    id: "sess-2",
    userId: "user-2",
    tokenHash: "2b3869964fd46e18061c3bb18a21e104028d18fb0813537805a3081ccff94f15", // hash of "tok2" below? let's login properly or hashToken
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
  });

  // Username availability check shows taken
  const takenCheck = await app.request("/auth/username-available?username=TAKEN_NAME");
  assert.equal((await takenCheck.json()).available, false);

  // New Google user tries claiming taken_name
  const flow = await startOAuthFlow(app, "register");
  nextJwt = createSignedJwt({
    sub: "google-sub-3",
    email: "user3@example.com",
    email_verified: true,
    nonce: flow.nonce,
  });
  const cbRes = await app.request(
    `/auth/google/callback?code=c3&state=${encodeURIComponent(flow.stateParam)}`,
    { headers: { Cookie: `dh_oauth_state=${flow.stateCookie}` } },
  );
  const onboardingCookie = extractCookieValue(getAllSetCookies(cbRes), "dh_onboarding")!;

  const submitTaken = await app.request("/auth/google/onboarding", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
      Cookie: `dh_onboarding=${onboardingCookie}`,
    },
    body: JSON.stringify({ username: "taken_name" }),
  });
  assert.equal(submitTaken.status, 409);
  assert.equal((await submitTaken.json()).error.code, "USERNAME_TAKEN");

  // Verify user-2 cannot link google-sub-1 (already linked to user-1)
  // First create a real session for user-2 via login
  state.users[1]!.passwordHash = await hash("password12345");
  const loginRes = await app.request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
    body: JSON.stringify({ email: "user2@example.com", password: "password12345" }),
  });
  const user2Cookie = extractCookieValue(getAllSetCookies(loginRes), "dh_session")!;

  const linkFlow = await startOAuthFlow(app, "link", { Cookie: `dh_session=${user2Cookie}` });
  nextJwt = createSignedJwt({
    sub: "google-sub-1",
    email: "user1@example.com",
    email_verified: true,
    nonce: linkFlow.nonce,
  });
  const linkCb = await app.request(
    `/auth/google/callback?code=clink&state=${encodeURIComponent(linkFlow.stateParam)}`,
    {
      headers: {
        Accept: "application/json",
        Cookie: `dh_oauth_state=${linkFlow.stateCookie}; dh_session=${user2Cookie}`,
      },
    },
  );
  assert.equal(linkCb.status, 409);
  assert.equal((await linkCb.json()).error.code, "IDENTITY_ALREADY_LINKED");
});

test("5, 6, 7, 8, 9, 10: OAuth state, nonce, ID token signature, audience, expiry, and cancellation checks", async () => {
  let nextJwt = "";
  const { app } = createGoogleTestEnv(() => ({
    json: { id_token: nextJwt },
  }));

  // 5. Invalid state rejection
  const flow5 = await startOAuthFlow(app, "login");
  const badStateRes = await app.request(
    `/auth/google/callback?code=c&state=tampered-state`,
    {
      headers: {
        Accept: "application/json",
        Cookie: `dh_oauth_state=${flow5.stateCookie}`,
      },
    },
  );
  assert.equal(badStateRes.status, 400);
  assert.equal((await badStateRes.json()).error.code, "INVALID_OAUTH_STATE");

  // 6. Invalid nonce rejection
  const flow6 = await startOAuthFlow(app, "login");
  nextJwt = createSignedJwt({
    sub: "sub-6",
    email: "six@example.com",
    email_verified: true,
    nonce: "wrong-nonce",
  });
  const badNonceRes = await app.request(
    `/auth/google/callback?code=c&state=${encodeURIComponent(flow6.stateParam)}`,
    {
      headers: {
        Accept: "application/json",
        Cookie: `dh_oauth_state=${flow6.stateCookie}`,
      },
    },
  );
  assert.equal(badNonceRes.status, 401);
  assert.equal((await badNonceRes.json()).error.code, "INVALID_OAUTH_NONCE");

  // 7. Invalid ID token signature rejection (signed by unknown private key)
  const rogueKey = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const roguePem = rogueKey.privateKey
    .export({ format: "pem", type: "pkcs8" })
    .toString();
  const flow7 = await startOAuthFlow(app, "login");
  nextJwt = createSignedJwt(
    {
      sub: "sub-7",
      email: "seven@example.com",
      email_verified: true,
      nonce: flow7.nonce,
    },
    { pem: roguePem },
  );
  const badSigRes = await app.request(
    `/auth/google/callback?code=c&state=${encodeURIComponent(flow7.stateParam)}`,
    {
      headers: {
        Accept: "application/json",
        Cookie: `dh_oauth_state=${flow7.stateCookie}`,
      },
    },
  );
  assert.equal(badSigRes.status, 401);
  assert.equal((await badSigRes.json()).error.code, "INVALID_ID_TOKEN");

  // 8. Wrong audience rejection
  const flow8 = await startOAuthFlow(app, "login");
  nextJwt = createSignedJwt({
    sub: "sub-8",
    email: "eight@example.com",
    email_verified: true,
    aud: "different-client-id",
    nonce: flow8.nonce,
  });
  const badAudRes = await app.request(
    `/auth/google/callback?code=c&state=${encodeURIComponent(flow8.stateParam)}`,
    {
      headers: {
        Accept: "application/json",
        Cookie: `dh_oauth_state=${flow8.stateCookie}`,
      },
    },
  );
  assert.equal(badAudRes.status, 401);
  assert.equal((await badAudRes.json()).error.code, "INVALID_ID_TOKEN");

  // 9. Expired token rejection
  const flow9 = await startOAuthFlow(app, "login");
  const past = Math.floor(Date.now() / 1000) - 120;
  nextJwt = createSignedJwt({
    sub: "sub-9",
    email: "nine@example.com",
    email_verified: true,
    iat: past - 600,
    exp: past,
    nonce: flow9.nonce,
  });
  const expiredRes = await app.request(
    `/auth/google/callback?code=c&state=${encodeURIComponent(flow9.stateParam)}`,
    {
      headers: {
        Accept: "application/json",
        Cookie: `dh_oauth_state=${flow9.stateCookie}`,
      },
    },
  );
  assert.equal(expiredRes.status, 401);
  assert.equal((await expiredRes.json()).error.code, "INVALID_ID_TOKEN");

  // 10. Cancelled Google authentication (browser redirect + JSON error)
  const flow10 = await startOAuthFlow(app, "login");
  const cancelRedirect = await app.request(
    `/auth/google/callback?error=access_denied&state=${encodeURIComponent(flow10.stateParam)}`,
    { headers: { Cookie: `dh_oauth_state=${flow10.stateCookie}` } },
  );
  assert.equal(cancelRedirect.status, 302);
  assert.ok(
    cancelRedirect.headers.get("location")!.endsWith("/login?error=OAUTH_CANCELLED"),
  );
});

test("11: Suspended user or suspended citizen is rejected on login", async () => {
  let nextJwt = "";
  const { app, state } = createGoogleTestEnv(() => ({
    json: { id_token: nextJwt },
  }));

  state.users.push({
    id: "user-susp",
    username: "bad_citizen",
    email: "bad@example.com",
    passwordHash: null,
    role: "CITIZEN",
    status: "SUSPENDED",
  });
  state.auth_identities.push({
    id: "ident-susp",
    userId: "user-susp",
    provider: "google",
    providerUserId: "sub-susp",
    email: "bad@example.com",
    emailVerified: true,
    createdAt: new Date(),
  });

  const flow = await startOAuthFlow(app, "login");
  nextJwt = createSignedJwt({
    sub: "sub-susp",
    email: "bad@example.com",
    email_verified: true,
    nonce: flow.nonce,
  });
  const res = await app.request(
    `/auth/google/callback?code=c&state=${encodeURIComponent(flow.stateParam)}`,
    {
      headers: {
        Accept: "application/json",
        Cookie: `dh_oauth_state=${flow.stateCookie}`,
      },
    },
  );
  assert.equal(res.status, 403);
  assert.equal((await res.json()).error.code, "ACCOUNT_SUSPENDED");
});

test("12 & 13: Onboarding expiration, single-use, and concurrent registration protection", async () => {
  let nextJwt = "";
  const { app, state } = createGoogleTestEnv(() => ({
    json: { id_token: nextJwt },
  }));

  // 12a. Onboarding completion is single-use
  const flow1 = await startOAuthFlow(app, "register");
  nextJwt = createSignedJwt({
    sub: "sub-race-1",
    email: "race1@example.com",
    email_verified: true,
    nonce: flow1.nonce,
  });
  const cb1 = await app.request(
    `/auth/google/callback?code=c1&state=${encodeURIComponent(flow1.stateParam)}`,
    { headers: { Cookie: `dh_oauth_state=${flow1.stateCookie}` } },
  );
  const cookie1 = extractCookieValue(getAllSetCookies(cb1), "dh_onboarding")!;

  // 13a. Two concurrent submissions with the SAME onboarding token
  const [resA, resB] = await Promise.all([
    app.request("/auth/google/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        Cookie: `dh_onboarding=${cookie1}`,
      },
      body: JSON.stringify({ username: "racer_one" }),
    }),
    app.request("/auth/google/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        Cookie: `dh_onboarding=${cookie1}`,
      },
      body: JSON.stringify({ username: "racer_two" }),
    }),
  ]);
  const statuses = [resA.status, resB.status].sort();
  assert.deepEqual(statuses, [201, 401]);
  assert.equal(state.users.length, 1);
  assert.equal(state.citizens.length, 1);

  // 12b. Expired onboarding session is rejected
  const flowExp = await startOAuthFlow(app, "register");
  nextJwt = createSignedJwt({
    sub: "sub-exp",
    email: "exp@example.com",
    email_verified: true,
    nonce: flowExp.nonce,
  });
  const cbExp = await app.request(
    `/auth/google/callback?code=cexp&state=${encodeURIComponent(flowExp.stateParam)}`,
    { headers: { Cookie: `dh_oauth_state=${flowExp.stateCookie}` } },
  );
  const cookieExp = extractCookieValue(getAllSetCookies(cbExp), "dh_onboarding")!;
  // Backdate expiry on stored onboarding row
  const lastRow = state.oauth_onboarding_sessions[state.oauth_onboarding_sessions.length - 1]!;
  lastRow.expiresAt = new Date(Date.now() - 1000);

  const expGet = await app.request("/auth/google/onboarding", {
    headers: { Cookie: `dh_onboarding=${cookieExp}` },
  });
  assert.equal(expGet.status, 401);
  assert.equal((await expGet.json()).error.code, "ONBOARDING_EXPIRED");
});

test("14 & 15: Existing account & Super Admin preservation (no email auto-link, safe authenticated linking)", async () => {
  let nextJwt = "";
  const { app, state } = createGoogleTestEnv(() => ({
    json: { id_token: nextJwt },
  }));

  const adminPasswordHash = await hash("CreatorSecret123!");
  state.users.push({
    id: "super-admin-id",
    username: "creator",
    email: "creator@dragonhold.realm",
    passwordHash: adminPasswordHash,
    role: "SUPER_ADMIN",
    status: "ACTIVE",
  });
  state.citizens.push({
    id: "citizen-super-1",
    userId: "super-admin-id",
    citizenCode: "DH-000001",
    characterName: "The Creator",
    avatarUrl: null,
    status: "ACTIVE",
  });

  // Google user with SAME email as SUPER_ADMIN signs in: must NOT auto-link or grant SUPER_ADMIN!
  const flow = await startOAuthFlow(app, "login");
  nextJwt = createSignedJwt({
    sub: "sub-matching-email",
    email: "creator@dragonhold.realm",
    email_verified: true,
    nonce: flow.nonce,
  });
  const cbRes = await app.request(
    `/auth/google/callback?code=c&state=${encodeURIComponent(flow.stateParam)}`,
    { headers: { Cookie: `dh_oauth_state=${flow.stateCookie}` } },
  );
  // Must go to onboarding, NOT dashboard as SUPER_ADMIN
  assert.equal(cbRes.status, 302);
  assert.ok(cbRes.headers.get("location")!.endsWith("/onboarding"));
  const onboardingCookie = extractCookieValue(getAllSetCookies(cbRes), "dh_onboarding")!;
  assert.equal(state.auth_identities.length, 0);

  const infoRes = await app.request("/auth/google/onboarding", {
    headers: { Cookie: `dh_onboarding=${onboardingCookie}` },
  });
  assert.equal((await infoRes.json()).hasUnlinkedEmailAccount, true);

  // Attempting to register a new user with that email fails safely instead of hijacking/overwriting
  const dupEmailRes = await app.request("/auth/google/onboarding", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
      Cookie: `dh_onboarding=${onboardingCookie}`,
    },
    body: JSON.stringify({ username: "fake_creator" }),
  });
  assert.equal(dupEmailRes.status, 409);
  assert.equal((await dupEmailRes.json()).error.code, "EMAIL_TAKEN_BY_EXISTING_ACCOUNT");

  // Super Admin can still log in via password, preserving role, DH-000001, and passwordHash
  const adminLogin = await app.request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
    body: JSON.stringify({
      email: "creator@dragonhold.realm",
      password: "CreatorSecret123!",
    }),
  });
  assert.equal(adminLogin.status, 200);
  const adminLoginBody = await adminLogin.json();
  assert.equal(adminLoginBody.user.role, "SUPER_ADMIN");
  assert.equal(adminLoginBody.citizen.citizenCode, "DH-000001");
  const adminSession = extractCookieValue(getAllSetCookies(adminLogin), "dh_session")!;

  // Authenticated Super Admin securely links Google account via /auth/google/start?intent=link
  const linkFlow = await startOAuthFlow(app, "link", {
    Cookie: `dh_session=${adminSession}`,
  });
  nextJwt = createSignedJwt({
    sub: "sub-creator-google",
    email: "creator.personal@gmail.com",
    email_verified: true,
    nonce: linkFlow.nonce,
  });
  const linkCb = await app.request(
    `/auth/google/callback?code=c&state=${encodeURIComponent(linkFlow.stateParam)}`,
    {
      headers: {
        Cookie: `dh_oauth_state=${linkFlow.stateCookie}; dh_session=${adminSession}`,
      },
    },
  );
  assert.equal(linkCb.status, 302);
  assert.ok(linkCb.headers.get("location")!.endsWith("/dashboard?linked=1"));
  assert.equal(state.users[0]!.passwordHash, adminPasswordHash);
  assert.equal(state.users[0]!.role, "SUPER_ADMIN");
  assert.equal(state.auth_identities.length, 1);
  assert.equal(state.auth_identities[0]!.userId, "super-admin-id");
});

test("17: Origin Guard and CORS compatibility on Google onboarding POST", async () => {
  const { app } = createGoogleTestEnv(() => ({ json: {} }));

  const blocked = await app.request("/auth/google/onboarding", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://evil.example.com",
    },
    body: JSON.stringify({ username: "tester" }),
  });
  assert.equal(blocked.status, 403);
  assert.equal((await blocked.json()).error.code, "BAD_ORIGIN");

  const allowedPreflight = await app.request("/auth/google/onboarding", {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:3000",
      "Access-Control-Request-Method": "POST",
    },
  });
  assert.equal(
    allowedPreflight.headers.get("access-control-allow-origin"),
    "http://localhost:3000",
  );
  assert.equal(
    allowedPreflight.headers.get("access-control-allow-credentials"),
    "true",
  );
});

test("18: Onboarding accepts safe uploaded raster data-URI avatar and rejects SVG/script payloads", async () => {
  let nextJwt = "";
  const { app } = createGoogleTestEnv(() => ({
    json: { id_token: nextJwt },
  }));

  const { stateParam, nonce, stateCookie } = await startOAuthFlow(app, "register");
  nextJwt = createSignedJwt({
    sub: "google-sub-avatar-upload",
    email: "lyra@example.com",
    email_verified: true,
    nonce,
  });

  const cbRes = await app.request(
    `/auth/google/callback?code=avatar-code&state=${encodeURIComponent(stateParam)}`,
    { headers: { Cookie: `dh_oauth_state=${stateCookie}` } },
  );
  assert.equal(cbRes.status, 302);
  const onboardingCookie = extractCookieValue(getAllSetCookies(cbRes), "dh_onboarding")!;
  assert.ok(onboardingCookie);

  // Reject SVG data URI (XSS vector)
  const svgRes = await app.request("/auth/google/onboarding", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
      Cookie: `dh_onboarding=${onboardingCookie}`,
    },
    body: JSON.stringify({
      username: "lyra_crest",
      avatarUrl: "data:image/svg+xml;base64,PHN2Zz4=",
    }),
  });
  assert.equal(svgRes.status, 400);
  const svgBody = await svgRes.json();
  assert.equal(svgBody.error.code, "VALIDATION_ERROR");

  // Accept valid WebP data URI
  const validDataUri = "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=";
  const okRes = await app.request("/auth/google/onboarding", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
      Cookie: `dh_onboarding=${onboardingCookie}`,
    },
    body: JSON.stringify({
      username: "lyra_crest",
      avatarUrl: validDataUri,
    }),
  });
  assert.equal(okRes.status, 201);
  const createdBody = await okRes.json();
  assert.equal(createdBody.citizen.avatarUrl, validDataUri);
});
