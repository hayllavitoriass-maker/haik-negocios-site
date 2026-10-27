import Link from "next/link";
import { requireUser } from "@/server/auth/guard";
import { listPostsAdmin } from "@/server/repos/admin/publishing";
import { Badge, Card, EmptyState, Flash, LinkButton, PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { PUBLISH_STATUS_LABELS, formatDateTime } from "@/components/admin/labels";

export const metadata = { title: "Blog" };

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const rows = await listPostsAdmin();
  return (
    <>
      <PageHeader
        title="Blog"
        description="Artigos publicados em /conteudos."
        actions={
          <LinkButton href="/admin/blog/novo" variant="primary" size="sm">
            Novo artigo
          </LinkButton>
        }
      />
      <Flash ok={sp.ok} erro={sp.erro} />
      <Card>
        {rows.length === 0 ? (
          <EmptyState title="Nenhum artigo" action={<LinkButton href="/admin/blog/novo" variant="primary" size="sm">Escrever o primeiro</LinkButton>} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Artigo</Th>
                <Th>Categoria</Th>
                <Th>Autor</Th>
                <Th>Status</Th>
                <Th>Publicado</Th>
                <Th>Atualizado</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-grey-50">
                  <Td>
                    <Link href={`/admin/blog/${p.id}`} className="font-medium hover:underline">
                      {p.title}
                    </Link>
                    <div className="text-[12px] text-grey-500">/conteudos/{p.slug}</div>
                  </Td>
                  <Td>{p.category}</Td>
                  <Td className="text-grey-600">{p.authorName ?? "—"}</Td>
                  <Td>
                    <Badge tone={p.status === "published" ? "green" : "amber"}>{PUBLISH_STATUS_LABELS[p.status]}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-grey-500">{formatDateTime(p.publishedAt)}</Td>
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
