"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/server/auth/guard";
import { createUserAction } from "@/server/actions/admin/users";
import { Alert, Input, Select } from "./ui";
import { CopyButton, SubmitButton } from "./client";

export function CreateUserForm() {
  const [state, action] = useActionState<ActionResult<{ password: string; email: string }> | undefined, FormData>(createUserAction, undefined);
  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};
  if (state?.ok && state.data) {
    return (
      <div className="grid gap-3">
        <Alert tone="green" title="Usuário criado">
          {state.message}
        </Alert>
        <div className="rounded-xs bg-grey-50 p-4">
          <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-grey-500">Acesso temporário</p>
          <p className="mt-1 text-[14px]">
            E-mail: <span className="font-mono">{state.data.email}</span>
          </p>
          <p className="text-[14px]">
            Senha: <span className="font-mono">{state.data.password}</span>
          </p>
          <div className="mt-2">
            <CopyButton text={`E-mail: ${state.data.email}\nSenha temporária: ${state.data.password}`} label="Copiar acesso" />
          </div>
        </div>
        <p className="text-[12px] text-grey-500">Peça para a pessoa trocar a senha em Segurança no primeiro acesso. Administradores precisam ativar o MFA antes de usar o painel.</p>
      </div>
    );
  }
  return (
    <form action={action} className="grid gap-4">
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome" name="name" required maxLength={120} error={errors.name} />
        <Input label="E-mail" name="email" type="email" required maxLength={200} error={errors.email} />
        <Select label="Papel" name="role" defaultValue="editor" options={[{ value: "editor", label: "Editor (conteúdo, mídia, projetos, blog, depoimentos)" }, { value: "admin", label: "Administrador (tudo, exige MFA)" }]} />
        <Input label="Senha temporária" name="password" type="text" autoComplete="off" optional hint="Deixe em branco para gerar uma senha aleatória." error={errors.password} />
      </div>
      <div>
        <SubmitButton pendingText="Criando...">Criar usuário</SubmitButton>
      </div>
    </form>
  );
}
