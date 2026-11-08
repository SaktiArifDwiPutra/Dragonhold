import { announcements } from "@dragonhold/db";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../types";

export const announcementRoutes = new Hono<AppEnv>();

announcementRoutes.get("/", async (c) => {
  const db = c.get("db");

  // Hanya maklumat dengan status PUBLISHED yang boleh ditampilkan kepada publik
  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      content: announcements.content,
      category: announcements.category,
      publishedAt: announcements.publishedAt,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .where(eq(announcements.status, "PUBLISHED"))
    .orderBy(desc(announcements.publishedAt), desc(announcements.createdAt))
    .limit(10);

  return c.json({ announcements: rows });
});
