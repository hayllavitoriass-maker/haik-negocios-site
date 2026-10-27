import "server-only";
import { getDb } from "@/server/db/client";
import { auditLogs } from "@/server/db/schema";

export type AuditInput = {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
};

/**
 * Registro de ações relevantes (login, publicação, exclusão, exportação...).
 * Nunca grave dados pessoais de leads em `meta`; use apenas identificadores.
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(auditLogs).values({
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      meta: input.meta ?? null,
    });
  } catch (err) {
    console.error("[audit] falha ao registrar", err);
  }
}
