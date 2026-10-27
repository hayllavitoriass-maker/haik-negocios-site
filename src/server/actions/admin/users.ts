"use server";

import { and, count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { audit } from "@/server/auth/audit";
import { AuthError, requireUserForAction, type ActionResult } from "@/server/auth/guard";
import { createUser, findUserByEmail, validatePasswordPolicy } from "@/server/auth/users";
import { destroyAllSessionsForUser } from "@/server/auth/session";
import { randomToken } from "@/server/auth/crypto";
import { AUTH_MESSAGES, fieldErrorsOf, formToObject, uuidSchema, withFlash, withUser } from "./_shared";

const PATH = "/admin/usuarios";

async function adminOrRedirect() {
  try {
    return await requireUserForAction({ role: "admin" });
  } catch (err) {
    if (err instanceof AuthError) redirect(withFlash("/admin", "erro", AUTH_MESSAGES[err.code]));
    throw err;
  }
}

async function activeAdminCount(excludeId?: string) {
  const db = await getDb();
  const [row] = await db
    .select({ n: count() })
    .from(users)
    .where(and(eq(users.role, "admin"), eq(users.isActive, true)));
  let n = Number(row?.n ?? 0);
  if (excludeId) {
    const [t] = await db.select({ role: users.role, isActive: users.isActive }).from(users).where(eq(users.id, excludeId)).limit(1);
    if (t && t.role === "admin" && t.isActive) n -= 1;
  }
  return n;
}

const createSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  email: z.string().trim().min(1, "Informe o e-mail.").email("E-mail inválido.").max(200),
  role: z.enum(["admin", "editor"]),
  password: z.string().max(200).optional().default(""),
});

/** Cria usuário com senha temporária (gerada ou informada), mostrada uma única vez. */
export async function createUserAction(_prev: ActionResult<{ password: string; email: string }> | undefined, formData: FormData): Promise<ActionResult<{ password: string; email: string }>> {
  return withUser({ role: "admin" }, async (actor) => {
    const parsed = createSchema.safeParse(formToObject(formData));
    if (!parsed.success) return { ok: false, error: "Verifique os campos.", fieldErrors: fieldErrorsOf(parsed.error) };
    const d = parsed.data;
    const password = d.password || randomToken(12);
    const policy = validatePasswordPolicy(password);
    if (policy) return { ok: false, error: policy, fieldErrors: { password: policy } };
    if (await findUserByEmail(d.email)) return { ok: false, error: "Já existe um usuário com este e-mail.", fieldErrors: { email: "E-mail em uso." } };
    const user = await createUser({ email: d.email, name: d.name, password, role: d.role });
    await audit({ actorId: actor.id, actorEmail: actor.email, action: "user.create", entity: "user", entityId: user.id, meta: { role: d.role } });
    revalidatePath(PATH);
    return { ok: true, data: { password, email: user.email }, message: "Usuário criado. Compartilhe a senha temporária com segurança: ela não será exibida de novo." };
  });
}

export async function changeUserRole(formData: FormData): Promise<void> {
  const actor = await adminOrRedirect();
  const parsed = z.object({ id: uuidSchema, role: z.enum(["admin", "editor"]) }).safeParse({ id: formData.get("id"), role: formData.get("role") });
  if (!parsed.success) redirect(withFlash(PATH, "erro", "Dados inválidos."));
  const { id, role } = parsed.data;
  if (id === actor.id) redirect(withFlash(PATH, "erro", "Você não pode alterar o próprio papel."));
  if (role === "editor" && (await activeAdminCount(id)) < 1) redirect(withFlash(PATH, "erro", "Não é possível rebaixar o último administrador ativo."));
  const db = await getDb();
  const updated = await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id)).returning({ id: users.id });
  if (!updated.length) redirect(withFlash(PATH, "erro", "Usuário não encontrado."));
  await destroyAllSessionsForUser(id);
  await audit({ actorId: actor.id, actorEmail: actor.email, action: "user.role", entity: "user", entityId: id, meta: { role } });
  revalidatePath(PATH);
  redirect(withFlash(PATH, "ok", "Papel atualizado. As sessões do usuário foram encerradas."));
}

export async function setUserActive(formData: FormData): Promise<void> {
  const actor = await adminOrRedirect();
  const parsed = z.object({ id: uuidSchema, active: z.enum(["0", "1"]) }).safeParse({ id: formData.get("id"), active: formData.get("active") });
  if (!parsed.success) redirect(withFlash(PATH, "erro", "Dados inválidos."));
  const { id } = parsed.data;
  const active = parsed.data.active === "1";
  if (id === actor.id) redirect(withFlash(PATH, "erro", "Você não pode desativar a própria conta."));
  if (!active && (await activeAdminCount(id)) < 1) redirect(withFlash(PATH, "erro", "Não é possível desativar o último administrador ativo."));
  const db = await getDb();
  const updated = await db.update(users).set({ isActive: active, updatedAt: new Date() }).where(eq(users.id, id)).returning({ id: users.id });
  if (!updated.length) redirect(withFlash(PATH, "erro", "Usuário não encontrado."));
  if (!active) await destroyAllSessionsForUser(id);
  await audit({ actorId: actor.id, actorEmail: actor.email, action: active ? "user.reactivate" : "user.deactivate", entity: "user", entityId: id });
  revalidatePath(PATH);
  redirect(withFlash(PATH, "ok", active ? "Usuário reativado." : "Usuário desativado e sessões encerradas."));
}

export async function resetUserMfa(formData: FormData): Promise<void> {
  const actor = await adminOrRedirect();
  const parsed = uuidSchema.safeParse(formData.get("id"));
  if (!parsed.success) redirect(withFlash(PATH, "erro", "Identificador inválido."));
  const id = parsed.data;
  const db = await getDb();
  const updated = await db
    .update(users)
    .set({ mfaSecretEnc: null, mfaEnabled: false, recoveryCodeHashes: [], updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({ id: users.id });
  if (!updated.length) redirect(withFlash(PATH, "erro", "Usuário não encontrado."));
  await destroyAllSessionsForUser(id);
  await audit({ actorId: actor.id, actorEmail: actor.email, action: "user.reset_mfa", entity: "user", entityId: id });
  revalidatePath(PATH);
  redirect(withFlash(PATH, "ok", "MFA redefinido. No próximo login o usuário configura um novo autenticador."));
}
