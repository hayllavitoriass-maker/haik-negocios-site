import type { z } from "zod";
import { fieldErrorsOf, MSG } from "@/lib/validation/forms";

type Shape = Record<string, z.ZodType>;
export type Errors = Record<string, string | undefined>;

/** Campos de controle que nunca são validados nem exibidos. */
export const INTERNAL_FIELDS = new Set(["website", "_t", "_source", "source"]);

/** Valida um campo isolado com o mesmo schema do servidor. */
export function fieldError(shape: Shape, name: string, value: FormDataEntryValue | null): string | undefined {
  if (name === "consent") return value ? undefined : MSG.consent;
  const field = shape[name];
  if (!field) return undefined;
  const result = field.safeParse(value ?? undefined);
  return result.success ? undefined : (result.error.issues[0]?.message ?? MSG.required);
}

/** Valida o formulário inteiro; devolve o mapa campo → mensagem oficial. */
export function formErrors(schema: z.ZodType, formData: FormData): Errors | null {
  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") values[k] = v;
  const parsed = schema.safeParse(values);
  if (parsed.success) return null;
  const errors: Errors = fieldErrorsOf(parsed.error);
  if (errors.consent) errors.consent = MSG.consent;
  return errors;
}

/** Normaliza erros vindos do servidor (consentimento usa sempre a mensagem oficial). */
export function normalizeServerErrors(errors?: Record<string, string>): Errors {
  if (!errors) return {};
  const out: Errors = { ...errors };
  if (out.consent) out.consent = MSG.consent;
  return out;
}

export function focusFirstInvalid(form: HTMLFormElement) {
  window.requestAnimationFrame(() => {
    const el = form.querySelector<HTMLElement>('[aria-invalid="true"] input, [aria-invalid="true"]');
    el?.focus({ preventScroll: false });
  });
}

/** Divide o texto do consentimento para linkar "Política de Privacidade". */
export function splitPrivacy(text: string, needle = "Política de Privacidade"): [string, string, string] | null {
  const idx = text.indexOf(needle);
  if (idx === -1) return null;
  return [text.slice(0, idx), needle, text.slice(idx + needle.length)];
}
