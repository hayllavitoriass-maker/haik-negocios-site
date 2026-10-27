import Link from "next/link";
import { cookies } from "next/headers";
import { requireUser } from "@/server/auth/guard";
import { PREVIEW_COOKIE } from "@/server/content";
import { listContentEntries } from "@/server/repos/admin/content";
import { disablePreview } from "@/server/actions/admin/content";
import { Alert, Badge, Card, Flash, PageHeader, Table, Td, Th, buttonClass } from "@/components/admin/ui";
import { formatDateTime } from "@/components/admin/labels";

export const metadata = { title: "Conteúdo" };

const STATUS: Record<string, { label: string; tone: "neutral" | "amber" | "green" }> = {
  padrao: { label: "Padrão", tone: "neutral" },
  rascunho: { label: "Rascunho", tone: "amber" },
  publicado: { label: "Publicado", tone: "green" },
};

export default async function ContentListPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const [entries, store] = await Promise.all([listContentEntries(), cookies()]);
  const previewOn = store.get(PREVIEW_COOKIE)?.value === "1";

  return (
    <>
      <PageHeader title="Conteúdo" description="Textos oficiais de cada página. Salve rascunhos, pré-visualize e publique quando estiver pronto." />
      <Flash ok={sp.ok} erro={sp.erro} />
      {previewOn && (
        <Alert tone="amber" className="mb-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Pré-visualização ligada: ao abrir o site com este login, você vê os rascunhos.</span>
            <form action={disablePreview}>
              <button type="submit" className={buttonClass("secondary", "sm")}>
                Sair da pré-visualização
              </button>
            </form>
          </div>
        </Alert>
      )}
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Página</Th>
              <Th>Rota</Th>
              <Th>Status</Th>
              <Th>Atualizado</Th>
              <Th>Publicado</Th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.key} className="hover:bg-grey-50">
                <Td>
                  <Link href={`/admin/conteudo/${e.key}`} className="font-medium hover:underline">
                    {e.label}
                  </Link>
                  <div className="font-mono text-[11px] text-grey-400">{e.key}</div>
                </Td>
                <Td>
                  <a href={e.path} target="_blank" rel="noopener noreferrer" className="text-grey-600 hover:underline">
                    {e.path}
                  </a>
                </Td>
                <Td>
                  <Badge tone={STATUS[e.status].tone}>{STATUS[e.status].label}</Badge>
                </Td>
                <Td className="whitespace-nowrap text-grey-500">{formatDateTime(e.updatedAt)}</Td>
                <Td className="whitespace-nowrap text-grey-500">{formatDateTime(e.publishedAt)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
