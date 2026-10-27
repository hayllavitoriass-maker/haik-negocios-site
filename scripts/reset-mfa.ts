/**
 * Remove o MFA de um usuário (perdeu o autenticador) e encerra as sessões dele.
 * Uso: npx tsx scripts/reset-mfa.ts --email ana@haik.com.br
 */
import { eq } from "drizzle-orm";
import { arg, openDb, schema } from "./_db";

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  if (!email) {
    console.error("Uso: npx tsx scripts/reset-mfa.ts --email <e-mail>");
    process.exit(1);
  }
  const { db, close } = await openDb();
  try {
    const [user] = await db.select({ id: schema.users.id, mfaEnabled: schema.users.mfaEnabled }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (!user) {
      console.error(`Usuário ${email} não encontrado.`);
      process.exit(1);
    }
    await db
      .update(schema.users)
      .set({ mfaSecretEnc: null, mfaEnabled: false, recoveryCodeHashes: [], updatedAt: new Date() })
      .where(eq(schema.users.id, user.id));
    await db.delete(schema.sessions).where(eq(schema.sessions.userId, user.id));
    await db.insert(schema.auditLogs).values({ actorEmail: "cli", action: "user.reset_mfa", entity: "user", entityId: user.id, meta: { via: "scripts/reset-mfa.ts" } });
    console.log(user.mfaEnabled ? `MFA de ${email} redefinido e sessões encerradas. No próximo login, um novo autenticador será configurado.` : `${email} não tinha MFA ativo; sessões encerradas mesmo assim.`);
  } finally {
    await close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
