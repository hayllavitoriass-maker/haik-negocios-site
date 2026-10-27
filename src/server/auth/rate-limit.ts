import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { rateLimits } from "@/server/db/schema";

export type RateLimitResult = { ok: true; remaining: number } | { ok: false; retryAfterSeconds: number };

/**
 * Limitador de janela fixa persistido no banco (funciona em serverless e em múltiplas
 * instâncias). `key` deve combinar a ação e o sujeito, ex.: `login:ip:<hash>`.
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const db = await getDb();
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  // Um único UPSERT: cria a janela, reinicia se expirou ou incrementa.
  const rows = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${rateLimits.resetAt} < now() THEN 1 ELSE ${rateLimits.count} + 1 END`,
        resetAt: sql`CASE WHEN ${rateLimits.resetAt} < now() THEN ${resetAt.toISOString()}::timestamptz ELSE ${rateLimits.resetAt} END`,
      },
    })
    .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt });

  const row = rows[0];
  if (row.count > limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000));
    return { ok: false, retryAfterSeconds };
  }
  return { ok: true, remaining: limit - row.count };
}

/** Remove janelas expiradas (chamado ocasionalmente por scripts de manutenção). */
export async function pruneRateLimits() {
  const db = await getDb();
  await db.delete(rateLimits).where(sql`${rateLimits.resetAt} < now() - interval '1 day'`);
}
