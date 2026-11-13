import { hash } from "@node-rs/argon2";
import { eq, or } from "drizzle-orm";
import { createDb } from "./client";
import { citizens, kingdoms, users } from "./schema";

export type SeedOptions = {
  databaseUrl: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
  logger?: {
    log: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };
};

export type SeedResult = {
  kingdomAction: "created" | "already_exists";
  adminAction: "created" | "already_exists";
  adminUserId: string;
  citizenCode: string;
};

/**
 * Validates the required seed options.
 * Throws a descriptive error if any variable is missing or malformed.
 */
export function validateSeedOptions(raw: {
  databaseUrl?: string;
  adminUsername?: string;
  adminEmail?: string;
  adminPassword?: string;
}): {
  databaseUrl: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
} {
  const missing: string[] = [];

  const databaseUrl = raw.databaseUrl?.trim();
  if (!databaseUrl) missing.push("DATABASE_URL");

  const rawUsername = raw.adminUsername?.trim();
  if (!rawUsername) missing.push("SEED_ADMIN_USERNAME");

  const rawEmail = raw.adminEmail?.trim();
  if (!rawEmail) missing.push("SEED_ADMIN_EMAIL");

  const rawPassword = raw.adminPassword;
  if (!rawPassword || rawPassword.trim().length === 0) missing.push("SEED_ADMIN_PASSWORD");

  if (missing.length > 0) {
    throw new Error(
      `Variabel environment wajib diisi untuk seed: ${missing.join(", ")}`,
    );
  }

  // Username validation: minimum 3, max 32 characters, alphanumeric and underscores
  const adminUsername = rawUsername!;
  if (
    adminUsername.length < 3 ||
    adminUsername.length > 32 ||
    !/^[a-zA-Z0-9_]+$/.test(adminUsername)
  ) {
    throw new Error(
      "SEED_ADMIN_USERNAME tidak valid. Harus 3-32 karakter alfanumerik atau garis bawah (_).",
    );
  }

  // Email validation: basic email regex & lowercase
  const adminEmail = rawEmail!.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) || adminEmail.length > 255) {
    throw new Error("SEED_ADMIN_EMAIL tidak valid. Masukkan format email yang benar.");
  }

  // Password validation: minimum 10 characters matching shared auth rules
  const adminPassword = rawPassword!;
  if (adminPassword.length < 10) {
    throw new Error("SEED_ADMIN_PASSWORD terlalu pendek. Minimal 10 karakter.");
  }

  return {
    databaseUrl: databaseUrl!,
    adminUsername,
    adminEmail,
    adminPassword,
  };
}

/**
 * Seeds the Dragonhold kingdom and initial SUPER_ADMIN account.
 * Guarantees:
 * 1. Atomicity: SUPER_ADMIN user and Citizen record are created in a single database transaction.
 * 2. Idempotency & Safety: Rerunning does not duplicate records, overwrite passwords, or alter existing status.
 * 3. Conflict Detection: Rejects conflicting usernames or emails to prevent account hijacking or corrupted state.
 */
