import Link from "next/link";
import { requireUser } from "@/server/auth/guard";
import { getDashboardData } from "@/server/repos/admin/dashboard";
import { Alert, Badge, Card, EmptyState, PageHeader, Stat, Table, Td, Th } from "@/components/admin/ui";
import { AUDIT_ACTION_LABELS, LEAD_STATUS_LABELS, LEAD_STATUS_TONES, formatDateTime } from "@/components/admin/labels";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const isAdmin = user.role === "admin";
  const data = await getDashboardData(isAdmin);

  return (
    <>
      <PageHeader title={`Olá, ${user.name.split(" ")[0]}`} description="Visão geral do site e do atendimento." />
      {sp.erro === "sem-permissao" && (
        <Alert tone="red" className="mb-5">
          Você não tem permissão para acessar essa área.
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {isAdmin && <Stat label="Leads" value={data.totalLeads} href="/admin/leads" />}
        {isAdmin && <Stat label="Leads novos" value={data.newLeads} href="/admin/leads?status=novo" tone={data.newLeads > 0 ? "red" : undefined} />}
        {isAdmin && <Stat label="Mensagens novas" value={data.newMessages} href="/admin/mensagens?status=novo" tone={data.newMessages > 0 ? "red" : undefined} />}
        <Stat label="Projetos publicados" value={data.publishedProjects} href="/admin/projetos" />
        <Stat label="Artigos publicados" value={data.publishedPosts} href="/admin/blog" />
        <Stat label="Rascunhos" value={data.drafts} href="/admin/conteudo" />
      </div>
      <p className="mt-2 text-[12px] text-grey-500">
        Rascunhos: {data.draftsBreakdown.content} de conteúdo, {data.draftsBreakdown.projects} de projetos, {data.draftsBreakdown.posts} de artigos.
      </p>

      {isAdmin && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card title="Últimos leads" actions={<Link href="/admin/leads" className="text-[13px] text-red-700 hover:underline">Ver todos</Link>}>
            {data.recentLeads.length === 0 ? (
              <EmptyState title="Nenhum lead ainda" description="Os pedidos de diagnóstico aparecem aqui assim que chegarem." />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Nome</Th>
                    <Th>Empresa</Th>
                    <Th>Status</Th>
                    <Th>Recebido</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentLeads.map((l) => (
                    <tr key={l.id}>
                      <Td>
                        <Link href={`/admin/leads/${l.id}`} className="font-medium hover:underline">
                          {l.name}
                        </Link>
                      </Td>
                      <Td>{l.company}</Td>
                      <Td>
                        <Badge tone={LEAD_STATUS_TONES[l.status]}>{LEAD_STATUS_LABELS[l.status]}</Badge>
                      </Td>
                      <Td className="whitespace-nowrap text-grey-500">{formatDateTime(l.createdAt)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
          <Card title="Atividade recente" actions={<Link href="/admin/auditoria" className="text-[13px] text-red-700 hover:underline">Ver auditoria</Link>}>
            {data.recentAudit.length === 0 ? (
              <EmptyState title="Sem atividade registrada" />
            ) : (
              <ul className="grid gap-2">
                {data.recentAudit.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 border-b border-grey-100 pb-2 text-[13px] last:border-0">
                    <span>
                      <span className="font-medium text-ink">{AUDIT_ACTION_LABELS[a.action] ?? a.action}</span>
                      <span className="text-grey-500"> · {a.actorEmail ?? "sistema"}</span>
                    </span>
                    <span className="whitespace-nowrap text-grey-500">{formatDateTime(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
