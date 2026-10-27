"use client";

import { forwardRef, useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Controles de formulário acessíveis com labels explícitos, erro vinculado por
 * aria-describedby e tamanho de toque adequado (≥ 44px).
 */
const control =
  "w-full rounded-xs bg-[var(--bg)] px-3 text-[16px] text-[var(--fg)] hairline placeholder:text-grey-400 transition-[box-shadow] duration-200 focus:outline-none focus:shadow-[inset_0_0_0_2px_var(--color-red)] aria-[invalid=true]:shadow-[inset_0_0_0_2px_var(--color-red)] disabled:opacity-60";

type Base = { label: string; error?: string; hint?: string; className?: string; optional?: boolean };

export function FieldShell({
  id,
  label,
  error,
  hint,
  className,
  optional,
  children,
}: Base & { id: string; children: React.ReactNode }) {
  return (
    <div className={cn("grid gap-2", className)}>
      <label htmlFor={id} className="text-[14px] font-medium text-[var(--fg)]">
        {label}
        {optional && <span className="ml-1 text-[12px] font-normal text-grey-500">(opcional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[12px] text-grey-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[13px] text-red-600 dark-chapter:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, Base & InputHTMLAttributes<HTMLInputElement>>(function Input(
  { label, error, hint, className, optional, id: idProp, ...rest },
  ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className} optional={optional}>
      <input
        ref={ref}
        id={id}
        className={cn(control, "h-12")}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
    </FieldShell>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, Base & TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { label, error, hint, className, optional, id: idProp, ...rest },
  ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className} optional={optional}>
      <textarea
        ref={ref}
        id={id}
        className={cn(control, "min-h-[120px] py-3 leading-[1.5]")}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
    </FieldShell>
  );
});

export const Select = forwardRef<HTMLSelectElement, Base & SelectHTMLAttributes<HTMLSelectElement> & { options: readonly string[]; placeholder?: string }>(
  function Select({ label, error, hint, className, optional, id: idProp, options, placeholder = "Selecione", ...rest }, ref) {
    const auto = useId();
    const id = idProp ?? auto;
    return (
      <FieldShell id={id} label={label} error={error} hint={hint} className={className} optional={optional}>
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={cn(control, "h-12 appearance-none pr-10")}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            defaultValue=""
            {...rest}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-grey-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </FieldShell>
    );
  },
);

/** Grupo de opções como botões (toque confortável), com input radio real por trás. */
export function ChoiceGroup({
  label,
  name,
  options,
  error,
  defaultValue,
  className,
  columns = 2,
  onChange,
}: {
  label: string;
  name: string;
  options: readonly string[];
  error?: string;
  defaultValue?: string;
  className?: string;
  columns?: 2 | 3 | 4;
  onChange?: (value: string) => void;
}) {
  const id = useId();
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[columns];
  return (
    <fieldset className={cn("grid gap-2", className)} aria-describedby={error ? `${id}-error` : undefined} aria-invalid={error ? true : undefined}>
      <legend className="mb-2 text-[14px] font-medium text-[var(--fg)]">{label}</legend>
      <div className={cn("grid grid-cols-1 gap-2", cols)}>
        {options.map((o) => (
          <label
            key={o}
            className="relative flex min-h-12 cursor-pointer items-center rounded-xs px-3 py-2 text-[15px] hairline transition-colors duration-200 has-[:checked]:bg-red has-[:checked]:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-red has-[:focus-visible]:outline-offset-2 hover:bg-[rgba(234,25,35,.08)] has-[:checked]:hover:bg-red-600"
          >
            <input
              type="radio"
              name={name}
              value={o}
              defaultChecked={defaultValue === o}
              className="peer sr-only"
              onChange={() => onChange?.(o)}
            />
            <span className="mr-3 inline-block size-3 shrink-0 rounded-full shadow-[inset_0_0_0_1.5px_currentColor] peer-checked:bg-white" aria-hidden="true" />
            {o}
          </label>
        ))}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[13px] text-red-600 dark-chapter:text-red-300">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function Checkbox({
  label,
  name,
  error,
  defaultChecked,
  className,
}: {
  label: React.ReactNode;
  name: string;
  error?: string;
  defaultChecked?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("grid gap-2", className)}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-[14px] leading-[1.5]">
        <input
          id={id}
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-[3px] size-4 shrink-0 cursor-pointer appearance-none rounded-xs bg-[var(--bg)] hairline checked:bg-red checked:shadow-none checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><path fill=%22none%22 stroke=%22white%22 stroke-width=%222%22 d=%22M3.5 8.5l3 3 6-6%22/></svg>')] checked:bg-center checked:bg-no-repeat focus-visible:outline-2 focus-visible:outline-red"
        />
        <span>{label}</span>
      </label>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[13px] text-red-600 dark-chapter:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

/** Campos invisíveis anti-spam: honeypot e timestamp de abertura do formulário. */
export function AntiSpamFields() {
  return (
    <>
      <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Não preencha este campo
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <FormOpenedAt />
    </>
  );
}

function FormOpenedAt() {
  // O valor é definido no cliente para refletir quando o formulário foi realmente aberto.
  return (
    <input
      type="hidden"
      name="_t"
      ref={(el) => {
        if (el && !el.value) el.value = String(Date.now());
      }}
    />
  );
}
