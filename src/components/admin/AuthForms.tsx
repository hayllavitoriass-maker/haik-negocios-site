"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ActionResult } from "@/server/auth/guard";
import { login, requestPasswordReset, resetPassword, setupFirstAdmin, verifyMfa } from "@/server/actions/admin/auth";
import { Alert, Input } from "./ui";
import { SubmitButton } from "./client";

type Action = (prev: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;

function useAction(action: Action) {
  return useActionState(action, undefined);
}

export function LoginForm({ next, ok }: { next?: string; ok?: string }) {
  const [state, action] = useAction(login);
  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};
  return (
    <form action={action} className="grid gap-4">
      <h1 className="font-sans text-[20px] font-semibold">Entrar</h1>
      {ok && !state && <Alert tone="green">{ok}</Alert>}
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}
      {next && <input type="hidden" name="next" value={next} />}
      <Input label="E-mail" name="email" type="email" autoComplete="username" required error={errors.email} />
      <Input label="Senha" name="password" type="password" autoComplete="current-password" required error={errors.password} />
      <SubmitButton pendingText="Entrando...">Entrar</SubmitButton>
      <Link href="/admin/recuperar" className="text-center text-[13px] text-grey-500 underline-offset-2 hover:underline">
        Esqueci minha senha
      </Link>
    </form>
  );
}

export function MfaForm({ next }: { next?: string }) {
  const [state, action] = useAction(verifyMfa);
  return (
    <form action={action} className="grid gap-4">
      <div>
        <h1 className="font-sans text-[20px] font-semibold">Verificação em duas etapas</h1>
        <p className="mt-1 text-[13px] text-grey-500">Digite o código do seu aplicativo autenticador ou um código de recuperação.</p>
      </div>
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}
      {next && <input type="hidden" name="next" value={next} />}
      <Input label="Código" name="code" inputMode="numeric" autoComplete="one-time-code" autoFocus required placeholder="000000" />
      <SubmitButton pendingText="Verificando...">Confirmar</SubmitButton>
    </form>
  );
}

export function SetupForm() {
  const [state, action] = useAction(setupFirstAdmin);
  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};
  return (
    <form action={action} className="grid gap-4">
      <div>
        <h1 className="font-sans text-[20px] font-semibold">Configuração inicial</h1>
        <p className="mt-1 text-[13px] text-grey-500">Crie o primeiro administrador. Esta página desaparece depois do primeiro usuário.</p>
      </div>
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}
      <Input label="Token de configuração (ADMIN_SETUP_TOKEN)" name="token" type="password" autoComplete="off" required error={errors.token} />
      <Input label="Nome" name="name" autoComplete="name" required error={errors.name} />
      <Input label="E-mail" name="email" type="email" autoComplete="username" required error={errors.email} />
      <Input label="Senha" name="password" type="password" autoComplete="new-password" required hint="Mínimo de 12 caracteres." error={errors.password} />
      <Input label="Confirmar senha" name="confirm" type="password" autoComplete="new-password" required error={errors.confirm} />
      <SubmitButton pendingText="Criando...">Criar administrador</SubmitButton>
    </form>
  );
}

export function RecoverForm() {
  const [state, action] = useAction(requestPasswordReset);
  if (state?.ok) {
    return (
      <div className="grid gap-4">
        <h1 className="font-sans text-[20px] font-semibold">Verifique seu e-mail</h1>
        <Alert tone="green">{state.message}</Alert>
        <Link href="/admin/login" className="text-center text-[13px] text-grey-500 underline-offset-2 hover:underline">
          Voltar ao login
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="grid gap-4">
      <div>
        <h1 className="font-sans text-[20px] font-semibold">Recuperar acesso</h1>
        <p className="mt-1 text-[13px] text-grey-500">Informe o e-mail cadastrado. Enviaremos um link válido por 1 hora.</p>
      </div>
      <Input label="E-mail" name="email" type="email" autoComplete="username" required />
      <SubmitButton pendingText="Enviando...">Enviar link</SubmitButton>
      <Link href="/admin/login" className="text-center text-[13px] text-grey-500 underline-offset-2 hover:underline">
        Voltar ao login
      </Link>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useAction(resetPassword);
  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};
  return (
    <form action={action} className="grid gap-4">
      <h1 className="font-sans text-[20px] font-semibold">Nova senha</h1>
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}
      <input type="hidden" name="token" value={token} />
      <Input label="Nova senha" name="password" type="password" autoComplete="new-password" required hint="Mínimo de 12 caracteres." error={errors.password} />
      <Input label="Confirmar senha" name="confirm" type="password" autoComplete="new-password" required error={errors.confirm} />
      <SubmitButton pendingText="Salvando...">Redefinir senha</SubmitButton>
    </form>
  );
}
