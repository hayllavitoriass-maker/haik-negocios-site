"use client";

import { useActionState, useId } from "react";
import { subscribeChecklist, type FormState } from "@/server/actions/public-forms";
import type { contentsContent } from "@/content/pages/misc";
import { AntiSpamFields } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type Props = { content: (typeof contentsContent)["capture"]; source: string; sending: string; className?: string };

const initial: FormState = { status: "idle" };

/** Captura do checklist: um campo de e-mail, mensagem de sucesso oficial. */
export function ChecklistForm({ content, source, sending, className }: Props) {
  const [state, formAction, pending] = useActionState(subscribeChecklist, initial);
  const id = useId();
  const error = state.status === "error" ? (state.fieldErrors?.email ?? state.message) : undefined;

  return (
    <div className={cn("relative isolate overflow-hidden rounded-md bg-ink-900 p-6 text-white sm:p-8 chapter--dark", className)}>
      <div aria-hidden="true" className="grid-bg absolute inset-0 opacity-40 [mask-image:linear-gradient(90deg,#000,transparent_70%)]" />
      <div className="relative grid gap-6 desk:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] desk:items-center">
        <div className="grid gap-3">
          <span className="grid size-10 place-items-center rounded-xs bg-red text-white" aria-hidden="true">
            <Icon name="download" className="size-5" />
          </span>
          <h2 className="text-card">{content.title}</h2>
          <p className="font-display text-[18px] font-medium text-grey-300">{content.body}</p>
        </div>
        {state.status === "success" ? (
          <p role="status" className="glass-panel is-on flex items-start gap-3 p-5 text-[15px] leading-[1.5]">
            <Icon name="check" className="mt-[2px] size-4 shrink-0 text-red-300" strokeWidth={2.5} />
            {content.success}
          </p>
        ) : (
          <form action={formAction} noValidate aria-busy={pending} className="grid gap-3">
            <AntiSpamFields />
            <input type="hidden" name="source" value={source} />
            <label htmlFor={id} className="visually-hidden">
              {content.placeholder}
            </label>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                id={id}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder={content.placeholder}
                defaultValue={state.values?.email}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className="h-12 w-full rounded-xs bg-white/[.06] px-4 text-[16px] text-white hairline-dark placeholder:text-grey-400 focus:outline-none focus:shadow-[inset_0_0_0_2px_var(--color-red)]"
              />
              <Button type="submit" disabled={pending} arrow className="h-12">
                {pending ? sending : content.cta}
              </Button>
            </div>
            {error && (
              <p id={`${id}-error`} role="alert" className="text-[13px] text-red-300">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
