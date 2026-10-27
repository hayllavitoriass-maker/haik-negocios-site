"use client";

import { useActionState, useEffect, useRef, useState, type FocusEvent, type FormEvent } from "react";
import type { z } from "zod";
import { submitDiagnostic, type FormState } from "@/server/actions/public-forms";
import { formatWhatsapp, leadSchema } from "@/lib/validation/forms";
import {
  COMPANY_AGE_OPTIONS,
  INVESTMENT_OPTIONS,
  MAIN_PROBLEM_OPTIONS,
  PERIOD_OPTIONS,
  SEGMENT_OPTIONS,
  TEAM_SIZE_OPTIONS,
  TIMELINE_OPTIONS,
  type DiagnosticContent,
} from "@/content/pages/diagnostic";
import { AntiSpamFields, Checkbox, ChoiceGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { ROUTES } from "@/content/site";
import { cn } from "@/lib/cn";
import { fieldError, focusFirstInvalid, formErrors, INTERNAL_FIELDS, normalizeServerErrors, splitPrivacy, type Errors } from "./validation";

type Props = {
  content: DiagnosticContent["form"];
  sending: string;
  /** Caminho da página de origem (gravado no lead). */
  source: string;
  className?: string;
};

const initial: FormState = { status: "idle" };

/** Marcador visual de bloco do formulário (apenas ritmo; não é lido por leitores de tela). */
function StepChip({ n }: { n: string }) {
  return (
    <span aria-hidden="true" className="mono inline-flex w-fit items-center rounded-xs bg-red px-[7px] pt-[6px] pb-[5px] text-white">
      {n}
    </span>
  );
}
const shape = leadSchema.shape as unknown as Record<string, z.ZodType>;

/**
 * Formulário do diagnóstico gratuito. Validação em tempo real com o mesmo schema Zod do
 * servidor (blur/change), máscara de WhatsApp, erros do servidor por campo e envio via
 * server action (redireciona para /obrigado no sucesso).
 */
export function DiagnosticForm({ content, sending, source, className }: Props) {
  const [state, formAction, pending] = useActionState(submitDiagnostic, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const touched = useRef(new Set<string>());
  const [clientErrors, setClientErrors] = useState<Errors>({});
  const [serverErrors, setServerErrors] = useState<Errors>({});
  const [whatsapp, setWhatsapp] = useState("");

  // Quando o servidor devolve um novo estado, os erros por campo substituem os do cliente
  // (ajuste feito durante a renderização, sem efeito em cascata).
  const [seenState, setSeenState] = useState<FormState>(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.status === "error") {
      setServerErrors(normalizeServerErrors(state.fieldErrors));
      setClientErrors({});
      if (state.values?.whatsapp) setWhatsapp(formatWhatsapp(state.values.whatsapp));
    }
  }

  useEffect(() => {
    if (state.status === "error" && state.fieldErrors && formRef.current) focusFirstInvalid(formRef.current);
  }, [state]);

  const errorOf = (name: string) => clientErrors[name] ?? serverErrors[name];

  const validate = (name: string) => {
    const form = formRef.current;
    if (!form) return;
    const value = new FormData(form).get(name);
    const err = fieldError(shape, name, value);
    setClientErrors((prev) => ({ ...prev, [name]: err }));
    setServerErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const onBlur = (e: FocusEvent<HTMLFormElement>) => {
    const target = e.target as unknown as HTMLInputElement;
    const name = target?.name;
    if (!name || INTERNAL_FIELDS.has(name)) return;
    touched.current.add(name);
    validate(name);
  };

  const onChange = (e: FormEvent<HTMLFormElement>) => {
    const target = e.target as unknown as HTMLInputElement;
    const name = target?.name;
    if (!name || INTERNAL_FIELDS.has(name)) return;
    const immediate = target.type === "radio" || target.type === "checkbox" || target.tagName === "SELECT";
    if (immediate || touched.current.has(name)) validate(name);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (pending) {
      e.preventDefault();
      return;
    }
    const errors = formErrors(leadSchema, new FormData(e.currentTarget));
    if (!errors) return;
    e.preventDefault();
    Object.keys(errors).forEach((k) => touched.current.add(k));
    setClientErrors(errors);
    setServerErrors({});
    focusFirstInvalid(e.currentTarget);
  };

  const v = state.values ?? {};
  const consentParts = splitPrivacy(content.consent);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      onBlur={onBlur}
      onChange={onChange}
      noValidate
      className={cn("relative grid gap-8", className)}
      aria-busy={pending}
    >
      <AntiSpamFields />
      <input type="hidden" name="_source" value={source} />

      <div className="grid gap-5">
        <StepChip n="01" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label={content.name} name="name" autoComplete="name" defaultValue={v.name} error={errorOf("name")} />
          <Input label={content.company} name="company" autoComplete="organization" defaultValue={v.company} error={errorOf("company")} />
        </div>
        <Select label={content.segment} name="segment" options={SEGMENT_OPTIONS} defaultValue={v.segment ?? ""} error={errorOf("segment")} />
        <Input
          label={content.instagramOrSite}
          name="instagramOrSite"
          optional
          autoComplete="url"
          inputMode="url"
          defaultValue={v.instagramOrSite}
          error={errorOf("instagramOrSite")}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label={content.whatsapp}
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(00) 00000-0000"
            value={whatsapp}
            onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
            error={errorOf("whatsapp")}
          />
          <Input label={content.email} name="email" type="email" inputMode="email" autoComplete="email" defaultValue={v.email} error={errorOf("email")} />
        </div>
      </div>

      <div className="grid gap-6 border-t border-[var(--hairline)] pt-8">
        <StepChip n="02" />
        <ChoiceGroup label={content.companyAge} name="companyAge" options={COMPANY_AGE_OPTIONS} defaultValue={v.companyAge} error={errorOf("companyAge")} />
        <ChoiceGroup label={content.teamSize} name="teamSize" options={TEAM_SIZE_OPTIONS} columns={4} defaultValue={v.teamSize} error={errorOf("teamSize")} />
        <ChoiceGroup label={content.mainProblem} name="mainProblem" options={MAIN_PROBLEM_OPTIONS} defaultValue={v.mainProblem} error={errorOf("mainProblem")} />
        <Textarea label={content.problemDetails} name="problemDetails" optional rows={3} defaultValue={v.problemDetails} error={errorOf("problemDetails")} />
      </div>

      <div className="grid gap-6 border-t border-[var(--hairline)] pt-8">
        <StepChip n="03" />
        <ChoiceGroup
          label={content.monthlyInvestment}
          name="monthlyInvestment"
          options={INVESTMENT_OPTIONS}
          defaultValue={v.monthlyInvestment}
          error={errorOf("monthlyInvestment")}
        />
        <ChoiceGroup label={content.timeline} name="timeline" options={TIMELINE_OPTIONS} columns={3} defaultValue={v.timeline} error={errorOf("timeline")} />
        <ChoiceGroup label={content.bestPeriod} name="bestPeriod" options={PERIOD_OPTIONS} columns={3} defaultValue={v.bestPeriod} error={errorOf("bestPeriod")} />
      </div>

      <div className="grid gap-5 border-t border-[var(--hairline)] pt-6">
        <Checkbox
          name="consent"
          defaultChecked={v.consent === "on"}
          error={errorOf("consent")}
          label={
            consentParts ? (
              <>
                {consentParts[0]}
                <TransitionLink href={ROUTES.privacidade} target="_blank" className="font-medium text-red underline underline-offset-4">
                  {consentParts[1]}
                </TransitionLink>
                {consentParts[2]}
              </>
            ) : (
              content.consent
            )
          }
        />

        {state.status === "error" && state.message && (
          <p role="alert" className="rounded-xs border-l-[3px] border-red bg-red-50 px-4 py-3 text-[14px] leading-[1.5] text-red-700">
            {state.message}
          </p>
        )}

        <Button type="submit" size="lg" full arrow disabled={pending} aria-disabled={pending}>
          {pending ? sending : content.submit}
        </Button>
        <p className="text-center text-small text-grey-500" aria-live="polite">
          {content.afterSubmit}
        </p>
      </div>
    </form>
  );
}
