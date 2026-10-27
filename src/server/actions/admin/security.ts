"use server";

import { eq, ne, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { sessions, users } from "@/server/db/schema";
import { audit } from "@/server/auth/audit";
import { AuthError, type ActionResult } from "@/server/auth/guard";
import { decryptSecret, encryptSecret, hashPassword, verifyPassword } from "@/server/auth/crypto";
import { getSession } from "@/server/auth/session";
import { generateRecoveryCodes, generateTotpSecret, verifyTotp } from "@/server/auth/totp";
import { validatePasswordPolicy } from "@/server/auth/users";
import { checkRateLimit } from "@/server/auth/rate-limit";
import { isProd } from "@/lib/env";
import { MFA_PENDING_COOKIE, MFA_PENDING_TTL_S, readPendingMfaSecret } from "@/server/repos/admin/mfa";
import { AUTH_MESSAGES, fieldErrorsOf, formToObject, withFlash, withUser } from "./_shared";

// ---------------------------------------------------------------------------
// Senha
// ---------------------------------------------------------------------------
const passwordSchema = z.object({
  current: z.string().min(1, "Informe a senha atual.").max(200),
  password: z.string().min(1, "Informe a nova senha.").max(200),
  confirm: z.string().min(1, "Confirme a nova senha.").max(200),
});

export async function changePassword(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  return withUser({}, async (user) => {
    const parsed = passwordSchema.safeParse(formToObject(formData));
    if (!parsed.success) return { ok: false, error: "Verifique os campos.", fieldErrors: fieldErrorsOf(parsed.error) };
    const d = parsed.data;
    const limit = await checkRateLimit(`pwchange:${user.id}`, 5, 15 * 60 * 1000);
    if (!limit.ok) return { ok: false, error: "Muitas tentativas. Aguarde alguns minutos." };
    const policy = validatePasswordPolicy(d.password);
    if (policy) return { ok: false, error: policy, fieldErrors: { password: policy } };
    if (d.password !== d.confirm) return { ok: false, error: "As senhas não conferem.", fieldErrors: { confirm: "As senhas não conferem." } };
    const db = await getDb();
    const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
    if (!row || !(await verifyPassword(d.current, row.passwordHash))) return { ok: false, error: "Senha atual incorreta.", fieldErrors: { current: "Senha atual incorreta." } };
    if (d.current === d.password) return { ok: false, error: "A nova senha precisa ser diferente da atual.", fieldErrors: { password: "Escolha outra senha." } };
    await db.update(users).set({ passwordHash: await hashPassword(d.password), updatedAt: new Date() }).where(eq(users.id, user.id));
    // Encerra as outras sessões, mantendo a atual.
    const session = await getSession();
    if (session) await db.delete(sessions).where(and(eq(sessions.userId, user.id), ne(sessions.id, session.sessionId)));
    await audit({ actorId: user.id, actorEmail: user.email, action: "auth.password_changed", entity: "user", entityId: user.id });
    return { ok: true, message: "Senha alterada. As outras sessões foram encerradas." };
  });
}

// ---------------------------------------------------------------------------
// MFA: ativação
// ---------------------------------------------------------------------------
/** Usuário autenticado (sessão válida), mesmo sem MFA ainda — só para o fluxo de ativação. */
async function sessionUserForEnrollment() {
  const session = await getSession();
  if (!session) throw new AuthError("unauthenticated");
  if (session.user.mfaEnabled && !session.mfaVerified) throw new AuthError("mfa_required");
  return session.user;
}

export async function startMfaEnrollment(): Promise<void> {
  let user;
  try {
    user = await sessionUserForEnrollment();
  } catch (err) {
    if (err instanceof AuthError) redirect("/admin/login");
    throw err;
  }
  if (user.mfaEnabled) redirect("/admin/seguranca");
  const secret = generateTotpSecret();
  (await cookies()).set(MFA_PENDING_COOKIE, encryptSecret(`${user.id}:${secret}`), { httpOnly: true, sameSite: "lax", secure: isProd, path: "/admin", maxAge: MFA_PENDING_TTL_S });
  redirect("/admin/seguranca/ativar-mfa");
}

export async function cancelMfaEnrollment(): Promise<void> {
  (await cookies()).delete({ name: MFA_PENDING_COOKIE, path: "/admin" });
  redirect("/admin/seguranca/ativar-mfa");
}

export async function confirmMfaEnrollment(_prev: ActionResult<{ codes: string[] }> | undefined, formData: FormData): Promise<ActionResult<{ codes: string[] }>> {
  let user;
  try {
    user = await sessionUserForEnrollment();
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: AUTH_MESSAGES[err.code] };
    throw err;
  }
  if (user.mfaEnabled) return { ok: false, error: "O MFA já está ativo nesta conta." };
  const secret = await readPendingMfaSecret(user.id);
  if (!secret) return { ok: false, error: "A configuração expirou. Gere um novo QR code." };
  const limit = await checkRateLimit(`mfa-enroll:${user.id}`, 10, 15 * 60 * 1000);
  if (!limit.ok) return { ok: false, error: "Muitas tentativas. Aguarde alguns minutos." };
  const code = String(formData.get("code") ?? "");
  if (!verifyTotp(secret, code)) return { ok: false, error: "Código inválido. Confira o relógio do celular e tente de novo." };

  const { codes, hashes } = generateRecoveryCodes();
  const db = await getDb();
  await db
    .update(users)
    .set({ mfaSecretEnc: encryptSecret(secret), mfaEnabled: true, recoveryCodeHashes: hashes, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  // A sessão atual passa a contar como verificada (o usuário acabou de provar posse do autenticador).
  const session = await getSession();
  if (session) await db.update(sessions).set({ mfaVerified: true }).where(eq(sessions.id, session.sessionId));
  (await cookies()).delete({ name: MFA_PENDING_COOKIE, path: "/admin" });
  await audit({ actorId: user.id, actorEmail: user.email, action: "auth.mfa_enabled", entity: "user", entityId: user.id });
  revalidatePath("/admin/seguranca");
  return { ok: true, data: { codes }, message: "MFA ativado. Guarde os códigos de recuperação em um lugar seguro: eles não serão mostrados de novo." };
}

// ---------------------------------------------------------------------------
// MFA: desativar (não permitido para administradores) e regenerar códigos
// ---------------------------------------------------------------------------
async function verifyOwnTotp(userId: string, code: string): Promise<"ok" | "invalid" | "no-mfa"> {
  const db = await getDb();
  const [row] = await db.select({ mfaSecretEnc: users.mfaSecretEnc, mfaEnabled: users.mfaEnabled }).from(users).where(eq(users.id, userId)).limit(1);
  if (!row?.mfaEnabled || !row.mfaSecretEnc) return "no-mfa";
  return verifyTotp(decryptSecret(row.mfaSecretEnc), code) ? "ok" : "invalid";
}

export async function regenerateRecoveryCodes(_prev: ActionResult<{ codes: string[] }> | undefined, formData: FormData): Promise<ActionResult<{ codes: string[] }>> {
  return withUser({}, async (user) => {
    const limit = await checkRateLimit(`mfa-regen:${user.id}`, 8, 15 * 60 * 1000);
    if (!limit.ok) return { ok: false, error: "Muitas tentativas. Aguarde alguns minutos." };
    const result = await verifyOwnTotp(user.id, String(formData.get("code") ?? ""));
    if (result === "no-mfa") return { ok: false, error: "O MFA não está ativo." };
    if (result === "invalid") return { ok: false, error: "Código inválido." };
    const { codes, hashes } = generateRecoveryCodes();
    const db = await getDb();
    await db.update(users).set({ recoveryCodeHashes: hashes, updatedAt: new Date() }).where(eq(users.id, user.id));
    await audit({ actorId: user.id, actorEmail: user.email, action: "auth.recovery_regenerated", entity: "user", entityId: user.id });
    return { ok: true, data: { codes }, message: "Novos códigos gerados. Os anteriores deixaram de valer." };
  });
}

export async function disableMfa(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  return withUser({}, async (user) => {
    if (user.role === "admin") return { ok: false, error: "Administradores precisam manter o MFA ativo." };
    const limit = await checkRateLimit(`mfa-disable:${user.id}`, 8, 15 * 60 * 1000);
    if (!limit.ok) return { ok: false, error: "Muitas tentativas. Aguarde alguns minutos." };
    const result = await verifyOwnTotp(user.id, String(formData.get("code") ?? ""));
    if (result === "no-mfa") return { ok: false, error: "O MFA não está ativo." };
    if (result === "invalid") return { ok: false, error: "Código inválido." };
    const db = await getDb();
    await db.update(users).set({ mfaSecretEnc: null, mfaEnabled: false, recoveryCodeHashes: [], updatedAt: new Date() }).where(eq(users.id, user.id));
    await audit({ actorId: user.id, actorEmail: user.email, action: "auth.mfa_disabled", entity: "user", entityId: user.id });
    revalidatePath("/admin/seguranca");
    return { ok: true, message: "MFA desativado." };
  });
}

export async function endOtherSessions(): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const db = await getDb();
  await db.delete(sessions).where(and(eq(sessions.userId, session.user.id), ne(sessions.id, session.sessionId)));
  await audit({ actorId: session.user.id, actorEmail: session.user.email, action: "auth.logout", entity: "user", entityId: session.user.id, meta: { others: true } });
  redirect(withFlash("/admin/seguranca", "ok", "As outras sessões foram encerradas."));
}
