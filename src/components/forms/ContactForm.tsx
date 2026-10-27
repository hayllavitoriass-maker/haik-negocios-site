"use client";

import { useActionState, useEffect, useRef, useState, type FocusEvent, type FormEvent } from "react";
import type { z } from "zod";
import { submitContact, type FormState } from "@/server/actions/public-forms";
import { CONTACT_SUBJECTS, contactSchema, formatWhatsapp } from "@/lib/validation/forms";
import type { contactContent } from "@/content/pages/misc";
import { AntiSpamFields, Checkbox, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Icon } from "@/components/ui/icons";
import { ROUTES } from "@/content/site";
import { cn } from "@/lib/cn";
import { fieldError, focusFirstInvalid, formErrors, INTERNAL_FIELDS, normalizeServerErrors, splitPrivacy, type Errors } from "./validation";

type Props = { content: (typeof contactContent)["form"]; sending: string; className?: string };

const initial: FormState = { status: "idle" };
const shape = contactSchema.shape as unknown as Record<string, z.ZodType>;

/** Formulário de contato: mesma validação do servidor, estados de sucesso e erro oficiais. */
export function ContactForm({ content, sending, className }: Props) {
  const [state, formAction, pending] = useActionState(submitContact, initial);
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
    const err = fieldError(shape, name, new FormData(form).get(name));
    setClientErrors((prev) => ({ ...prev, [name]: err }));
    setServerErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const onBlur = (e: FocusEvent<HTMLFormElement>) => {
    const name = (e.target as unknown as HTMLInputElement)?.name;
    if (!name || INTERNAL_FIELDS.has(name)) return;
    touched.current.add(name);
    validate(name);
  };

  const onChange = (e: FormEvent<HTMLFormElement>) => {
    const target = e.target as unknown as HTMLInputElement;
    const name = target?.name;
    if (!name || INTERNAL_FIELDS.has(name)) return;
    const immediate = target.type === "checkbox" || target.tagName === "SELECT";
    if (immediate || touched.current.has(name)) validate(name);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (pending) {
      e.preventDefault();
      return;
    }
    const errors = formErrors(contactSchema, new FormData(e.currentTarget));
    if (!errors) return;
    e.preventDefault();
    Object.keys(errors).forEach((k) => touched.current.add(k));
    setClientErrors(errors);
    setServerErrors({});
    focusFirstInvalid(e.currentTarget);
  };

  if (state.status === "success") {
    return (
      <div role="status" className={cn("grid gap-4 rounded-md bg-white p-8 shadow-[var(--shadow-card-light)] hairline-light", className)}>
        <span className="grid size-11 place-items-center rounded-xs bg-red text-white" aria-hidden="true">
          <Icon name="check" className="size-5" strokeWidth={2.5} />
        </span>
        <h3 className="text-card">{content.successTitle}</h3>
        <p className="max-w-[48ch] text-[16px] leading-[1.6] text-grey-600">{content.successBody}</p>
      </div>
    );
  }

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
      aria-busy={pending}
      className={cn("relative grid gap-5", className)}
    >
      <AntiSpamFields />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label={content.name} name="name" autoComplete="name" defaultValue={v.name} error={errorOf("name")} />
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
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label={content.email} name="email" type="email" inputMode="email" autoComplete="email" optional defaultValue={v.email} error={errorOf("email")} />
        <Input label={content.company} name="company" autoComplete="organization" optional defaultValue={v.company} error={errorOf("company")} />
      </div>
      <Select label={content.subject} name="subject" options={CONTACT_SUBJECTS} defaultValue={v.subject ?? ""} error={errorOf("subject")} />
      <Textarea label={content.message} name="message" rows={5} placeholder={content.messagePlaceholder} defaultValue={v.message} error={errorOf("message")} />
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
      {state.status === "error" && (
        <p role="alert" className="rounded-xs border-l-[3px] border-red bg-red-50 px-4 py-3 text-[14px] leading-[1.5] text-red-700">
          {state.fieldErrors ? state.message : (state.message ?? content.error)}
        </p>
      )}
      <Button type="submit" size="lg" arrow disabled={pending} className="w-full sm:w-fit">
        {pending ? sending : content.submit}
      </Button>
    </form>
  );
}
