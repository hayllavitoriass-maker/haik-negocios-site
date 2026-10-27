import Link from "next/link";
import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Primitivos visuais do painel: sóbrios, rápidos e sem dependência das animações do site.
 * Superfícies brancas, texto ink, vermelho só para ação primária e navegação ativa, raio 2px.
 * Todos funcionam em Server Components (sem estado); os interativos ficam em `client.tsx`.
 */

type Tone = "neutral" | "red" | "green" | "amber" | "blue";

const buttonBase =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xs px-4 text-[14px] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-red focus-visible:outline-offset-2";
const buttonVariants = {
  primary: "bg-red text-white hover:bg-red-600",
  secondary: "bg-white text-ink hairline hover:bg-grey-50",
  danger: "bg-white text-red-600 hairline hover:bg-red-50",
  ghost: "bg-transparent text-ink hover:bg-grey-100",
} as const;
const buttonSizes = { sm: "min-h-8 px-3 text-[13px]", md: "", lg: "min-h-12 px-5 text-[15px]" } as const;

export type ButtonVariant = keyof typeof buttonVariants;

export function buttonClass(variant: ButtonVariant = "primary", size: keyof typeof buttonSizes = "md", className?: string) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: keyof typeof buttonSizes }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

export function LinkButton({
  href,
  variant = "secondary",
  size = "md",
  className,
  children,
  external,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: keyof typeof buttonSizes;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass(variant, size, className)}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

export const controlClass =
  "w-full rounded-xs bg-white px-3 text-[15px] text-ink hairline placeholder:text-grey-400 transition-[box-shadow] duration-150 focus:outline-none focus:shadow-[inset_0_0_0_2px_var(--color-red)] aria-[invalid=true]:shadow-[inset_0_0_0_2px_var(--color-red)] disabled:bg-grey-50 disabled:text-grey-500 read-only:bg-grey-50";

type FieldBase = { label: string; error?: string; hint?: string; className?: string; optional?: boolean };

export function FieldShell({ id, label, error, hint, className, optional, children }: FieldBase & { id: string; children: React.ReactNode }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
        {optional && <span className="ml-1 font-normal text-grey-400">(opcional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[12px] text-grey-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[12px] text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ label, error, hint, className, optional, id: idProp, ...rest }: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className} optional={optional}>
      <input id={id} className={cn(controlClass, "h-10")} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...rest} />
    </FieldShell>
  );
}

export function Textarea({ label, error, hint, className, optional, id: idProp, ...rest }: FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className} optional={optional}>
      <textarea id={id} className={cn(controlClass, "min-h-[96px] py-2 leading-[1.5]")} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...rest} />
    </FieldShell>
  );
}

export function Select({
  label,
  error,
  hint,
  className,
  optional,
  id: idProp,
  options,
  placeholder,
  ...rest
}: FieldBase & SelectHTMLAttributes<HTMLSelectElement> & { options: ReadonlyArray<{ value: string; label: string } | string>; placeholder?: string }) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className} optional={optional}>
      <select id={id} className={cn(controlClass, "h-10 appearance-none pr-9 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236e6e6e%22 stroke-width=%221.75%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[position:right_10px_center] bg-no-repeat")} aria-invalid={error ? true : undefined} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const opt = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </FieldShell>
  );
}

export function Checkbox({ label, hint, className, id: idProp, ...rest }: { label: React.ReactNode; hint?: string; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div className={cn("grid gap-1", className)}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-[14px] leading-[1.5] text-ink">
        <input id={id} type="checkbox" className="mt-[3px] size-4 shrink-0 cursor-pointer accent-red" {...rest} />
        <span>{label}</span>
      </label>
      {hint && <p className="pl-[26px] text-[12px] text-grey-500">{hint}</p>}
    </div>
  );
}

