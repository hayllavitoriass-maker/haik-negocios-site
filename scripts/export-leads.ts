/**
 * Exporta todos os leads em CSV (UTF-8 com BOM, separador ;) para a saída padrão.
 * Uso: npx tsx scripts/export-leads.ts > leads.csv
 */
import { desc } from "drizzle-orm";
import { openDb, schema } from "./_db";

const STATUS: Record<string, string> = {
  novo: "Novo",
  contatado: "Contatado",
  agendado: "Diagnóstico agendado",
  realizado: "Diagnóstico realizado",
  proposta: "Proposta enviada",
  convertido: "Convertido",
  encerrado: "Encerrado",
};

function cell(v: unknown): string {
  let s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

async function main() {
  const { db, close } = await openDb();
  try {
    const rows = await db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt));
    const headers = ["id", "recebido_em", "status", "nome", "empresa", "segmento", "instagram_ou_site", "whatsapp", "email", "tempo_empresa", "equipe", "maior_problema", "detalhes", "investimento_mensal", "prazo", "melhor_periodo", "origem", "consentimento_em"];
    const lines = [headers.map(cell).join(";")];
    for (const l of rows) {
      lines.push(
        [l.id, l.createdAt, STATUS[l.status] ?? l.status, l.name, l.company, l.segment, l.instagramOrSite, l.whatsapp, l.email, l.companyAge, l.teamSize, l.mainProblem, l.problemDetails, l.monthlyInvestment, l.timeline, l.bestPeriod, l.source, l.consentAt]
          .map(cell)
          .join(";"),
      );
    }
    process.stdout.write("﻿" + lines.join("\r\n") + "\r\n");
    await db.insert(schema.auditLogs).values({ actorEmail: "cli", action: "lead.export", entity: "lead", meta: { count: rows.length, via: "scripts/export-leads.ts" } });
    console.error(`${rows.length} lead(s) exportado(s).`);
  } finally {
    await close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
