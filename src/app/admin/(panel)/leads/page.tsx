import Link from "next/link";
import { requireUser } from "@/server/auth/guard";
import { LEAD_STATUSES } from "@/server/db/schema";
import { listLeadSegments, listLeads } from "@/server/repos/admin/leads";
import { Badge, Card, EmptyState, Flash, LinkButton, PageHeader, Pagination, Table, Td, Th, buttonClass, controlClass } from "@/components/admin/ui";
import { LEAD_STATUS_LABELS, LEAD_STATUS_TONES, formatDateTime } from "@/components/admin/labels";
import { cn } from "@/lib/cn";

export const metadata = { title: "Leads" };

type SP = { status?: string; segment?: string; period?: string; q?: string; page?: string; ok?: string; erro?: string };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser({ role: "admin" });
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [result, segments] = await Promise.all([listLeads({ status: sp.status, segment: sp.segment, period: sp.period, q: sp.q, page }), listLeadSegments()]);

  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.status) u.set("status", sp.status);
    if (sp.segment) u.set("segment", sp.segment);
    if (sp.period) u.set("period", sp.period);
    if (sp.q) u.set("q", sp.q);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/leads${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Leads"
        description={`${result.total} pedido${result.total === 1 ? "" : "s"} de diagnóstico.`}
        actions={
          <form method="get" action="/admin/leads/export">
            <button type="submit" className={buttonClass("secondary", "sm")}>
              Exportar CSV
            </button>
          </form>
        }
      />
      <Flash ok={sp.ok} erro={sp.erro} />

      <Card className="mb-4">
        <form method="get" action="/admin/leads" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Buscar por nome, empresa, e-mail ou WhatsApp" className={cn(controlClass, "h-10 lg:col-span-2")} aria-label="Buscar" />
          <select name="status" defaultValue={sp.status ?? ""} className={cn(controlClass, "h-10")} aria-label="Status">
            <option value="">Todos os status</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select name="segment" defaultValue={sp.segment ?? ""} className={cn(controlClass, "h-10")} aria-label="Segmento">
            <option value="">Todos os segmentos</option>
            {segments.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select name="period" defaultValue={sp.period ?? ""} className={cn(controlClass, "h-10")} aria-label="Período">
              <option value="">Todo o período</option>
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>
            <button type="submit" className={buttonClass("primary", "md", "shrink-0")}>
              Filtrar
            </button>
          </div>
        </form>
      </Card>

      <Card>
        {result.rows.length === 0 ? (
          <EmptyState title="Nenhum lead encontrado" description="Ajuste os filtros ou aguarde novos pedidos de diagnóstico." action={<LinkButton href="/admin/leads" size="sm">Limpar filtros</LinkButton>} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>Empresa</Th>
                <Th>Segmento</Th>
                <Th>Problema</Th>
                <Th>Status</Th>
                <Th>Recebido</Th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((l) => (
                <tr key={l.id} className="hover:bg-grey-50">
                  <Td>
                    <Link href={`/admin/leads/${l.id}`} className="font-medium hover:underline">
                      {l.name}
                    </Link>
                    <div className="text-[12px] text-grey-500">{l.email}</div>
                  </Td>
                  <Td>{l.company}</Td>
                  <Td>{l.segment}</Td>
                  <Td className="max-w-[260px] truncate">{l.mainProblem}</Td>
                  <Td>
                    <Badge tone={LEAD_STATUS_TONES[l.status]}>{LEAD_STATUS_LABELS[l.status]}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-grey-500">{formatDateTime(l.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={result.page} pages={result.pages} buildHref={qs} />
      </Card>
    </>
  );
}
