import { count, eq } from "drizzle-orm";
import { requireUser } from "@/server/auth/guard";
import { getDb } from "@/server/db/client";
import { sessions, users } from "@/server/db/schema";
import { endOtherSessions } from "@/server/actions/admin/security";
import { ChangePasswordForm, DisableMfaForm, RegenerateCodesForm } from "@/components/admin/SecurityForms";
import { Alert, Badge, Card, Flash, LinkButton, PageHeader, buttonClass } from "@/components/admin/ui";
import { ROLE_LABELS, formatDateTime } from "@/components/admin/labels";

export const metadata = { title: "Segurança" };

export default async function SecurityPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const db = await getDb();
  const [[row], [{ n }]] = await Promise.all([
    db.select({ mfaEnabled: users.mfaEnabled, recovery: users.recoveryCodeHashes, lastLoginAt: users.lastLoginAt }).from(users).where(eq(users.id, user.id)).limit(1),
    db.select({ n: count() }).from(sessions).where(eq(sessions.userId, user.id)),
  ]);
  const remaining = row?.recovery.length ?? 0;

  return (
    <>
      <PageHeader title="Segurança" description={`${user.name} · ${ROLE_LABELS[user.role]} · ${user.email}`} />
      <Flash ok={sp.ok} erro={sp.erro} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Senha" description="Trocar a senha encerra as outras sessões abertas.">
          <ChangePasswordForm />
        </Card>
        <div className="grid content-start gap-4">
          <Card title="Verificação em duas etapas (MFA)" actions={row?.mfaEnabled ? <Badge tone="green">Ativa</Badge> : <Badge tone="amber">Inativa</Badge>}>
            {row?.mfaEnabled ? (
              <div className="grid gap-4">
                <p className="text-[13px] text-grey-600">
                  Códigos de recuperação restantes: <strong>{remaining}</strong> de 8.
                </p>
                {remaining <= 2 && <Alert tone="amber">Poucos códigos de recuperação. Gere novos antes que acabem.</Alert>}
                <RegenerateCodesForm />
                {user.role !== "admin" && (
                  <details className="rounded-xs bg-grey-50 p-3">
                    <summary className="cursor-pointer text-[13px] font-medium">Desativar MFA</summary>
                    <div className="mt-3">
                      <DisableMfaForm />
                    </div>
                  </details>
                )}
                {user.role === "admin" && <p className="text-[12px] text-grey-500">Administradores precisam manter o MFA ativo. Se perder o autenticador, outro administrador pode redefinir em Usuários.</p>}
              </div>
            ) : (
              <div className="grid gap-3">
                <p className="text-[13px] text-grey-600">Proteja sua conta com um aplicativo autenticador (Google Authenticator, 1Password, Authy...).</p>
                <div>
                  <LinkButton href="/admin/seguranca/ativar-mfa" variant="primary" size="sm">
                    Ativar MFA
                  </LinkButton>
                </div>
              </div>
            )}
          </Card>
          <Card title="Sessões">
            <p className="text-[13px] text-grey-600">
              Sessões ativas desta conta: <strong>{Number(n)}</strong>. Último login em {formatDateTime(row?.lastLoginAt)}.
            </p>
            <form action={endOtherSessions} className="mt-3">
              <button type="submit" className={buttonClass("secondary", "sm")}>
                Encerrar as outras sessões
              </button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
