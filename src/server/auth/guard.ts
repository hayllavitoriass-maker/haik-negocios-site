import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionUser } from "./session";
import type { UserRole } from "@/server/db/schema";

export class AuthError extends Error {
  constructor(
    public code: "unauthenticated" | "mfa_required" | "mfa_enrollment_required" | "forbidden",
    message?: string,
  ) {
    super(message ?? code);
  }
}

/**
 * Regras de acesso do painel:
 * 1. Precisa de sessão válida.
 * 2. A sessão precisa ter o segundo fator confirmado (se o usuário tem MFA).
 * 3. Administradores são obrigados a ativar MFA antes de usar o painel.
 * 4. `role` restringe a administradores quando informado.
 */
export async function authorize(opts: { role?: UserRole } = {}): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new AuthError("unauthenticated");
  const { user } = session;
  if (user.mfaEnabled && !session.mfaVerified) throw new AuthError("mfa_required");
  if (user.role === "admin" && !user.mfaEnabled) throw new AuthError("mfa_enrollment_required");
  if (opts.role === "admin" && user.role !== "admin") throw new AuthError("forbidden");
  return user;
}

/** Para páginas (Server Components): redireciona em vez de lançar. */
export async function requireUser(opts: { role?: UserRole; allowMfaEnrollment?: boolean } = {}): Promise<SessionUser> {
  try {
    return await authorize(opts);
  } catch (err) {
    if (!(err instanceof AuthError)) throw err;
    switch (err.code) {
      case "unauthenticated":
        redirect("/admin/login");
      case "mfa_required":
        redirect("/admin/login/mfa");
      case "mfa_enrollment_required": {
        if (opts.allowMfaEnrollment) {
          const session = await getSession();
          if (session) return session.user;
        }
        redirect("/admin/seguranca/ativar-mfa");
      }
      case "forbidden":
        redirect("/admin?erro=sem-permissao");
    }
  }
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Para Server Actions: devolve um erro estruturado em vez de redirecionar. */
export async function requireUserForAction(opts: { role?: UserRole } = {}): Promise<SessionUser> {
  return authorize(opts);
}

export function actionError(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

export const EDITOR_ALLOWED = new Set(["content", "projects", "posts", "testimonials", "media"]);
