import "server-only";
import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { contentEntries, contentVersions, users } from "@/server/db/schema";
import { CONTENT_KEYS, contentRegistry, type ContentKey } from "@/content/registry";

export type ContentStatus = "padrao" | "rascunho" | "publicado";

export async function listContentEntries() {
  const db = await getDb();
  const rows = await db.select().from(contentEntries).where(inArray(contentEntries.key, CONTENT_KEYS));
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return CONTENT_KEYS.map((key) => {
    const row = byKey.get(key);
    const status: ContentStatus = row?.draft ? "rascunho" : row?.published ? "publicado" : "padrao";
    return { key, label: contentRegistry[key].label, path: contentRegistry[key].path, status, updatedAt: row?.updatedAt ?? null, publishedAt: row?.publishedAt ?? null };
  });
}

export async function getContentEntry(key: ContentKey) {
  const db = await getDb();
  const [row] = await db.select().from(contentEntries).where(eq(contentEntries.key, key)).limit(1);
  const versions = await db
    .select({ id: contentVersions.id, createdAt: contentVersions.createdAt, createdByName: users.name })
    .from(contentVersions)
    .leftJoin(users, eq(users.id, contentVersions.createdBy))
    .where(eq(contentVersions.key, key))
    .orderBy(desc(contentVersions.createdAt))
    .limit(20);
  return { row: row ?? null, versions };
}
