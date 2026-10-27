"use server";

import { and, eq, gt, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { passwordResets, users } from "@/server/db/schema";
import { hashPassword, randomToken, safeEqual, sha256, verifyPassword, decryptSecret } from "@/server/auth/crypto";
import { completeMfaForSession, createSession, destroyAllSessionsForUser, destroySession, getClientInfo, getSession } from "@/server/auth/session";
import { checkRateLimit } from "@/server/auth/rate-limit";
import { audit } from "@/server/auth/audit";
import { countUsers, createUser, findUserByEmail, normalizeEmail, validatePasswordPolicy } from "@/server/auth/users";
import { normalizeRecoveryCode, verifyTotp } from "@/server/auth/totp";
import { sendMail } from "@/server/email";
import { env } from "@/lib/env";
import type { ActionResult } from "@/server/auth/guard";
import { fieldErrorsOf, formToObject } from "./_shared";

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const GENERIC_LOGIN_ERROR = "E-mail ou senha incorretos.";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe o e-mail.").email("E-mail inválido.").max(200),
  password: z.string().min(1, "Informe a senha.").max(200),
  next: z.string().max(300).optional(),
});

function safeNext(next: string | undefined): string {
  if (!next || !next.startsWith("/admin") || next.startsWith("//") || next.includes("://")) return "/admin";
  if (next.startsWith("/admin/login") || next.startsWith("/admin/setup")) return "/admin";
  return next;
}

export async function login(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, error: "Verifique os campos.", fieldErrors: fieldErrorsOf(parsed.error) };
  const email = normalizeEmail(parsed.data.email);
  const client = await getClientInfo();

  const [byIp, byEmail] = await Promise.all([
    checkRateLimit(`login:ip:${client.ipHash}`, LOGIN_LIMIT, LOGIN_WINDOW_MS),
    checkRateLimit(`login:email:${sha256(email)}`, LOGIN_LIMIT, LOGIN_WINDOW_MS),
  ]);
  if (!byIp.ok || !byEmail.ok) {
    return { ok: false, error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
  }

  const user = await findUserByEmail(email);
  const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : await verifyPassword(parsed.data.password, DUMMY_HASH);
  if (!user || !valid || !user.isActive) {
    await audit({ actorEmail: email, action: "auth.login_failed", entity: "user", entityId: user?.id ?? null, meta: { ip: client.ipHash } });
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }

  const db = await getDb();
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await createSession(user.id, { mfaVerified: !user.mfaEnabled });
  await audit({ actorId: user.id, actorEmail: user.email, action: "auth.login", entity: "user", entityId: user.id, meta: { mfaPending: user.mfaEnabled } });

  const next = safeNext(parsed.data.next);
  if (user.mfaEnabled) redirect(`/admin/login/mfa?next=${encodeURIComponent(next)}`);
  redirect(next);
}

// Hash fictício para igualar o tempo de resposta quando o e-mail não existe (evita enumeração).
const DUMMY_HASH = "scrypt$131072$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

const mfaSchema = z.object({
  code: z.string().trim().min(6, "Informe o código.").max(20),
  next: z.string().max(300).optional(),
});

export async function verifyMfa(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.mfaVerified) redirect("/admin");

  const parsed = mfaSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, error: "Informe o código de 6 dígitos ou um código de recuperação." };

  const limit = await checkRateLimit(`mfa:${session.user.id}`, 8, 15 * 60 * 1000);
  if (!limit.ok) return { ok: false, error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };

  const db = await getDb();
  const [row] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!row || !row.mfaEnabled || !row.mfaSecretEnc) redirect("/admin");

  const code = parsed.data.code;
  let ok = false;
  if (/^\d{6}$/.test(code.replace(/\s+/g, ""))) {
    ok = verifyTotp(decryptSecret(row.mfaSecretEnc), code);
  } else {
    const hash = sha256(normalizeRecoveryCode(code));
    if (row.recoveryCodeHashes.includes(hash)) {
      ok = true;
      await db
        .update(users)
        .set({ recoveryCodeHashes: row.recoveryCodeHashes.filter((h) => h !== hash) })
        .where(eq(users.id, row.id));
    }
  }
  if (!ok) {
    await audit({ actorId: row.id, actorEmail: row.email, action: "auth.mfa_failed", entity: "user", entityId: row.id });
    return { ok: false, error: "Código inválido. Tente novamente." };
  }
  await completeMfaForSession(session.sessionId);
  await audit({ actorId: row.id, actorEmail: row.email, action: "auth.mfa_verified", entity: "user", entityId: row.id });
  redirect(safeNext(parsed.data.next));
}

export async function logout(): Promise<void> {
  const session = await getSession();
  await destroySession();
  if (session) {
    await audit({ actorId: session.user.id, actorEmail: session.user.email, action: "auth.logout", entity: "user", entityId: session.user.id });
  }
  redirect("/admin/login");
}

