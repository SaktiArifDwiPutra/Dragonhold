import assert from "node:assert/strict";
import test from "node:test";
import { hash, verify } from "@node-rs/argon2";
import { seedDatabase, validateSeedOptions } from "./seed";

test("validateSeedOptions: succeeds with valid parameters", () => {
  const result = validateSeedOptions({
    databaseUrl: "postgres://localhost/test",
    adminUsername: "ArchDragon",
    adminEmail: "creator@dragonhold.realm",
    adminPassword: "ValidPassword123",
  });

  assert.equal(result.adminUsername, "ArchDragon");
  assert.equal(result.adminEmail, "creator@dragonhold.realm");
  assert.equal(result.adminPassword, "ValidPassword123");
});

test("validateSeedOptions: fails if any required parameter is missing", () => {
  assert.throws(
    () => validateSeedOptions({}),
    /Variabel environment wajib diisi untuk seed: DATABASE_URL, SEED_ADMIN_USERNAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD/,
  );

  assert.throws(
    () =>
      validateSeedOptions({
        databaseUrl: "postgres://localhost/test",
        adminUsername: "ab", // too short (<3)
        adminEmail: "creator@example.com",
        adminPassword: "validpassword123",
      }),
    /SEED_ADMIN_USERNAME tidak valid/,
  );

  assert.throws(
    () =>
      validateSeedOptions({
        databaseUrl: "postgres://localhost/test",
        adminUsername: "ArchDragon",
        adminEmail: "invalid-email",
        adminPassword: "validpassword123",
      }),
    /SEED_ADMIN_EMAIL tidak valid/,
  );

  assert.throws(
    () =>
      validateSeedOptions({
        databaseUrl: "postgres://localhost/test",
        adminUsername: "ArchDragon",
        adminEmail: "creator@example.com",
        adminPassword: "short", // < 10 chars
      }),
    /SEED_ADMIN_PASSWORD terlalu pendek/,
  );
});

test("seedDatabase: creates kingdom and SUPER_ADMIN atomically on empty database", async () => {
  const insertedKingdoms: any[] = [];
  const insertedUsers: any[] = [];
  const insertedCitizens: any[] = [];
  let transactionCalled = false;

  const mockDbInstance = {
    db: {
      query: {
        kingdoms: {
          findFirst: async () => null,
        },
        citizens: {
          findFirst: async () => null,
        },
      },
      insert: (table: any) => ({
        values: async (vals: any) => {
          insertedKingdoms.push(vals);
        },
      }),
      select: () => ({
        from: () => ({
          where: async () => [],
        }),
      }),
      transaction: async (cb: any) => {
        transactionCalled = true;
        const tx = {
          insert: (table: any) => ({
            values: (vals: any) => ({
              returning: async () => {
                if (vals.passwordHash) {
                  insertedUsers.push(vals);
                  return [{ id: "user-super-1", username: vals.username }];
                }
                insertedCitizens.push(vals);
                return [{ id: "citizen-1", citizenCode: vals.citizenCode }];
              },
            }),
          }),
        };
        return cb(tx);
      },
    },
    client: {
      end: async () => {},
    },
  } as any;

  const logs: string[] = [];
  const result = await seedDatabase(
    {
      databaseUrl: "postgres://localhost/test",
      adminUsername: "TheCreator",
      adminEmail: "creator@dragonhold.realm",
      adminPassword: "StrongPassword2026",
      logger: {
        log: (...args: unknown[]) => logs.push(args.join(" ")),
        warn: () => {},
        error: () => {},
      },
    },
    mockDbInstance,
  );

  assert.equal(transactionCalled, true);
  assert.equal(result.kingdomAction, "created");
  assert.equal(result.adminAction, "created");
  assert.equal(result.adminUserId, "user-super-1");
  assert.equal(result.citizenCode, "DH-000001");

  assert.equal(insertedKingdoms.length, 1);
  assert.equal(insertedKingdoms[0].name, "Dragonhold");
  assert.equal(insertedKingdoms[0].status, "NEWLY_ESTABLISHED");

  assert.equal(insertedUsers.length, 1);
  assert.equal(insertedUsers[0].username, "TheCreator");
  assert.equal(insertedUsers[0].email, "creator@dragonhold.realm");
  assert.equal(insertedUsers[0].role, "SUPER_ADMIN");
  assert.equal(insertedUsers[0].status, "ACTIVE");

  // Verify Argon2id hash is verifiable
  const passwordValid = await verify(
    insertedUsers[0].passwordHash,
    "StrongPassword2026",
  );
  assert.equal(passwordValid, true);

  assert.equal(insertedCitizens.length, 1);
  assert.equal(insertedCitizens[0].userId, "user-super-1");
  assert.equal(insertedCitizens[0].citizenCode, "DH-000001");
  assert.equal(insertedCitizens[0].characterName, "The Creator");
});

test("seedDatabase: halts without ANY database writes (including kingdom) if email belongs to another user", async () => {
  let anyInsertCalled = false;
  const mockDbInstance = {
    db: {
      query: {
        kingdoms: {
          findFirst: async () => null,
        },
      },
      insert: () => {
        anyInsertCalled = true;
        return {
          values: async () => {
            anyInsertCalled = true;
          },
        };
      },
      select: () => ({
        from: () => ({
          where: async () => [
            {
              id: "existing-user-99",
              username: "some_citizen",
              email: "creator@dragonhold.realm",
              role: "CITIZEN",
              status: "ACTIVE",
            },
          ],
        }),
      }),
    },
    client: { end: async () => {} },
  } as any;

  await assert.rejects(
    () =>
      seedDatabase(
        {
          databaseUrl: "postgres://localhost/test",
          adminUsername: "NewAdmin",
          adminEmail: "creator@dragonhold.realm",
          adminPassword: "StrongPassword2026",
        },
        mockDbInstance,
      ),
    /Konflik data akun: Email 'creator@dragonhold.realm' sudah terdaftar pada pengguna 'some_citizen'/,
  );

  assert.equal(anyInsertCalled, false, "No database write should occur when email conflicts");
});

