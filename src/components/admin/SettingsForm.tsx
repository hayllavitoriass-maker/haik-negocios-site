"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/server/auth/guard";
import type { SiteSettings } from "@/content/site";
import { saveSettings } from "@/server/actions/admin/settings";
import { Alert, Checkbox, Divider, Input, Textarea } from "./ui";
import { SubmitButton, Toast } from "./client";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [state, action] = useActionState<ActionResult | undefined, FormData>(saveSettings, undefined);
  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};
  return (
    <form action={action} className="grid gap-5">
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}
      <Toast result={state} />

      <h2 className="text-[15px] font-semibold">Contato</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="WhatsApp (só dígitos, com 55)" name="whatsappNumber" defaultValue={initial.whatsappNumber} inputMode="numeric" error={errors.whatsappNumber} hint="Ex.: 5586994258011" />
        <Input label="WhatsApp (como aparece no site)" name="whatsappDisplay" defaultValue={initial.whatsappDisplay} error={errors.whatsappDisplay} hint="Ex.: (86) 99425-8011" />
        <Input label="Instagram (@)" name="instagramHandle" defaultValue={initial.instagramHandle} error={errors.instagramHandle} />
        <Input label="Instagram (URL)" name="instagramUrl" type="url" defaultValue={initial.instagramUrl} error={errors.instagramUrl} />
        <Input label="E-mail de contato" name="email" type="email" defaultValue={initial.email} optional error={errors.email} />
        <Input label="Horário de atendimento" name="businessHours" defaultValue={initial.businessHours} optional error={errors.businessHours} hint="Ex.: 9h às 18h. Entra no texto “Segunda a sexta, das {HORARIO}”." />
        <Input label="Tempo de resposta" name="responseTime" defaultValue={initial.responseTime} error={errors.responseTime} />
      </div>

      <Divider />
      <h2 className="text-[15px] font-semibold">Empresa</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="CNPJ" name="cnpj" defaultValue={initial.cnpj} optional error={errors.cnpj} hint="Aparece no rodapé e nas páginas legais quando preenchido." />
        <Input label="Cidade" name="city" defaultValue={initial.city} error={errors.city} />
      </div>
      <Checkbox label="Citar a cidade no site (rodapé e página Sobre)" name="mentionCity" defaultChecked={initial.mentionCity} />

      <Divider />
      <h2 className="text-[15px] font-semibold">SEO padrão</h2>
      <Input label="Título padrão" name="seoDefaultTitle" defaultValue={initial.seoDefaultTitle} maxLength={120} error={errors.seoDefaultTitle} />
      <Textarea label="Descrição padrão" name="seoDefaultDescription" defaultValue={initial.seoDefaultDescription} maxLength={300} error={errors.seoDefaultDescription} />

      <Divider />
      <h2 className="text-[15px] font-semibold">Comportamentos</h2>
      <Checkbox label="Mostrar aviso de cookies" name="cookieBannerEnabled" defaultChecked={initial.cookieBannerEnabled} />
      <Checkbox label="Mostrar pop-up de saída (checklist)" name="exitPopupEnabled" defaultChecked={initial.exitPopupEnabled} />

      <div className="sticky bottom-0 -mx-4 flex items-center gap-2 border-t border-grey-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <SubmitButton>Salvar configurações</SubmitButton>
      </div>
    </form>
  );
}
