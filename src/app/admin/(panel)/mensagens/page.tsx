import Link from "next/link";
import { requireUser } from "@/server/auth/guard";
import { MESSAGE_STATUSES } from "@/server/db/schema";
import { listMessages } from "@/server/repos/admin/leads";
import { Badge, Card, EmptyState, Flash, LinkButton, PageHeader, Pagination, Table, Td, Th, buttonClass, controlClass } from "@/components/admin/ui";
import { MESSAGE_STATUS_LABELS, MESSAGE_STATUS_TONES, formatDateTime } from "@/components/admin/labels";
import { cn } from "@/lib/cn";

export const metadata = { title: "Mensagens" };

type SP = { status?: string; q?: string; page?: string; ok?: string; erro?: string };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser({ role: "admin" });
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const result = await listMessages({ status: sp.status, q: sp.q, page });
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.status) u.set("status", sp.status);
    if (sp.q) u.set("q", sp.q);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/mensagens${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Mensagens" description={`${result.total} mensagem${result.total === 1 ? "" : "s"} do formulário de contato.`} />
      <Flash ok={sp.ok} erro={sp.erro} />
      <Card className="mb-4">
        <form method="get" action="/admin/mensagens" className="grid gap-3 sm:grid-cols-[1fr_200px_auto]">
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Buscar por nome, assunto, e-mail ou texto" className={cn(controlClass, "h-10")} aria-label="Buscar" />
          <select name="status" defaultValue={sp.status ?? ""} className={cn(controlClass, "h-10")} aria-label="Status">
            <option value="">Todos os status</option>
            {MESSAGE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {MESSAGE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button type="submit" className={buttonClass("primary")}>
            Filtrar
          </button>
        </form>
      </Card>
      <Card>
        {result.rows.length === 0 ? (
          <EmptyState title="Nenhuma mensagem" description="As mensagens enviadas pela página de contato aparecem aqui." action={<LinkButton href="/admin/mensagens" size="sm">Limpar filtros</LinkButton>} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>Assunto</Th>
                <Th>Mensagem</Th>
                <Th>Status</Th>
                <Th>Recebida</Th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((m) => (
                <tr key={m.id} className="hover:bg-grey-50">
                  <Td>
                    <Link href={`/admin/mensagens/${m.id}`} className="font-medium hover:underline">
                      {m.name}
                    </Link>
                    <div className="text-[12px] text-grey-500">{m.company || m.email || m.whatsapp}</div>
                  </Td>
                  <Td>{m.subject}</Td>
                  <Td className="max-w-[320px] truncate text-grey-600">{m.message}</Td>
                  <Td>
                    <Badge tone={MESSAGE_STATUS_TONES[m.status]}>{MESSAGE_STATUS_LABELS[m.status]}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-grey-500">{formatDateTime(m.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={result.page} pages={result.pages} buildHref={qs} />
      </Card>
    </>
  );
}
