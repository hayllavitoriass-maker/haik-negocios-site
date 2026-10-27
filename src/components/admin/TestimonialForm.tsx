"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/server/auth/guard";
import { saveTestimonial } from "@/server/actions/admin/testimonials";
import { Alert, Checkbox, Input, Textarea } from "./ui";
import { SubmitButton, Toast } from "./client";
import { MediaPicker, type PickerMedia } from "./media/MediaPicker";

export type TestimonialFormData = {
  id?: string;
  name: string;
  company: string;
  role: string;
  city: string;
  photo: PickerMedia | null;
  quote: string;
  authorized: boolean;
  sortOrder: number;
};

export function TestimonialForm({ initial }: { initial: TestimonialFormData }) {
  const [state, action] = useActionState<ActionResult<{ id: string }> | undefined, FormData>(saveTestimonial, undefined);
  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};
  return (
    <form action={action} className="grid gap-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}
      <Toast result={state} />
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Nome" name="name" defaultValue={initial.name} required maxLength={120} error={errors.name} />
        <Input label="Empresa" name="company" defaultValue={initial.company} maxLength={160} optional error={errors.company} />
        <Input label="Cargo ou profissão" name="role" defaultValue={initial.role} maxLength={120} optional error={errors.role} />
        <Input label="Cidade" name="city" defaultValue={initial.city} maxLength={120} optional error={errors.city} />
      </div>
      <Textarea label="Depoimento" name="quote" defaultValue={initial.quote} required maxLength={1500} error={errors.quote} hint="Texto exatamente como autorizado pela pessoa." />
      <div className="grid gap-5 md:grid-cols-2">
        <MediaPicker name="photoMediaId" label="Foto" initial={initial.photo} defaultCategory="institucional" />
        <Input label="Ordem" name="sortOrder" type="number" min={0} max={9999} defaultValue={initial.sortOrder} hint="Menor aparece primeiro." error={errors.sortOrder} />
      </div>
      <Checkbox label="Tenho autorização por escrito desta pessoa para publicar o depoimento com nome e foto." name="authorized" defaultChecked={initial.authorized} hint="Sem esta marcação, o depoimento não pode ser publicado." />
      <div className="sticky bottom-0 -mx-4 flex items-center gap-2 border-t border-grey-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <SubmitButton>{initial.id ? "Salvar" : "Criar rascunho"}</SubmitButton>
      </div>
    </form>
  );
}