export async function seedDatabase(
  options: SeedOptions,
  dbInstance?: ReturnType<typeof createDb>,
): Promise<SeedResult> {
  const validated = validateSeedOptions(options);
  const logger = options.logger ?? console;

  const instance = dbInstance ?? createDb(validated.databaseUrl);
  const { db, client } = instance;

  try {
    // -------------------------------------------------------------------------
    // Phase 1: Pre-flight Conflict & Consistency Verification (Read-Only)
    // ALL validation and conflict checks MUST complete before ANY database writes,
    // including creating the Dragonhold kingdom record.
    // -------------------------------------------------------------------------

    // 1. Check if any user already claims the target username or email
    const conflictingUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(
        or(
          eq(users.username, validated.adminUsername),
          eq(users.email, validated.adminEmail),
        ),
      );

    const userByUsername = conflictingUsers.find(
      (u) => u.username.toLowerCase() === validated.adminUsername.toLowerCase(),
    );
    const userByEmail = conflictingUsers.find(
      (u) => u.email.toLowerCase() === validated.adminEmail.toLowerCase(),
    );

    // Cross-conflict: username belongs to User A, but email belongs to User B
    if (userByUsername && userByEmail && userByUsername.id !== userByEmail.id) {
      throw new Error(
        `Konflik data akun: Username '${validated.adminUsername}' dimiliki oleh akun (${userByUsername.id}), ` +
          `namun email '${validated.adminEmail}' dimiliki oleh akun berbeda (${userByEmail.id}). ` +
          "Proses seed dihentikan untuk melindungi integritas data.",
      );
    }

    // Email belongs to someone else with a different username
    if (userByEmail && (!userByUsername || userByUsername.id !== userByEmail.id)) {
      throw new Error(
        `Konflik data akun: Email '${validated.adminEmail}' sudah terdaftar pada pengguna '${userByEmail.username}' ` +
          `(Role: ${userByEmail.role}). Harap gunakan email lain untuk SEED_ADMIN_EMAIL.`,
      );
    }

    // Username belongs to someone else with a different email
    if (userByUsername && (!userByEmail || userByEmail.id !== userByUsername.id)) {
      throw new Error(
        `Konflik data akun: Username '${validated.adminUsername}' sudah terdaftar dengan email yang berbeda ` +
          `('${userByUsername.email}'). Seed tidak akan menimpa akun yang sudah ada.`,
      );
    }

    // If target user already exists, verify its integrity and role
    let existingCitizenRecord: { id: string; citizenCode: string } | null = null;
    if (userByUsername) {
      if (userByUsername.role !== "SUPER_ADMIN") {
        throw new Error(
          `Pengguna '${validated.adminUsername}' sudah terdaftar namun memiliki role '${userByUsername.role}' ` +
            "(bukan SUPER_ADMIN). Seed tidak melakukan eskalasi hak akses otomatis demi keamanan.",
        );
      }

      // Check whether citizen record is present
      const existingCitizen = await db.query.citizens.findFirst({
        where: eq(citizens.userId, userByUsername.id),
      });

      if (!existingCitizen) {
        throw new Error(
          `Pengguna '${validated.adminUsername}' (SUPER_ADMIN) ditemukan, tetapi catatan citizen-nya tidak ada ` +
            "(inkonsistensi data dari percobaan sebelumnya). Periksa database sebelum melanjutkan.",
        );
      }

      existingCitizenRecord = {
        id: existingCitizen.id,
        citizenCode: existingCitizen.citizenCode,
      };
    } else {
      // 2. Check citizen code collision for DH-000001 only if user is about to be created
      const citizenCodeClaimed = await db.query.citizens.findFirst({
        where: eq(citizens.citizenCode, "DH-000001"),
      });

      if (citizenCodeClaimed) {
        throw new Error(
          `Citizen Code 'DH-000001' sudah terpakai oleh user ID '${citizenCodeClaimed.userId}'. ` +
            "Proses seed dibatalkan untuk menghindari konflik integritas catatan kependudukan.",
        );
      }
    }

    // -------------------------------------------------------------------------
    // Phase 2: Database Writes (Executed only when zero conflicts are found)
    // -------------------------------------------------------------------------

    // 3. Kingdom Dragonhold (check and insert only if absent; never overwrite)
    let kingdomAction: SeedResult["kingdomAction"] = "already_exists";
    const existingKingdom = await db.query.kingdoms.findFirst({
      where: eq(kingdoms.name, "Dragonhold"),
    });

    if (!existingKingdom) {
      await db.insert(kingdoms).values({
        name: "Dragonhold",
        description:
          "Kerajaan baru di dunia Aetherial, didirikan oleh sang Pencipta setelah perang melawan naga. Penguasa pertamanya belum ditentukan.",
        status: "NEWLY_ESTABLISHED",
      });
      kingdomAction = "created";
      logger.log("Kingdom Dragonhold berhasil dibuat.");
    } else {
      logger.log(
        `Kingdom Dragonhold sudah ada (status: ${existingKingdom.status}). Data kerajaan dipertahankan.`,
      );
    }

    // 4. Admin Account Provisioning (Idempotent or Atomic Insertion)
    if (userByUsername && existingCitizenRecord) {
      logger.log(
        `SUPER_ADMIN '${userByUsername.username}' sudah ada (Citizen Code: ${existingCitizenRecord.citizenCode}). ` +
          "Akun dan password yang ada dipertahankan utuh.",
      );

      return {
        kingdomAction,
        adminAction: "already_exists",
        adminUserId: userByUsername.id,
        citizenCode: existingCitizenRecord.citizenCode,
      };
    }

    // Atomic Insertion: Users & Citizens within a single transaction
    const passwordHash = await hash(validated.adminPassword);

    const created = await db.transaction(async (tx) => {
      const [admin] = await tx
        .insert(users)
        .values({
          username: validated.adminUsername,
          email: validated.adminEmail,
          passwordHash,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
        })
        .returning({ id: users.id, username: users.username });

      const [citizen] = await tx
        .insert(citizens)
        .values({
          userId: admin!.id,
          citizenCode: "DH-000001",
          characterName: "The Creator",
          status: "ACTIVE",
        })
        .returning({ id: citizens.id, citizenCode: citizens.citizenCode });

      return { admin: admin!, citizen: citizen! };
    });

    logger.log(
      `SUPER_ADMIN '${created.admin.username}' berhasil dibuat secara atomik dengan Citizen Code '${created.citizen.citizenCode}'.`,
    );

    return {
      kingdomAction,
      adminAction: "created",
      adminUserId: created.admin.id,
      citizenCode: created.citizen.citizenCode,
    };
  } finally {
    // Only close if seedDatabase created the client itself
    if (!dbInstance) {
      await client.end();
    }
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const options: SeedOptions = {
    databaseUrl: process.env.DATABASE_URL ?? "",
    adminUsername: process.env.SEED_ADMIN_USERNAME ?? "",
    adminEmail: process.env.SEED_ADMIN_EMAIL ?? "",
    adminPassword: process.env.SEED_ADMIN_PASSWORD ?? "",
  };

  seedDatabase(options)
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
