import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/guard";
import { getProjectAdmin } from "@/server/repos/admin/publishing";
import { deleteProject, setProjectStatus } from "@/server/actions/admin/projects";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { Badge, Card, Flash, LinkButton, PageHeader } from "@/components/admin/ui";
import { ConfirmForm } from "@/components/admin/client";
import { PUBLISH_STATUS_LABELS, formatDateTime } from "@/components/admin/labels";

export const metadata = { title: "Editar projeto" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProjectEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await requireUser();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const sp = await searchParams;
  const p = await getProjectAdmin(id);
  if (!p) notFound();
  const published = p.status === "published";

  return (
    <>
      <PageHeader
        eyebrow="Projetos"
        title={p.title}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge tone={published ? "green" : "amber"}>{PUBLISH_STATUS_LABELS[p.status]}</Badge>
            <span>
              Atualizado em {formatDateTime(p.updatedAt)}
              {p.publishedAt && ` · publicado em ${formatDateTime(p.publishedAt)}`}
            </span>
          </span>
        }
        actions={
          <>
            {published && (
              <LinkButton href={`/projetos/${p.slug}`} external size="sm">
                Ver no site
              </LinkButton>
            )}
            <ConfirmForm
              action={setProjectStatus}
              fields={{ id: p.id, status: published ? "draft" : "published" }}
              title={published ? "Despublicar projeto?" : "Publicar projeto?"}
              description={published ? "Ele sai do site imediatamente e volta a rascunho." : "Ele passa a aparecer em /projetos imediatamente. Confira se o campo Resultado só tem dados reais e autorizados."}
              confirmLabel={published ? "Despublicar" : "Publicar"}
              variant={published ? "secondary" : "primary"}
              size="sm"
            >
              {published ? "Despublicar" : "Publicar"}
            </ConfirmForm>
            <ConfirmForm action={deleteProject} fields={{ id: p.id }} title="Excluir projeto?" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" size="sm">
              Excluir
            </ConfirmForm>
            <LinkButton href="/admin/projetos" size="sm">
              Voltar
            </LinkButton>
          </>
        }
      />
      <Flash ok={sp.ok} erro={sp.erro} />
      <Card>
        <ProjectForm
          initial={{
            id: p.id,
            title: p.title,
            slug: p.slug,
            client: p.client ?? "",
            segment: p.segment ?? "",
            summary: p.summary,
            scenario: p.scenario,
            bottleneck: p.bottleneck,
            solution: p.solution,
            result: p.result,
            services: p.services,
            cover: p.cover,
            gallery: p.gallery,
            videoUrl: p.videoUrl ?? "",
            links: p.links,
            isDemo: p.isDemo,
            seoTitle: p.seoTitle ?? "",
            seoDescription: p.seoDescription ?? "",
          }}
        />
      </Card>
    </>
  );
}