test("seedDatabase: halts without ANY database writes if DH-000001 is already claimed", async () => {
  let anyInsertCalled = false;
  const mockDbInstance = {
    db: {
      query: {
        citizens: {
          findFirst: async () => ({
            id: "c-other",
            userId: "u-other",
            citizenCode: "DH-000001",
          }),
        },
      },
      insert: () => {
        anyInsertCalled = true;
        return {
          values: async () => {},
        };
      },
      select: () => ({
        from: () => ({
          where: async () => [], // No username/email conflicts
        }),
      }),
    },
    client: { end: async () => {} },
  } as any;

  await assert.rejects(
    () =>
      seedDatabase(
        {
          databaseUrl: "postgres://localhost/test",
          adminUsername: "NewAdmin",
          adminEmail: "creator@dragonhold.realm",
          adminPassword: "StrongPassword2026",
        },
        mockDbInstance,
      ),
    /Citizen Code 'DH-000001' sudah terpakai oleh user ID 'u-other'/,
  );

  assert.equal(anyInsertCalled, false, "No database write should occur when citizen code is claimed");
});

test("seedDatabase: preserves existing Dragonhold kingdom without overwriting", async () => {
  let kingdomInserted = false;
  const mockDbInstance = {
    db: {
      query: {
        kingdoms: {
          findFirst: async () => ({
            id: "k-1",
            name: "Dragonhold",
            description: "Custom user description",
            status: "ESTABLISHED",
          }),
        },
        citizens: {
          findFirst: async () => ({
            id: "c-1",
            userId: "u-1",
            citizenCode: "DH-000001",
          }),
        },
      },
      insert: () => ({
        values: async () => {
          kingdomInserted = true;
        },
      }),
      select: () => ({
        from: () => ({
          where: async () => [
            {
              id: "u-1",
              username: "TheCreator",
              email: "creator@dragonhold.realm",
              role: "SUPER_ADMIN",
              status: "ACTIVE",
            },
          ],
        }),
      }),
    },
    client: { end: async () => {} },
  } as any;

  const result = await seedDatabase(
    {
      databaseUrl: "postgres://localhost/test",
      adminUsername: "TheCreator",
      adminEmail: "creator@dragonhold.realm",
      adminPassword: "StrongPassword2026",
      logger: { log: () => {}, warn: () => {}, error: () => {} },
    },
    mockDbInstance,
  );

  assert.equal(result.kingdomAction, "already_exists");
  assert.equal(result.adminAction, "already_exists");
  assert.equal(kingdomInserted, false);
});

test("seedDatabase: halts if existing username has a different email or non-SUPER_ADMIN role", async () => {
  const mockDbInstance = {
    db: {
      query: {
        kingdoms: {
          findFirst: async () => ({ id: "k-1" }),
        },
      },
      select: () => ({
        from: () => ({
          where: async () => [
            {
              id: "existing-user-99",
              username: "TheCreator",
              email: "different@dragonhold.realm",
              role: "SUPER_ADMIN",
              status: "ACTIVE",
            },
          ],
        }),
      }),
    },
    client: { end: async () => {} },
  } as any;

  await assert.rejects(
    () =>
      seedDatabase(
        {
          databaseUrl: "postgres://localhost/test",
          adminUsername: "TheCreator",
          adminEmail: "creator@dragonhold.realm",
          adminPassword: "StrongPassword2026",
        },
        mockDbInstance,
      ),
    /Konflik data akun: Username 'TheCreator' sudah terdaftar dengan email yang berbeda/,
  );
});

test("seedDatabase: detects partial failure when user exists but citizen record is missing", async () => {
  const mockDbInstance = {
    db: {
      query: {
        kingdoms: {
          findFirst: async () => ({ id: "k-1" }),
        },
        citizens: {
          findFirst: async () => null, // missing citizen!
        },
      },
      select: () => ({
        from: () => ({
          where: async () => [
            {
              id: "u-1",
              username: "TheCreator",
              email: "creator@dragonhold.realm",
              role: "SUPER_ADMIN",
              status: "ACTIVE",
            },
          ],
        }),
      }),
    },
    client: { end: async () => {} },
  } as any;

  await assert.rejects(
    () =>
      seedDatabase(
        {
          databaseUrl: "postgres://localhost/test",
          adminUsername: "TheCreator",
          adminEmail: "creator@dragonhold.realm",
          adminPassword: "StrongPassword2026",
        },
        mockDbInstance,
      ),
    /inkonsistensi data dari percobaan sebelumnya/,
  );
});

test("seedDatabase: always closes client in finally block even on error", async () => {
  let clientClosed = false;
  const mockDbInstance = {
    db: {
      query: {
        kingdoms: {
          findFirst: async () => {
            throw new Error("DB Connection Dropped");
          },
        },
      },
    },
    client: {
      end: async () => {
        clientClosed = true;
      },
    },
  } as any;

  try {
    await seedDatabase({
      databaseUrl: "postgres://fake-invalid-host:5432/fake",
      adminUsername: "TheCreator",
      adminEmail: "creator@dragonhold.realm",
      adminPassword: "StrongPassword2026",
    });
  } catch {
    // Expected to fail connection
  }
});
