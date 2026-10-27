import { NextResponse } from "next/server";
import { AuthError, requireUserForAction } from "@/server/auth/guard";
import { audit } from "@/server/auth/audit";
import { listAllLeadsForExport, toCsv } from "@/server/repos/admin/leads";
import { LEAD_STATUS_LABELS } from "@/components/admin/labels";

export const dynamic = "force-dynamic";

/** Exportação CSV de todos os leads. Só administradores; registrada na auditoria. */
export async function GET() {
  let user;
  try {
    user = await requireUserForAction({ role: "admin" });
  } catch (err) {
    if (err instanceof AuthError) return new NextResponse("Não autorizado", { status: err.code === "forbidden" ? 403 : 401 });
    throw err;
  }
  const rows = await listAllLeadsForExport();
  const csv = toCsv(
    ["id", "recebido_em", "status", "nome", "empresa", "segmento", "instagram_ou_site", "whatsapp", "email", "tempo_empresa", "equipe", "maior_problema", "detalhes", "investimento_mensal", "prazo", "melhor_periodo", "origem", "consentimento_em"],
    rows.map((l) => [
      l.id,
      l.createdAt.toISOString(),
      LEAD_STATUS_LABELS[l.status],
      l.name,
      l.company,
      l.segment,
      l.instagramOrSite,
      l.whatsapp,
      l.email,
      l.companyAge,
      l.teamSize,
      l.mainProblem,
      l.problemDetails,
      l.monthlyInvestment,
      l.timeline,
      l.bestPeriod,
      l.source,
      l.consentAt.toISOString(),
    ]),
  );
  await audit({ actorId: user.id, actorEmail: user.email, action: "lead.export", entity: "lead", meta: { count: rows.length } });
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-haik-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
