import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/guard";
import { contentsContent } from "@/content/pages/misc";
import { getPostAdmin } from "@/server/repos/admin/publishing";
import { deletePost, setPostStatus } from "@/server/actions/admin/posts";
import { PostForm } from "@/components/admin/PostForm";
import { Badge, Card, Flash, LinkButton, PageHeader } from "@/components/admin/ui";
import { ConfirmForm } from "@/components/admin/client";
import { PUBLISH_STATUS_LABELS, formatDateTime } from "@/components/admin/labels";

export const metadata = { title: "Editar artigo" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PostEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await requireUser();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const sp = await searchParams;
  const p = await getPostAdmin(id);
  if (!p) notFound();
  const published = p.status === "published";

  return (
    <>
      <PageHeader
        eyebrow="Blog"
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
              <LinkButton href={`/conteudos/${p.slug}`} external size="sm">
                Ver no site
              </LinkButton>
            )}
            <ConfirmForm
              action={setPostStatus}
              fields={{ id: p.id, status: published ? "draft" : "published" }}
              title={published ? "Despublicar artigo?" : "Publicar artigo?"}
              description={published ? "Ele sai do site imediatamente." : "Ele passa a aparecer em /conteudos imediatamente."}
              confirmLabel={published ? "Despublicar" : "Publicar"}
              variant={published ? "secondary" : "primary"}
              size="sm"
            >
              {published ? "Despublicar" : "Publicar"}
            </ConfirmForm>
            <ConfirmForm action={deletePost} fields={{ id: p.id }} title="Excluir artigo?" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" size="sm">
              Excluir
            </ConfirmForm>
            <LinkButton href="/admin/blog" size="sm">
              Voltar
            </LinkButton>
          </>
        }
      />
      <Flash ok={sp.ok} erro={sp.erro} />
      <Card>
        <PostForm categories={contentsContent.categories} initial={{ id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt, category: p.category, cover: p.cover, body: p.body, seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "" }} />
      </Card>
    </>
  );
}
