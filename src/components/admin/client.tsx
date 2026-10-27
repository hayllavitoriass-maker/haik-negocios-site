"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/server/auth/guard";
import { cn } from "@/lib/cn";
import { Button, buttonClass, type ButtonVariant } from "./ui";

/** Botão de envio que mostra estado pendente do formulário (useFormStatus). */
export function SubmitButton({
  children,
  pendingText = "Salvando...",
  variant = "primary",
  size = "md",
  className,
  name,
  value,
  formAction,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  name?: string;
  value?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} className={className} disabled={pending} name={name} value={value} formAction={formAction}>
      {pending ? pendingText : children}
    </Button>
  );
}

/**
 * Caixa de confirmação com <dialog> nativo. O botão abre o diálogo; confirmar envia
 * o formulário (action do servidor) com os campos ocultos informados.
 */
export function ConfirmForm({
  action,
  fields = {},
  title,
  description,
  confirmLabel = "Confirmar",
  variant = "danger",
  size = "md",
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields?: Record<string, string>;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={() => ref.current?.showModal()}>
        {children}
      </Button>
      <Dialog ref={ref} title={title}>
        {description && <div className="text-[14px] text-grey-600">{description}</div>}
        <form action={action} className="mt-5 flex justify-end gap-2" onSubmit={() => ref.current?.close()}>
          {Object.entries(fields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <Button type="button" variant="secondary" onClick={() => ref.current?.close()}>
            Cancelar
          </Button>
          <SubmitButton variant={variant === "danger" ? "danger" : "primary"} pendingText="Aguarde...">
            {confirmLabel}
          </SubmitButton>
        </form>
      </Dialog>
    </>
  );
}

export function Dialog({ ref, title, children, wide }: { ref: React.RefObject<HTMLDialogElement | null>; title: string; children: ReactNode; wide?: boolean }) {
  return (
    <dialog
      ref={ref}
      className={cn(
        "m-auto w-[calc(100%-32px)] rounded-xs bg-white p-0 text-ink shadow-[0_24px_60px_rgba(23,23,23,0.18)] backdrop:bg-[rgba(23,23,23,0.45)]",
        wide ? "max-w-4xl" : "max-w-md",
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-sans text-[16px] font-semibold">{title}</h2>
          <button type="button" className="-mr-1 -mt-1 grid size-8 place-items-center rounded-xs text-grey-500 hover:bg-grey-100" aria-label="Fechar" onClick={() => ref.current?.close()}>
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </dialog>
  );
}

/**
 * Mensagem temporária (toast) para o resultado de uma action. Cada resultado é um objeto
 * novo, então o mesmo texto pode aparecer de novo após outro envio.
 */
export function Toast({ result, fallback = "Salvo." }: { result: ActionResult<unknown> | undefined; fallback?: string }) {
  const [dismissed, setDismissed] = useState<object | null>(null);
  const active = result && result.ok ? result : null;
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setDismissed(active), 3500);
    return () => clearTimeout(t);
  }, [active]);
  if (!active || dismissed === active) return null;
  return (
    <div role="status" className="fixed right-4 bottom-4 z-50 rounded-xs bg-[#1f8a4c] px-4 py-3 text-[14px] text-white shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
      {active.message ?? fallback}
    </div>
  );
}

/** Botão que copia um texto para a área de transferência. */
export function CopyButton({ text, label = "Copiar", className }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={buttonClass("secondary", "sm", className)}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard indisponível */
        }
      }}
    >
      {done ? "Copiado" : label}
    </button>
  );
}

/** Formulário simples com botão "Aplicar" que envia ao mudar o select (status rápido). */
export function AutoSubmitSelect({ name, defaultValue, options, action, hidden = {}, label }: { name: string; defaultValue: string; options: Array<{ value: string; label: string }>; action: (formData: FormData) => void | Promise<void>; hidden?: Record<string, string>; label: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={action} className="inline-flex items-center gap-2">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <label className="text-[13px] text-grey-500">{label}</label>
      <select name={name} defaultValue={defaultValue} className="h-9 rounded-xs bg-white px-2 pr-7 text-[14px] hairline" onChange={() => formRef.current?.requestSubmit()}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
