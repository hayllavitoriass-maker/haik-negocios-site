import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/guard";
import { getTestimonialAdmin } from "@/server/repos/admin/publishing";
import { deleteTestimonial, setTestimonialStatus } from "@/server/actions/admin/testimonials";
import { TestimonialForm } from "@/components/admin/TestimonialForm";
import { Alert, Badge, Card, Flash, LinkButton, PageHeader } from "@/components/admin/ui";
import { ConfirmForm } from "@/components/admin/client";
import { PUBLISH_STATUS_LABELS, formatDateTime } from "@/components/admin/labels";

export const metadata = { title: "Editar depoimento" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TestimonialEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await requireUser();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const sp = await searchParams;
  const t = await getTestimonialAdmin(id);
  if (!t) notFound();
  const published = t.status === "published";

  return (
    <>
      <PageHeader
        eyebrow="Depoimentos"
        title={t.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge tone={published ? "green" : "amber"}>{PUBLISH_STATUS_LABELS[t.status]}</Badge>
            {t.authorized ? <Badge tone="green">Autorizado</Badge> : <Badge tone="red">Sem autorização</Badge>}
            <span>Atualizado em {formatDateTime(t.updatedAt)}</span>
          </span>
        }
        actions={
          <>
            {published ? (
              <ConfirmForm action={setTestimonialStatus} fields={{ id: t.id, status: "draft" }} title="Despublicar depoimento?" description="Ele deixa de aparecer no site." confirmLabel="Despublicar" variant="secondary" size="sm">
                Despublicar
              </ConfirmForm>
            ) : (
              <ConfirmForm action={setTestimonialStatus} fields={{ id: t.id, status: "published" }} title="Publicar depoimento?" description="Confirme que existe autorização por escrito da pessoa." confirmLabel="Publicar" variant="primary" size="sm">
                Publicar
              </ConfirmForm>
            )}
            <ConfirmForm action={deleteTestimonial} fields={{ id: t.id }} title="Excluir depoimento?" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" size="sm">
              Excluir
            </ConfirmForm>
            <LinkButton href="/admin/depoimentos" size="sm">
              Voltar
            </LinkButton>
          </>
        }
      />
      <Flash ok={sp.ok} erro={sp.erro} />
      {!t.authorized && (
        <Alert tone="amber" className="mb-4">
          Sem a autorização marcada e salva, o botão Publicar é recusado pelo servidor.
        </Alert>
      )}
      <Card>
        <TestimonialForm initial={{ id: t.id, name: t.name, company: t.company ?? "", role: t.role ?? "", city: t.city ?? "", photo: t.photo, quote: t.quote, authorized: t.authorized, sortOrder: t.sortOrder }} />
      </Card>
    </>
  );
}
