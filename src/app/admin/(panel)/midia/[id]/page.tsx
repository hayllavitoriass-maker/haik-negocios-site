import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/guard";
import { MEDIA_CATEGORIES, MEDIA_SLOTS, type MediaSlotKey } from "@/content/site";
import { getMedia, getMediaUsage, usageCount } from "@/server/repos/admin/media";
import { toPublicMedia } from "@/server/media/url";
import { deleteMedia, updateMediaMeta } from "@/server/actions/admin/media";
import { FocalPointEditor } from "@/components/admin/media/FocalPointEditor";
import { MediaUploader } from "@/components/admin/media/MediaUploader";
import { Alert, Card, DescriptionList, Flash, Input, LinkButton, PageHeader, Select } from "@/components/admin/ui";
import { ConfirmForm, CopyButton, SubmitButton } from "@/components/admin/client";
import { formatBytes, formatDateTime } from "@/components/admin/labels";

export const metadata = { title: "Mídia" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function MediaDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await requireUser();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const sp = await searchParams;
  const m = await getMedia(id);
  if (!m) notFound();
  const pub = toPublicMedia(m);
  const usage = await getMediaUsage(id);
  const used = usageCount(usage);
  const isImage = m.mime.startsWith("image/");

  return (
    <>
      <PageHeader
        eyebrow="Mídia"
        title={m.filename}
        description={`${m.category} · ${m.mime} · ${formatBytes(m.size)}${m.width && m.height ? ` · ${m.width}×${m.height}` : ""} · enviado em ${formatDateTime(m.createdAt)}`}
        actions={
          <>
            <LinkButton href={pub.url} external size="sm">
              Abrir arquivo
            </LinkButton>
            <LinkButton href="/admin/midia" size="sm">
              Voltar
            </LinkButton>
          </>
        }
      />
      <Flash ok={sp.ok} erro={sp.erro} />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-4">
          <Card title="Descrição e ponto focal">
            <form action={updateMediaMeta} className="grid gap-4">
              <input type="hidden" name="id" value={m.id} />
              {isImage ? (
                <FocalPointEditor url={pub.url} alt={m.alt} initialX={m.focalX} initialY={m.focalY} />
              ) : (
                <>
                  <input type="hidden" name="focalX" value="0.5" />
                  <input type="hidden" name="focalY" value="0.5" />
                  <div className="grid place-items-center rounded-xs bg-grey-50 py-10 text-[13px] text-grey-500">Documento PDF. Abra o arquivo para visualizar.</div>
                </>
              )}
              <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
                <Input label="Texto alternativo" name="alt" defaultValue={m.alt} maxLength={300} hint="Descreva a imagem para leitores de tela e SEO." />
                <Select label="Categoria" name="category" defaultValue={m.category} options={MEDIA_CATEGORIES} />
              </div>
              <div>
                <SubmitButton>Salvar</SubmitButton>
              </div>
            </form>
          </Card>
          <Card title="Substituir arquivo" description="Mantém o mesmo registro (e todos os usos) trocando apenas o arquivo.">
            <MediaUploader replaceId={m.id} compact onlyImages={isImage} />
          </Card>
        </div>
        <div className="grid content-start gap-4">
          <Card title="Detalhes">
            <DescriptionList
              items={[
                { label: "URL", value: <span className="font-mono text-[12px]">{pub.url}</span> },
                { label: "Chave", value: <span className="font-mono text-[12px]">{m.storageKey}</span> },
                { label: "Atualizado", value: formatDateTime(m.updatedAt) },
              ]}
            />
            <div className="mt-3">
              <CopyButton text={pub.url} label="Copiar URL" />
            </div>
          </Card>
          <Card title="Onde é usada">
            {used === 0 ? (
              <p className="text-[13px] text-grey-500">Não está em uso.</p>
            ) : (
              <ul className="grid gap-1 text-[13px]">
                {usage.slots.map((s) => (
                  <li key={s}>
                    Slot: <Link href="/admin/midia/slots" className="hover:underline">{MEDIA_SLOTS[s as MediaSlotKey] ?? s}</Link>
                  </li>
                ))}
                {usage.projects.map((p) => (
                  <li key={p.id}>
                    Projeto: <Link href={`/admin/projetos/${p.id}`} className="hover:underline">{p.title}</Link>
                  </li>
                ))}
                {usage.posts.map((p) => (
                  <li key={p.id}>
                    Artigo: <Link href={`/admin/blog/${p.id}`} className="hover:underline">{p.title}</Link>
                  </li>
                ))}
                {usage.testimonials.map((t) => (
                  <li key={t.id}>
                    Depoimento: <Link href={`/admin/depoimentos/${t.id}`} className="hover:underline">{t.name}</Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Excluir">
            {used > 0 && (
              <Alert tone="amber" className="mb-3">
                Esta mídia está em uso em {used} lugar{used === 1 ? "" : "es"}. Ao excluir, esses lugares ficam sem imagem.
              </Alert>
            )}
            <ConfirmForm action={deleteMedia} fields={{ id: m.id }} title="Excluir esta mídia?" description={used > 0 ? `Ela é usada em ${used} lugar(es). O arquivo e o registro serão removidos e as referências ficarão vazias.` : "O arquivo e o registro serão removidos definitivamente."} confirmLabel="Excluir" size="sm">
              Excluir mídia
            </ConfirmForm>
          </Card>
        </div>
      </div>
    </>
  );
}
