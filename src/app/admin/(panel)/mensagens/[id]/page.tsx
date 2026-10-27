import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/guard";
import { MESSAGE_STATUSES } from "@/server/db/schema";
import { getMessage } from "@/server/repos/admin/leads";
import { deleteMessage, updateMessageStatus } from "@/server/actions/admin/leads";
import { Badge, Card, DescriptionList, Flash, LinkButton, PageHeader, controlClass } from "@/components/admin/ui";
import { ConfirmForm, SubmitButton } from "@/components/admin/client";
import { MESSAGE_STATUS_LABELS, MESSAGE_STATUS_TONES, formatDateTime } from "@/components/admin/labels";
import { cn } from "@/lib/cn";

export const metadata = { title: "Mensagem" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function MessageDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await requireUser({ role: "admin" });
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const sp = await searchParams;
  const m = await getMessage(id);
  if (!m) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Mensagem"
        title={m.subject}
        description={
          <>
            de {m.name} · recebida em {formatDateTime(m.createdAt)}
          </>
        }
        actions={
          <>
            <LinkButton href={`https://wa.me/${m.whatsapp}`} external variant="primary" size="sm">
              Responder no WhatsApp
            </LinkButton>
            {m.email && (
              <LinkButton href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} size="sm">
                Responder por e-mail
              </LinkButton>
            )}
            <LinkButton href="/admin/mensagens" size="sm">
              Voltar
            </LinkButton>
          </>
        }
      />
      <Flash ok={sp.ok} erro={sp.erro} />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card title="Conteúdo" actions={<Badge tone={MESSAGE_STATUS_TONES[m.status]}>{MESSAGE_STATUS_LABELS[m.status]}</Badge>}>
          <DescriptionList
            items={[
              { label: "Nome", value: m.name },
              { label: "WhatsApp", value: m.whatsapp },
              { label: "E-mail", value: m.email || "—" },
              { label: "Empresa ou profissão", value: m.company || "—" },
              { label: "Assunto", value: m.subject },
              { label: "Consentimento", value: m.consent ? "Sim" : "Não" },
            ]}
          />
          <p className="mt-4 text-[12px] font-medium uppercase tracking-[0.06em] text-grey-500">Mensagem</p>
          <p className="mt-1 whitespace-pre-wrap text-[14px]">{m.message}</p>
        </Card>
        <div className="grid content-start gap-4">
          <Card title="Status">
            <form action={updateMessageStatus} className="grid gap-3">
              <input type="hidden" name="id" value={m.id} />
              <select name="status" defaultValue={m.status} className={cn(controlClass, "h-10")} aria-label="Status">
                {MESSAGE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {MESSAGE_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <SubmitButton size="sm" pendingText="Atualizando...">
                Atualizar status
              </SubmitButton>
            </form>
          </Card>
          <Card title="Excluir">
            <ConfirmForm action={deleteMessage} fields={{ id: m.id }} title="Excluir esta mensagem?" description="A mensagem e os dados pessoais serão apagados definitivamente." confirmLabel="Excluir" size="sm">
              Excluir mensagem
            </ConfirmForm>
          </Card>
        </div>
      </div>
    </>
  );
}
