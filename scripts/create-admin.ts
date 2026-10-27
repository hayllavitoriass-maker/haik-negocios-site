/**
 * Cria um administrador do painel.
 * Uso:
 *   npx tsx scripts/create-admin.ts --email ana@haik.com.br --name "Ana"            (pergunta a senha)
 *   echo "senha-forte-123456" | npx tsx scripts/create-admin.ts --email ... --name ... --password-stdin
 */
import { eq } from "drizzle-orm";
import { arg, flag, hashPassword, openDb, promptPassword, readStdin, schema, validatePasswordPolicy } from "./_db";

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim();
  if (!email || !name) {
    console.error("Uso: npx tsx scripts/create-admin.ts --email <e-mail> --name <nome> [--password-stdin]");
    process.exit(1);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("E-mail inválido.");
    process.exit(1);
  }
  let password: string;
  if (flag("password-stdin")) {
    password = (await readStdin()).replace(/\r?\n$/, "");
  } else {
    password = await promptPassword("Senha (mín. 12 caracteres): ");
    const confirm = await promptPassword("Confirme a senha: ");
    if (password !== confirm) {
      console.error("As senhas não conferem.");
      process.exit(1);
    }
  }
  const policy = validatePasswordPolicy(password);
  if (policy) {
    console.error(policy);
    process.exit(1);
  }

  const { db, close } = await openDb();
  try {
    const existing = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (existing.length) {
      console.error(`Já existe um usuário com o e-mail ${email}. Nada foi alterado.`);
      process.exit(1);
    }
    const [row] = await db
      .insert(schema.users)
      .values({ email, name, passwordHash: await hashPassword(password), role: "admin" })
      .returning({ id: schema.users.id });
    await db.insert(schema.auditLogs).values({ actorEmail: "cli", action: "user.create", entity: "user", entityId: row.id, meta: { role: "admin", via: "scripts/create-admin.ts" } });
    console.log(`Administrador criado: ${email} (${row.id}). No primeiro login será necessário ativar o MFA.`);
  } finally {
    await close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
