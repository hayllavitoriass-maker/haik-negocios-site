import { asc } from "drizzle-orm";
import { requireUser } from "@/server/auth/guard";
import { getDb } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { changeUserRole, resetUserMfa, setUserActive } from "@/server/actions/admin/users";
import { CreateUserForm } from "@/components/admin/UserForms";
import { Badge, Card, Flash, PageHeader, Table, Td, Th, buttonClass, controlClass } from "@/components/admin/ui";
import { ConfirmForm } from "@/components/admin/client";
import { ROLE_LABELS, formatDateTime } from "@/components/admin/labels";
import { cn } from "@/lib/cn";

export const metadata = { title: "Usuários" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const me = await requireUser({ role: "admin" });
  const sp = await searchParams;
  const db = await getDb();
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.isActive, mfaEnabled: users.mfaEnabled, lastLoginAt: users.lastLoginAt, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.createdAt));
  const activeAdmins = rows.filter((u) => u.role === "admin" && u.isActive).length;

  return (
    <>
      <PageHeader title="Usuários" description="Quem acessa o painel. Administradores veem tudo e precisam de MFA; editores cuidam do conteúdo." />
      <Flash ok={sp.ok} erro={sp.erro} />
      <Card title="Novo usuário" className="mb-4">
        <CreateUserForm />
      </Card>
      <Card title={`Equipe (${rows.length})`}>
        <Table>
          <thead>
            <tr>
              <Th>Usuário</Th>
              <Th>Papel</Th>
              <Th>MFA</Th>
              <Th>Último acesso</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const isMe = u.id === me.id;
              const lastAdmin = u.role === "admin" && u.isActive && activeAdmins <= 1;
              return (
                <tr key={u.id} className={cn(!u.isActive && "opacity-60")}>
                  <Td>
                    <div className="font-medium">
                      {u.name} {isMe && <span className="text-[12px] font-normal text-grey-500">(você)</span>}
                    </div>
                    <div className="text-[12px] text-grey-500">{u.email}</div>
                    {!u.isActive && <Badge tone="neutral" className="mt-1">Desativado</Badge>}
                  </Td>
                  <Td>
                    {isMe ? (
                      <Badge tone={u.role === "admin" ? "red" : "blue"}>{ROLE_LABELS[u.role]}</Badge>
                    ) : (
                      <form action={changeUserRole} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={u.id} />
                        <select name="role" defaultValue={u.role} className={cn(controlClass, "h-8 w-auto pr-7 text-[13px]")} aria-label="Papel" disabled={lastAdmin}>
                          <option value="editor">Editor</option>
                          <option value="admin">Administrador</option>
                        </select>
                        <button type="submit" className={buttonClass("secondary", "sm")} disabled={lastAdmin}>
                          Aplicar
                        </button>
                      </form>
                    )}
                  </Td>
                  <Td>{u.mfaEnabled ? <Badge tone="green">Ativo</Badge> : <Badge tone="amber">Pendente</Badge>}</Td>
                  <Td className="whitespace-nowrap text-grey-500">{formatDateTime(u.lastLoginAt)}</Td>
                  <Td>
                    {!isMe && (
                      <div className="flex flex-wrap gap-1.5">
                        {u.isActive ? (
                          <ConfirmForm action={setUserActive} fields={{ id: u.id, active: "0" }} title={`Desativar ${u.name}?`} description="A pessoa perde o acesso imediatamente; as sessões são encerradas. Pode ser reativada depois." confirmLabel="Desativar" size="sm" variant={lastAdmin ? "ghost" : "danger"}>
                            Desativar
                          </ConfirmForm>
                        ) : (
                          <ConfirmForm action={setUserActive} fields={{ id: u.id, active: "1" }} title={`Reativar ${u.name}?`} confirmLabel="Reativar" size="sm" variant="secondary">
                            Reativar
                          </ConfirmForm>
                        )}
                        {u.mfaEnabled && (
                          <ConfirmForm action={resetUserMfa} fields={{ id: u.id }} title={`Redefinir MFA de ${u.name}?`} description="Use quando a pessoa perdeu o autenticador. O segredo e os códigos de recuperação são apagados e as sessões encerradas; ela configura um novo no próximo login." confirmLabel="Redefinir MFA" size="sm" variant="secondary">
                            Redefinir MFA
                          </ConfirmForm>
                        )}
                      </div>
                    )}
                    {lastAdmin && !isMe && <p className="mt-1 text-[11px] text-grey-500">Último administrador ativo: não pode ser rebaixado nem desativado.</p>}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