export function Card({ title, description, actions, className, children, padded = true }: { title?: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; className?: string; children: React.ReactNode; padded?: boolean }) {
  return (
    <section className={cn("rounded-xs bg-white hairline", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div>
            {title && <h2 className="font-sans text-[15px] font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-grey-500">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(padded && "px-5 pb-5", padded && !(title || actions) && "pt-5")}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mono mb-2 text-grey-500">{eyebrow}</p>}
        <h1 className="font-sans text-[24px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[14px] text-grey-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const badgeTones: Record<Tone, string> = {
  neutral: "bg-grey-100 text-grey-600",
  red: "bg-red-50 text-red-700",
  green: "bg-[#e6f4ec] text-[#176a3b]",
  amber: "bg-[#fff3e0] text-[#8a5200]",
  blue: "bg-[#e8f0fb] text-[#1d4f91]",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-xs px-2 py-0.5 text-[12px] font-medium", badgeTones[tone], className)}>{children}</span>;
}

export function Alert({ tone = "neutral", title, children, className }: { tone?: Tone; title?: string; children?: React.ReactNode; className?: string }) {
  const tones: Record<Tone, string> = {
    neutral: "bg-grey-50 text-ink",
    red: "bg-red-50 text-red-800",
    green: "bg-[#e6f4ec] text-[#176a3b]",
    amber: "bg-[#fff3e0] text-[#8a5200]",
    blue: "bg-[#e8f0fb] text-[#1d4f91]",
  };
  return (
    <div role={tone === "red" ? "alert" : "status"} className={cn("rounded-xs px-4 py-3 text-[14px] leading-[1.5]", tones[tone], className)}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cn(title && "mt-0.5")}>{children}</div>}
    </div>
  );
}

/** Mensagens de retorno vindas da query string (?ok= / ?erro=). */
export function Flash({ ok, erro }: { ok?: string; erro?: string }) {
  if (!ok && !erro) return null;
  return (
    <div className="mb-5 grid gap-2">
      {ok && <Alert tone="green">{ok}</Alert>}
      {erro && <Alert tone="red">{erro}</Alert>}
    </div>
  );
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("-mx-5 overflow-x-auto px-5", className)}>
      <table className="w-full min-w-[640px] border-collapse text-[14px]">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("border-b border-grey-200 py-2 pr-4 text-left text-[12px] font-medium uppercase tracking-[0.06em] text-grey-500", className)}>{children}</th>;
}

export function Td({ children, className, colSpan }: { children?: React.ReactNode; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cn("border-b border-grey-100 py-2.5 pr-4 align-top text-ink", className)}>
      {children}
    </td>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="grid place-items-center gap-2 rounded-xs bg-grey-50 px-6 py-10 text-center">
      <p className="text-[15px] font-medium text-ink">{title}</p>
      {description && <p className="max-w-md text-[13px] text-grey-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, href, tone }: { label: string; value: number | string; href?: string; tone?: Tone }) {
  const body = (
    <div className="rounded-xs bg-white p-4 hairline transition-colors hover:bg-grey-50">
      <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-grey-500">{label}</p>
      <p className={cn("mt-1 font-sans text-[28px] font-semibold tracking-[-0.02em]", tone === "red" ? "text-red" : "text-ink")}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function DescriptionList({ items }: { items: Array<{ label: string; value: React.ReactNode }> }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((it) => (
        <div key={it.label} className="grid gap-0.5">
          <dt className="text-[12px] font-medium uppercase tracking-[0.06em] text-grey-500">{it.label}</dt>
          <dd className="text-[14px] text-ink [overflow-wrap:anywhere]">{it.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Pagination({ page, pages, buildHref }: { page: number; pages: number; buildHref: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-between text-[13px] text-grey-500" aria-label="Paginação">
      <span>
        Página {page} de {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={buildHref(page - 1)} className={buttonClass("secondary", "sm")}>
            Anterior
          </Link>
        ) : (
          <span className={buttonClass("secondary", "sm", "opacity-40")}>Anterior</span>
        )}
        {page < pages ? (
          <Link href={buildHref(page + 1)} className={buttonClass("secondary", "sm")}>
            Próxima
          </Link>
        ) : (
          <span className={buttonClass("secondary", "sm", "opacity-40")}>Próxima</span>
        )}
      </div>
    </nav>
  );
}

export function FormGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-4", className)}>{children}</div>;
}

export function Divider() {
  return <hr className="my-5 border-0 border-t border-grey-200" />;
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <code className="rounded-xs bg-grey-100 px-1.5 py-0.5 font-mono text-[12px] text-ink">{children}</code>;
}
