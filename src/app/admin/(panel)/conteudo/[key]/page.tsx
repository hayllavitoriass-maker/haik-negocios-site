import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { requireUser } from "@/server/auth/guard";
import { contentRegistry, isContentKey } from "@/content/registry";
import { deriveFields, mergeContent } from "@/content/fields";
import { PREVIEW_COOKIE } from "@/server/content";
import { getContentEntry } from "@/server/repos/admin/content";
import { disablePreview, discardContentDraft, enablePreview, loadContentDefaults, restoreContentVersion } from "@/server/actions/admin/content";
import { ContentForm } from "@/components/admin/ContentForm";
import { Badge, Card, Flash, LinkButton, PageHeader, buttonClass } from "@/components/admin/ui";
import { ConfirmForm } from "@/components/admin/client";
import { formatDateTime } from "@/components/admin/labels";

export const metadata = { title: "Editar conteúdo" };

export default async function ContentEditPage({ params, searchParams }: { params: Promise<{ key: string }>; searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await requireUser();
  const { key } = await params;
  if (!isContentKey(key)) notFound();
  const sp = await searchParams;
  const entry = contentRegistry[key];
  const [{ row, versions }, store] = await Promise.all([getContentEntry(key), cookies()]);
  const previewOn = store.get(PREVIEW_COOKIE)?.value === "1";

  const source = row?.draft ?? row?.published ?? null;
  const initial = source ? mergeContent(entry.defaults, source) : entry.defaults;
  // O caminho raiz é a própria chave: assim `legal.privacy.body` é reconhecido como Markdown.
  const root = deriveFields(entry.defaults, key, key);
  const status = row?.draft ? "Rascunho" : row?.published ? "Publicado" : "Padrão";

  return (
    <>
      <PageHeader
        eyebrow="Conteúdo"
        title={entry.label}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge tone={row?.draft ? "amber" : row?.published ? "green" : "neutral"}>{status}</Badge>
            <span>
              Rota <span className="font-mono text-[12px]">{entry.path}</span>
              {row?.publishedAt && <> · publicado em {formatDateTime(row.publishedAt)}</>}
            </span>
          </span>
        }
        actions={
          <>
            {previewOn ? (
              <form action={disablePreview}>
                <button type="submit" className={buttonClass("secondary", "sm")}>
                  Sair da pré-visualização
                </button>
              </form>
            ) : (
              <form action={enablePreview}>
                <input type="hidden" name="path" value={entry.path} />
                <button type="submit" className={buttonClass("secondary", "sm")}>
                  Pré-visualizar
                </button>
              </form>
            )}
            {previewOn && (
              <LinkButton href={entry.path} external size="sm">
                Abrir página
              </LinkButton>
            )}
            <LinkButton href="/admin/conteudo" size="sm">
              Voltar
            </LinkButton>
          </>
        }
      />
      <Flash ok={sp.ok} erro={sp.erro} />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card>
          <ContentForm key={`${key}-${row?.updatedAt?.getTime() ?? 0}`} contentKey={key} root={root} initial={initial} hasDraft={Boolean(row?.draft)} />
        </Card>
        <div className="grid content-start gap-4">
          <Card title="Rascunho">
            {row?.draft ? (
              <div className="grid gap-2">
                <p className="text-[13px] text-grey-500">Há um rascunho salvo em {formatDateTime(row.updatedAt)}. O site continua mostrando a versão publicada.</p>
                <ConfirmForm action={discardContentDraft} fields={{ key }} title="Descartar rascunho?" description="O formulário volta para a versão publicada (ou padrão)." confirmLabel="Descartar" size="sm">
                  Descartar rascunho
                </ConfirmForm>
              </div>
            ) : (
              <p className="text-[13px] text-grey-500">Nenhum rascunho pendente.</p>
            )}
          </Card>
          <Card title="Textos padrão" description="Os textos oficiais aprovados, gravados no código do site.">
            <ConfirmForm action={loadContentDefaults} fields={{ key }} title="Carregar textos padrão?" description="Eles substituem o rascunho atual (se houver). Nada muda no site até publicar." confirmLabel="Carregar como rascunho" variant="secondary" size="sm">
              Carregar textos padrão
            </ConfirmForm>
          </Card>
          <Card title="Versões publicadas" description="Restaurar carrega a versão como rascunho; publique para aplicar.">
            {versions.length === 0 ? (
              <p className="text-[13px] text-grey-500">Nenhuma versão publicada ainda.</p>
            ) : (
              <ul className="grid gap-2">
                {versions.map((v, i) => (
                  <li key={v.id} className="flex items-center justify-between gap-2 border-b border-grey-100 pb-2 text-[13px] last:border-0">
                    <span>
                      <span className="text-ink">{formatDateTime(v.createdAt)}</span>
                      <span className="block text-[12px] text-grey-500">
                        {v.createdByName ?? "—"}
                        {i === 0 && " · atual"}
                      </span>
                    </span>
                    <ConfirmForm action={restoreContentVersion} fields={{ key, versionId: v.id }} title="Restaurar esta versão?" description="Ela substitui o rascunho atual (se houver). Nada muda no site até publicar." confirmLabel="Restaurar" variant="secondary" size="sm">
                      Restaurar
                    </ConfirmForm>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
