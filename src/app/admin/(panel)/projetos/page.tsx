import Link from "next/link";
import { requireUser } from "@/server/auth/guard";
import { listProjectsAdmin } from "@/server/repos/admin/publishing";
import { moveProject } from "@/server/actions/admin/projects";
import { MediaThumb } from "@/components/admin/media/MediaPicker";
import { Badge, Card, EmptyState, Flash, LinkButton, PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { PUBLISH_STATUS_LABELS, formatDateTime } from "@/components/admin/labels";

export const metadata = { title: "Projetos" };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const rows = await listProjectsAdmin();
  const btn = "grid size-7 place-items-center rounded-xs text-grey-600 hairline hover:bg-grey-100 disabled:opacity-30";

  return (
    <>
      <PageHeader
        title="Projetos"
        description="Cases publicados em /projetos. A ordem aqui é a ordem do site."
        actions={
          <LinkButton href="/admin/projetos/novo" variant="primary" size="sm">
            Novo projeto
          </LinkButton>
        }
      />
      <Flash ok={sp.ok} erro={sp.erro} />
      <Card>
        {rows.length === 0 ? (
          <EmptyState title="Nenhum projeto" action={<LinkButton href="/admin/projetos/novo" variant="primary" size="sm">Criar o primeiro</LinkButton>} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="w-[88px]">Ordem</Th>
                <Th>Projeto</Th>
                <Th>Serviços</Th>
                <Th>Status</Th>
                <Th>Atualizado</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={p.id} className="hover:bg-grey-50">
                  <Td>
                    <div className="flex gap-1">
                      <form action={moveProject}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="dir" value="up" />
                        <button type="submit" className={btn} aria-label="Mover para cima" disabled={i === 0}>
                          ↑
                        </button>
                      </form>
                      <form action={moveProject}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="dir" value="down" />
                        <button type="submit" className={btn} aria-label="Mover para baixo" disabled={i === rows.length - 1}>
                          ↓
                        </button>
                      </form>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <MediaThumb m={p.cover} className="size-12 shrink-0 rounded-xs hairline" />
                      <div className="min-w-0">
                        <Link href={`/admin/projetos/${p.id}`} className="font-medium hover:underline">
                          {p.title}
                        </Link>
                        <div className="truncate text-[12px] text-grey-500">
                          /projetos/{p.slug}
                          {p.isDemo && " · demonstrativo"}
                          {p.client && ` · ${p.client}`}
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-[13px] text-grey-600">{p.services.join(", ") || "—"}</Td>
                  <Td>
                    <Badge tone={p.status === "published" ? "green" : "amber"}>{PUBLISH_STATUS_LABELS[p.status]}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-grey-500">{formatDateTime(p.updatedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
