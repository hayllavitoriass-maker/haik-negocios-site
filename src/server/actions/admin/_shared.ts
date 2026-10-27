import "server-only";
import { z } from "zod";
import { AuthError, requireUserForAction, type ActionResult } from "@/server/auth/guard";
import type { SessionUser } from "@/server/auth/session";
import type { UserRole } from "@/server/db/schema";

/**
 * Utilitários compartilhados pelas Server Actions do painel.
 * Este módulo NÃO tem a diretiva "use server": só exporta helpers.
 */

export const AUTH_MESSAGES: Record<AuthError["code"], string> = {
  unauthenticated: "Sua sessão expirou. Entre novamente.",
  mfa_required: "Confirme o segundo fator para continuar.",
  mfa_enrollment_required: "Ative a verificação em duas etapas para continuar.",
  forbidden: "Você não tem permissão para esta ação.",
};

export function isRedirectError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "digest" in err && String((err as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT");
}

/**
 * Executa `fn` com o usuário autenticado (e autorizado pelo papel), convertendo
 * erros de autenticação e falhas inesperadas em `ActionResult` legível.
 * Erros de redirect do Next são propagados.
 */
export async function withUser<T>(
  opts: { role?: UserRole },
  fn: (user: SessionUser) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  let user: SessionUser;
  try {
    user = await requireUserForAction(opts);
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: AUTH_MESSAGES[err.code] };
    throw err;
  }
  try {
    return await fn(user);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("[admin action] falha", err);
    return { ok: false, error: "Não foi possível concluir. Tente novamente." };
  }
}

export function formToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

export function formToObjectWithArrays(formData: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v !== "string") continue;
    if (k.endsWith("[]")) {
      const key = k.slice(0, -2);
      const cur = out[key];
      out[key] = Array.isArray(cur) ? [...cur, v] : [v];
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

export const uuidSchema = z.string().uuid("Identificador inválido.");

/** Checkbox HTML: ausente (desmarcado) ou "on". `.optional()` é obrigatório no Zod 4 para a chave poder faltar. */
export const checkboxSchema = z
  .union([z.literal("on"), z.literal("true"), z.literal("1"), z.literal(""), z.literal("false"), z.boolean()])
  .optional()
  .transform((v) => v === true || v === "on" || v === "true" || v === "1");

export function parseJsonField(value: unknown): unknown {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

/** Monta uma query string com mensagem de retorno para a página (flash). */
export function withFlash(path: string, kind: "ok" | "erro", message: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${kind}=${encodeURIComponent(message)}`;
}