const setupSchema = z.object({
  token: z.string().min(1, "Informe o token de configuração."),
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  email: z.string().trim().min(1, "Informe o e-mail.").email("E-mail inválido.").max(200),
  password: z.string().min(1, "Informe a senha.").max(200),
  confirm: z.string().min(1, "Confirme a senha.").max(200),
});

export async function setupFirstAdmin(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const configured = env.ADMIN_SETUP_TOKEN?.trim();
  if (!configured || (await countUsers()) > 0) return { ok: false, error: "A configuração inicial não está disponível." };

  const client = await getClientInfo();
  const limit = await checkRateLimit(`setup:${client.ipHash}`, 5, 15 * 60 * 1000);
  if (!limit.ok) return { ok: false, error: "Muitas tentativas. Aguarde alguns minutos." };

  const parsed = setupSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, error: "Verifique os campos.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;
  if (!safeEqual(d.token, configured)) return { ok: false, error: "Token de configuração inválido." };
  const policy = validatePasswordPolicy(d.password);
  if (policy) return { ok: false, error: policy, fieldErrors: { password: policy } };
  if (d.password !== d.confirm) return { ok: false, error: "As senhas não conferem.", fieldErrors: { confirm: "As senhas não conferem." } };

  // Revalida a contagem imediatamente antes de inserir (corrida entre dois submits).
  if ((await countUsers()) > 0) return { ok: false, error: "Já existe um usuário cadastrado." };
  const user = await createUser({ email: d.email, name: d.name, password: d.password, role: "admin" });
  await audit({ actorId: user.id, actorEmail: user.email, action: "auth.setup", entity: "user", entityId: user.id });
  redirect("/admin/login?ok=" + encodeURIComponent("Administrador criado. Entre com seu e-mail e senha."));
}

const RESET_TTL_MS = 60 * 60 * 1000;
const RESET_MESSAGE = "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha em instantes.";

export async function requestPasswordReset(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = z.object({ email: z.string().trim().email().max(200) }).safeParse(formToObject(formData));
  // Resposta idêntica em todos os casos (não revela se o e-mail existe).
  if (!parsed.success) return { ok: true, message: RESET_MESSAGE };
  const email = normalizeEmail(parsed.data.email);
  const client = await getClientInfo();
  const [byIp, byEmail] = await Promise.all([
    checkRateLimit(`reset:ip:${client.ipHash}`, 5, 60 * 60 * 1000),
    checkRateLimit(`reset:email:${sha256(email)}`, 3, 60 * 60 * 1000),
  ]);
  if (!byIp.ok || !byEmail.ok) return { ok: true, message: RESET_MESSAGE };

  const user = await findUserByEmail(email);
  if (user && user.isActive) {
    const db = await getDb();
    const token = randomToken(32);
    await db.insert(passwordResets).values({ userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) });
    const link = `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/admin/redefinir?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "Redefinição de senha — Painel HAIK",
      text: `Olá, ${user.name}.\n\nRecebemos um pedido para redefinir a senha do painel. O link abaixo vale por 1 hora:\n\n${link}\n\nSe você não pediu isso, ignore este e-mail.`,
    });
    await audit({ actorId: user.id, actorEmail: user.email, action: "auth.reset_requested", entity: "user", entityId: user.id });
  }
  return { ok: true, message: RESET_MESSAGE };
}

const resetSchema = z.object({
  token: z.string().min(16).max(200),
  password: z.string().min(1, "Informe a nova senha.").max(200),
  confirm: z.string().min(1, "Confirme a senha.").max(200),
});

export async function resetPassword(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = resetSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, error: "Verifique os campos.", fieldErrors: fieldErrorsOf(parsed.error) };
  const d = parsed.data;
  const policy = validatePasswordPolicy(d.password);
  if (policy) return { ok: false, error: policy, fieldErrors: { password: policy } };
  if (d.password !== d.confirm) return { ok: false, error: "As senhas não conferem.", fieldErrors: { confirm: "As senhas não conferem." } };

  const client = await getClientInfo();
  const limit = await checkRateLimit(`reset-use:${client.ipHash}`, 10, 60 * 60 * 1000);
  if (!limit.ok) return { ok: false, error: "Muitas tentativas. Aguarde alguns minutos." };

  const db = await getDb();
  const rows = await db
    .select()
    .from(passwordResets)
    .where(and(eq(passwordResets.tokenHash, sha256(d.token)), isNull(passwordResets.usedAt), gt(passwordResets.expiresAt, new Date())))
    .limit(1);
  const reset = rows[0];
  if (!reset) return { ok: false, error: "Este link é inválido ou expirou. Peça um novo." };

  await db.update(users).set({ passwordHash: await hashPassword(d.password), updatedAt: new Date() }).where(eq(users.id, reset.userId));
  await db.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.id, reset.id));
  await destroyAllSessionsForUser(reset.userId);
  await audit({ actorId: reset.userId, action: "auth.reset_completed", entity: "user", entityId: reset.userId });
  redirect("/admin/login?ok=" + encodeURIComponent("Senha redefinida. Entre com a nova senha."));
}
