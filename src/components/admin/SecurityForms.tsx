"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ActionResult } from "@/server/auth/guard";
import { changePassword, confirmMfaEnrollment, disableMfa, regenerateRecoveryCodes } from "@/server/actions/admin/security";
import { Alert, Input, buttonClass } from "./ui";
import { CopyButton, SubmitButton } from "./client";

export function ChangePasswordForm() {
  const [state, action] = useActionState<ActionResult | undefined, FormData>(changePassword, undefined);
  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};
  return (
    <form action={action} className="grid gap-4">
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}
      {state?.ok && <Alert tone="green">{state.message}</Alert>}
      <Input label="Senha atual" name="current" type="password" autoComplete="current-password" required error={errors.current} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nova senha" name="password" type="password" autoComplete="new-password" required hint="Mínimo de 12 caracteres." error={errors.password} />
        <Input label="Confirmar nova senha" name="confirm" type="password" autoComplete="new-password" required error={errors.confirm} />
      </div>
      <div>
        <SubmitButton pendingText="Alterando...">Alterar senha</SubmitButton>
      </div>
    </form>
  );
}

export function RecoveryCodes({ codes }: { codes: string[] }) {
  return (
    <div className="rounded-xs bg-grey-50 p-4">
      <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-grey-500">Códigos de recuperação (uso único)</p>
      <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-[14px]">
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <div className="mt-3">
        <CopyButton text={codes.join("\n")} label="Copiar códigos" />
      </div>
    </div>
  );
}

export function MfaConfirmForm({ alreadyEnabled = false }: { alreadyEnabled?: boolean }) {
  const [state, action] = useActionState<ActionResult<{ codes: string[] }> | undefined, FormData>(confirmMfaEnrollment, undefined);
  if (state?.ok && state.data) {
    return (
      <div className="grid gap-4">
        <Alert tone="green" title="MFA ativado">
          {state.message}
        </Alert>
        <RecoveryCodes codes={state.data.codes} />
        <Link href="/admin" className={buttonClass("primary")}>
          Ir para o painel
        </Link>
      </div>
    );
  }
  if (alreadyEnabled) {
    return (
      <div className="grid gap-3">
        <Alert tone="green">A verificação em duas etapas já está ativa. Gerencie códigos de recuperação em Segurança.</Alert>
        <Link href="/admin/seguranca" className={buttonClass("secondary")}>
          Ir para Segurança
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="grid gap-3">
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}
      <Input label="Código de 6 dígitos do aplicativo" name="code" inputMode="numeric" autoComplete="one-time-code" required placeholder="000000" />
      <div>
        <SubmitButton pendingText="Confirmando...">Confirmar e ativar</SubmitButton>
      </div>
    </form>
  );
}

export function RegenerateCodesForm() {
  const [state, action] = useActionState<ActionResult<{ codes: string[] }> | undefined, FormData>(regenerateRecoveryCodes, undefined);
  if (state?.ok && state.data) {
    return (
      <div className="grid gap-3">
        <Alert tone="green">{state.message}</Alert>
        <RecoveryCodes codes={state.data.codes} />
      </div>
    );
  }
  return (
    <form action={action} className="grid gap-3">
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}
      <Input label="Confirme com o código do aplicativo" name="code" inputMode="numeric" autoComplete="one-time-code" required placeholder="000000" />
      <div>
        <SubmitButton variant="secondary" pendingText="Gerando...">
          Gerar novos códigos
        </SubmitButton>
      </div>
    </form>
  );
}

export function DisableMfaForm() {
  const [state, action] = useActionState<ActionResult | undefined, FormData>(disableMfa, undefined);
  if (state?.ok) return <Alert tone="green">{state.message}</Alert>;
  return (
    <form action={action} className="grid gap-3">
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}
      <Input label="Confirme com o código do aplicativo" name="code" inputMode="numeric" autoComplete="one-time-code" required placeholder="000000" />
      <div>
        <SubmitButton variant="danger" pendingText="Desativando...">
          Desativar MFA
        </SubmitButton>
      </div>
    </form>
  );
}
