import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { createDb } from "./client";
import { citizens, kingdoms, users } from "./schema";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} wajib diisi`);
  return value;
}

async function main() {
  const { db, client } = createDb(requireEnv("DATABASE_URL"));

  // 1. Kerajaan: baru berdiri, belum ada penguasa
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
    console.log("Kingdom Dragonhold dibuat.");
  }

  // 2. SUPER_ADMIN pertama (pemilik platform)
  const username = requireEnv("SEED_ADMIN_USERNAME");
  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  if (!existingAdmin) {
    const passwordHash = await hash(requireEnv("SEED_ADMIN_PASSWORD"));
    const [admin] = await db
      .insert(users)
      .values({
        username,
        email: requireEnv("SEED_ADMIN_EMAIL"),
        passwordHash,
        role: "SUPER_ADMIN",
      })
      .returning({ id: users.id });

    await db.insert(citizens).values({
      userId: admin!.id,
      citizenCode: "DH-000001",
      characterName: "The Creator",
    });
    console.log("SUPER_ADMIN dibuat.");
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});