import Link from "next/link";
import { requireUser } from "@/server/auth/guard";
import { listTestimonialsAdmin } from "@/server/repos/admin/publishing";
import { MediaThumb } from "@/components/admin/media/MediaPicker";
import { Badge, Card, EmptyState, Flash, LinkButton, PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { PUBLISH_STATUS_LABELS, formatDateTime } from "@/components/admin/labels";

export const metadata = { title: "Depoimentos" };

export default async function TestimonialsPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const rows = await listTestimonialsAdmin();
  return (
    <>
      <PageHeader
        title="Depoimentos"
        description="Só depoimentos publicados E com autorização registrada aparecem no site."
        actions={
          <LinkButton href="/admin/depoimentos/novo" variant="primary" size="sm">
            Novo depoimento
          </LinkButton>
        }
      />
      <Flash ok={sp.ok} erro={sp.erro} />
      <Card>
        {rows.length === 0 ? (
          <EmptyState title="Nenhum depoimento" description="Cadastre depoimentos reais, com autorização por escrito." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Pessoa</Th>
                <Th>Depoimento</Th>
                <Th>Autorização</Th>
                <Th>Status</Th>
                <Th>Ordem</Th>
                <Th>Atualizado</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-grey-50">
                  <Td>
                    <div className="flex items-center gap-3">
                      <MediaThumb m={t.photo} className="size-10 shrink-0 rounded-full" />
                      <div>
                        <Link href={`/admin/depoimentos/${t.id}`} className="font-medium hover:underline">
                          {t.name}
                        </Link>
                        <div className="text-[12px] text-grey-500">{[t.role, t.company, t.city].filter(Boolean).join(" · ")}</div>
                      </div>
                    </div>
                  </Td>
                  <Td className="max-w-[320px] truncate text-grey-600">{t.quote}</Td>
                  <Td>{t.authorized ? <Badge tone="green">Autorizado</Badge> : <Badge tone="red">Pendente</Badge>}</Td>
                  <Td>
                    <Badge tone={t.status === "published" ? "green" : "amber"}>{PUBLISH_STATUS_LABELS[t.status]}</Badge>
                  </Td>
                  <Td>{t.sortOrder}</Td>
                  <Td className="whitespace-nowrap text-grey-500">{formatDateTime(t.updatedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
