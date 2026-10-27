import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/guard";
import { LEAD_STATUSES } from "@/server/db/schema";
import { getLeadDetail } from "@/server/repos/admin/leads";
import { addLeadNote, deleteLead, updateLeadStatus } from "@/server/actions/admin/leads";
import { Badge, Card, DescriptionList, Flash, LinkButton, PageHeader, Textarea, buttonClass, controlClass } from "@/components/admin/ui";
import { ConfirmForm, SubmitButton } from "@/components/admin/client";
import { LEAD_STATUS_LABELS, LEAD_STATUS_TONES, formatDateTime } from "@/components/admin/labels";
import { cn } from "@/lib/cn";

export const metadata = { title: "Lead" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function LeadDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await requireUser({ role: "admin" });
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const sp = await searchParams;
  const detail = await getLeadDetail(id);
  if (!detail) notFound();
  const { lead, notes, events } = detail;

  const eventLabel = (e: (typeof events)[number]) => {
    switch (e.type) {
      case "created":
        return "Lead recebido pelo site";
      case "status_change":
        return `Status: ${e.fromStatus ? LEAD_STATUS_LABELS[e.fromStatus as keyof typeof LEAD_STATUS_LABELS] ?? e.fromStatus : "—"} → ${LEAD_STATUS_LABELS[e.toStatus as keyof typeof LEAD_STATUS_LABELS] ?? e.toStatus}`;
      case "note":
        return "Nota interna adicionada";
      case "export":
        return "Dados exportados";
      default:
        return e.type;
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Lead"
        title={lead.name}
        description={
          <>
            {lead.company} · {lead.segment} · recebido em {formatDateTime(lead.createdAt)}
          </>
        }
        actions={
          <>
            <LinkButton href={`https://wa.me/${lead.whatsapp}?text=${encodeURIComponent(`Olá, ${lead.name.split(" ")[0]}! Aqui é da HAIK Negócios. Recebemos seu pedido de diagnóstico.`)}`} external variant="primary" size="sm">
              Abrir WhatsApp
            </LinkButton>
            <LinkButton href="/admin/leads" size="sm">
              Voltar
            </LinkButton>
          </>
        }
      />
      <Flash ok={sp.ok} erro={sp.erro} />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          <Card title="Dados do pedido" actions={<Badge tone={LEAD_STATUS_TONES[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Badge>}>
            <DescriptionList
              items={[
                { label: "Nome", value: lead.name },
                { label: "Empresa", value: lead.company },
                { label: "Segmento", value: lead.segment },
                { label: "Instagram ou site", value: lead.instagramOrSite || "—" },
                { label: "WhatsApp", value: <a className="text-red-700 hover:underline" href={`https://wa.me/${lead.whatsapp}`} target="_blank" rel="noopener noreferrer">{lead.whatsapp}</a> },
                { label: "E-mail", value: <a className="text-red-700 hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a> },
                { label: "Tempo de empresa", value: lead.companyAge },
                { label: "Tamanho da equipe", value: lead.teamSize },
                { label: "Maior problema", value: lead.mainProblem },
                { label: "Investimento mensal", value: lead.monthlyInvestment },
                { label: "Prazo", value: lead.timeline },
                { label: "Melhor período", value: lead.bestPeriod },
                { label: "Origem", value: lead.source },
                { label: "Consentimento", value: lead.consent ? `Sim, em ${formatDateTime(lead.consentAt)}` : "Não" },
              ]}
            />
            {lead.problemDetails && (
              <div className="mt-4">
                <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-grey-500">Detalhes do problema</p>
                <p className="mt-1 whitespace-pre-wrap text-[14px]">{lead.problemDetails}</p>
              </div>
            )}
          </Card>

          <Card title="Notas internas" description="Visíveis só para a equipe. Não grave dados sensíveis desnecessários.">
            <form action={addLeadNote} className="grid gap-3">
              <input type="hidden" name="id" value={lead.id} />
              <Textarea label="Nova nota" name="body" required maxLength={4000} placeholder="Ex.: Ligamos às 10h, pediu retorno na quinta." />
              <div>
                <SubmitButton size="sm">Adicionar nota</SubmitButton>
              </div>
            </form>
            {notes.length > 0 && (
              <ul className="mt-5 grid gap-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-xs bg-grey-50 px-4 py-3">
                    <p className="whitespace-pre-wrap text-[14px]">{n.body}</p>
                    <p className="mt-1 text-[12px] text-grey-500">
                      {n.authorName ?? "—"} · {formatDateTime(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="grid content-start gap-4">
          <Card title="Status">
            <form action={updateLeadStatus} className="grid gap-3">
              <input type="hidden" name="id" value={lead.id} />
              <select name="status" defaultValue={lead.status} className={cn(controlClass, "h-10")} aria-label="Status do lead">
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {LEAD_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <SubmitButton size="sm" pendingText="Atualizando...">
                Atualizar status
              </SubmitButton>
            </form>
          </Card>

          <Card title="Histórico">
            {events.length === 0 ? (
              <p className="text-[13px] text-grey-500">Sem eventos.</p>
            ) : (
              <ol className="grid gap-2 text-[13px]">
                {events.map((e) => (
                  <li key={e.id} className="border-b border-grey-100 pb-2 last:border-0">
                    <p className="text-ink">{eventLabel(e)}</p>
                    <p className="text-[12px] text-grey-500">
                      {e.actorName ?? "—"} · {formatDateTime(e.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card title="LGPD" description="Portabilidade e exclusão dos dados deste titular.">
            <div className="grid gap-2">
              <form method="get" action={`/admin/leads/${lead.id}/export`}>
                <button type="submit" className={buttonClass("secondary", "sm", "w-full")}>
                  Exportar dados deste lead (JSON)
                </button>
              </form>
              <ConfirmForm
                action={deleteLead}
                fields={{ id: lead.id }}
                title="Excluir este lead?"
                description="Todos os dados pessoais, notas e histórico serão apagados definitivamente. Esta ação fica registrada na auditoria."
                confirmLabel="Excluir dados"
                size="sm"
              >
                Excluir dados
              </ConfirmForm>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
