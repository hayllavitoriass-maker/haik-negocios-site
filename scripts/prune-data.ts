/**
 * Retenção de dados (LGPD): apaga leads "encerrado" e mensagens "arquivado" mais antigos
 * que DATA_RETENTION_DAYS (padrão 730; 0 desativa). Também limpa sessões, tokens de reset
 * e janelas de rate limit expirados.
 * Uso: npx tsx scripts/prune-data.ts [--dry-run] [--days 365]
 */
import { and, count, eq, lt, sql } from "drizzle-orm";
import { arg, flag, openDb, schema } from "./_db";

async function main() {
  const dryRun = flag("dry-run");
  const days = Number(arg("days") ?? process.env.DATA_RETENTION_DAYS ?? 730);
  if (!Number.isFinite(days) || days < 0) {
    console.error("DATA_RETENTION_DAYS inválido.");
    process.exit(1);
  }
  const { db, close } = await openDb();
  try {
    const now = new Date();
    if (days === 0) {
      console.log("Retenção desativada (0 dias): leads e mensagens não são removidos.");
    } else {
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const leadWhere = and(eq(schema.leads.status, "encerrado"), lt(schema.leads.updatedAt, cutoff));
      const msgWhere = and(eq(schema.messages.status, "arquivado"), lt(schema.messages.updatedAt, cutoff));
      const [[{ n: leadsN }], [{ n: msgsN }]] = await Promise.all([
        db.select({ n: count() }).from(schema.leads).where(leadWhere),
        db.select({ n: count() }).from(schema.messages).where(msgWhere),
      ]);
      console.log(`Corte: anteriores a ${cutoff.toISOString()} (${days} dias).`);
      console.log(`Leads encerrados a remover: ${leadsN}`);
      console.log(`Mensagens arquivadas a remover: ${msgsN}`);
      if (!dryRun) {
        await db.delete(schema.leads).where(leadWhere);
        await db.delete(schema.messages).where(msgWhere);
        await db.insert(schema.auditLogs).values({ actorEmail: "cli", action: "data.prune", entity: "retention", meta: { days, leads: Number(leadsN), messages: Number(msgsN) } });
      }
    }

    const [[{ n: sessN }], [{ n: resetN }], [{ n: rlN }]] = await Promise.all([
      db.select({ n: count() }).from(schema.sessions).where(lt(schema.sessions.expiresAt, now)),
      db.select({ n: count() }).from(schema.passwordResets).where(lt(schema.passwordResets.expiresAt, now)),
      db.select({ n: count() }).from(schema.rateLimits).where(sql`${schema.rateLimits.resetAt} < now() - interval '1 day'`),
    ]);
    console.log(`Sessões expiradas: ${sessN} · tokens de reset expirados: ${resetN} · janelas de rate limit antigas: ${rlN}`);
    if (!dryRun) {
      await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, now));
      await db.delete(schema.passwordResets).where(lt(schema.passwordResets.expiresAt, now));
      await db.delete(schema.rateLimits).where(sql`${schema.rateLimits.resetAt} < now() - interval '1 day'`);
    }
    console.log(dryRun ? "Simulação (--dry-run): nada foi apagado." : "Limpeza concluída.");
  } finally {
    await close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
