import { and, count, desc, eq, ilike, type SQL } from "drizzle-orm";
import { requireUser } from "@/server/auth/guard";
import { getDb } from "@/server/db/client";
import { auditLogs } from "@/server/db/schema";
import { Card, EmptyState, PageHeader, Pagination, Table, Td, Th, buttonClass, controlClass } from "@/components/admin/ui";
import { AUDIT_ACTION_LABELS, formatDateTime } from "@/components/admin/labels";
import { cn } from "@/lib/cn";

export const metadata = { title: "Auditoria" };

const PAGE_SIZE = 50;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; entity?: string }> }) {
  await requireUser({ role: "admin" });
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const db = await getDb();
  const conds: SQL[] = [];
  const q = sp.q?.trim().slice(0, 100);
  if (q) conds.push(ilike(auditLogs.actorEmail, `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`));
  const entity = sp.entity?.trim().slice(0, 40);
  if (entity) conds.push(eq(auditLogs.entity, entity));
  const where = conds.length ? and(...conds) : undefined;
  const [rows, [{ n }], entities] = await Promise.all([
    db
      .select()
      .from(auditLogs)
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(auditLogs).where(where),
    db.selectDistinct({ entity: auditLogs.entity }).from(auditLogs).orderBy(auditLogs.entity),
  ]);
  const total = Number(n);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (entity) u.set("entity", entity);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/auditoria${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Auditoria" description={`${total} registro${total === 1 ? "" : "s"}. Logins, publicações, exclusões e exportações ficam aqui.`} />
      <Card>
        <form method="get" action="/admin/auditoria" className="mb-4 grid gap-2 sm:grid-cols-[1fr_200px_auto]">
          <input name="q" defaultValue={q ?? ""} placeholder="Filtrar por e-mail do autor" className={cn(controlClass, "h-9")} aria-label="Autor" />
          <select name="entity" defaultValue={entity ?? ""} className={cn(controlClass, "h-9")} aria-label="Entidade">
            <option value="">Todas as entidades</option>
            {entities.map((e) => (
              <option key={e.entity} value={e.entity}>
                {e.entity}
              </option>
            ))}
          </select>
          <button type="submit" className={buttonClass("secondary", "sm")}>
            Filtrar
          </button>
        </form>
        {rows.length === 0 ? (
          <EmptyState title="Nenhum registro" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Quando</Th>
                <Th>Ação</Th>
                <Th>Autor</Th>
                <Th>Entidade</Th>
                <Th>Detalhes</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <Td className="whitespace-nowrap text-grey-500">{formatDateTime(a.createdAt)}</Td>
                  <Td>
                    <span className="font-medium">{AUDIT_ACTION_LABELS[a.action] ?? a.action}</span>
                    <div className="font-mono text-[11px] text-grey-400">{a.action}</div>
                  </Td>
                  <Td className="text-grey-600">{a.actorEmail ?? "sistema"}</Td>
                  <Td>
                    <span className="text-grey-600">{a.entity}</span>
                    {a.entityId && <div className="max-w-[200px] truncate font-mono text-[11px] text-grey-400">{a.entityId}</div>}
                  </Td>
                  <Td>{a.meta ? <code className="block max-w-[360px] truncate font-mono text-[11px] text-grey-500">{JSON.stringify(a.meta)}</code> : "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={page} pages={pages} buildHref={href} />
      </Card>
    </>
  );
}
