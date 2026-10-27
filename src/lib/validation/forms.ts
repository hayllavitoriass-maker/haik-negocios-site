import { z } from "zod";
import {
  COMPANY_AGE_OPTIONS,
  INVESTMENT_OPTIONS,
  MAIN_PROBLEM_OPTIONS,
  PERIOD_OPTIONS,
  SEGMENT_OPTIONS,
  TEAM_SIZE_OPTIONS,
  TIMELINE_OPTIONS,
} from "@/content/pages/diagnostic";

/**
 * Schemas compartilhados entre cliente (validação em tempo real) e servidor (fonte da verdade).
 * As mensagens seguem o microcopy oficial.
 */
export const MSG = {
  required: "Esse campo é importante para a gente te atender bem.",
  whatsapp: "Confere o número? Use DDD + número, só com dígitos.",
  email: "Parece que faltou algo nesse e-mail.",
  consent: "Precisamos do seu consentimento para entrar em contato.",
};

export function onlyDigits(value: string) {
  return value.replace(/\D+/g, "");
}

/** Normaliza WhatsApp brasileiro para dígitos com DDI 55: 5586994258011. */
export function normalizeWhatsapp(value: string): string | null {
  let d = onlyDigits(value);
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  // Prefixo de operadora/tronco "0" antes do DDD (ex.: 086 99425-8011).
  if (d.startsWith("0") && (d.length === 11 || d.length === 12)) d = d.slice(1);
  if (d.length === 10 || d.length === 11) {
    const ddd = Number(d.slice(0, 2));
    if (ddd < 11 || ddd > 99) return null;
    return `55${d}`;
  }
  return null;
}

/** Máscara de exibição: (86) 99425-8011 ou (86) 3222-1234. */
export function formatWhatsapp(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const whatsappField = z
  .string({ error: MSG.required })
  .trim()
  .min(1, MSG.required)
  .refine((v) => normalizeWhatsapp(v) !== null, MSG.whatsapp);

const emailField = z.string({ error: MSG.required }).trim().min(1, MSG.required).email(MSG.email).max(200, MSG.email);

const text = (max: number) => z.string({ error: MSG.required }).trim().min(1, MSG.required).max(max, "Texto longo demais.");

const consentField = z
  .unknown()
  .transform((v) => v === true || v === "on" || v === "true")
  .refine((v) => v === true, MSG.consent);

export const leadSchema = z.object({
  name: text(120),
  company: text(160),
  segment: z.enum(SEGMENT_OPTIONS, { error: MSG.required }),
  instagramOrSite: z.string().trim().max(200).optional().or(z.literal("")),
  whatsapp: whatsappField,
  email: emailField,
  companyAge: z.enum(COMPANY_AGE_OPTIONS, { error: MSG.required }),
  teamSize: z.enum(TEAM_SIZE_OPTIONS, { error: MSG.required }),
  mainProblem: z.enum(MAIN_PROBLEM_OPTIONS, { error: MSG.required }),
  problemDetails: z.string().trim().max(1500, "Texto longo demais.").optional().or(z.literal("")),
  monthlyInvestment: z.enum(INVESTMENT_OPTIONS, { error: MSG.required }),
  timeline: z.enum(TIMELINE_OPTIONS, { error: MSG.required }),
  bestPeriod: z.enum(PERIOD_OPTIONS, { error: MSG.required }),
  consent: consentField,
});
export type LeadInput = z.input<typeof leadSchema>;
export type LeadData = z.output<typeof leadSchema>;

export const CONTACT_SUBJECTS = ["Quero um orçamento", "Tenho uma dúvida", "Parceria", "Outro assunto"] as const;

export const contactSchema = z.object({
  name: text(120),
  whatsapp: whatsappField,
  email: z.string().trim().max(200).optional().or(z.literal("")).refine((v) => !v || z.string().email().safeParse(v).success, MSG.email),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  subject: z.enum(CONTACT_SUBJECTS, { error: MSG.required }),
  message: text(3000),
  consent: consentField,
});
export type ContactData = z.output<typeof contactSchema>;

export const subscribeSchema = z.object({
  email: emailField,
  source: z.string().trim().max(60).optional(),
});

/** Converte o erro do Zod em mapa campo → mensagem (primeira mensagem de cada campo). */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
