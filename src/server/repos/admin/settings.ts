import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { siteSettings } from "@/server/db/schema";

export async function getSettingsRow() {
  const db = await getDb();
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return row ?? null;
}
