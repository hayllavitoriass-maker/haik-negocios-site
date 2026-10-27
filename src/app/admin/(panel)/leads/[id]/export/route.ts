import { NextResponse } from "next/server";
import { AuthError, requireUserForAction } from "@/server/auth/guard";
import { audit } from "@/server/auth/audit";
import { getDb } from "@/server/db/client";
import { leadEvents } from "@/server/db/schema";
import { getLeadDetail } from "@/server/repos/admin/leads";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Portabilidade (LGPD): todos os dados de um titular em JSON. Só administradores. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUserForAction({ role: "admin" });
  } catch (err) {
    if (err instanceof AuthError) return new NextResponse("Não autorizado", { status: err.code === "forbidden" ? 403 : 401 });
    throw err;
  }
  const { id } = await ctx.params;
  if (!UUID.test(id)) return new NextResponse("Não encontrado", { status: 404 });
  const detail = await getLeadDetail(id);
  if (!detail) return new NextResponse("Não encontrado", { status: 404 });

  const { ipHash: _ip, userAgent: _ua, ...lead } = detail.lead;
  void _ip;
  void _ua;
  const payload = {
    exportadoEm: new Date().toISOString(),
    titular: lead,
    notasInternas: detail.notes.map((n) => ({ data: n.createdAt, autor: n.authorName, texto: n.body })),
    historico: detail.events.map((e) => ({ data: e.createdAt, tipo: e.type, de: e.fromStatus, para: e.toStatus, autor: e.actorName })),
  };
  const db = await getDb();
  await db.insert(leadEvents).values({ leadId: id, actorId: user.id, actorName: user.name, type: "export" });
  await audit({ actorId: user.id, actorEmail: user.email, action: "lead.export_one", entity: "lead", entityId: id });

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lead-${id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
