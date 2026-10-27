"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { useScrambleHover } from "@/components/motion/ScrambleText";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "ghost" | "outline" | "dark" | "white" | "link";
export type ButtonSize = "md" | "sm" | "lg";

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  arrow?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
  full?: boolean;
};
type AsLink = Common & {
  href: string;
  target?: string;
  rel?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  type?: never;
  disabled?: never;
};
type AsButton = Common & { href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>;
export type ButtonProps = AsLink | AsButton;

const base =
  "group inline-flex items-center justify-between gap-4 whitespace-nowrap rounded-xs font-medium leading-none transition-[background-color,color,box-shadow,transform] duration-300 ease-[var(--ease-out)] select-none disabled:opacity-50 disabled:pointer-events-none [&_svg]:transition-transform [&_svg]:duration-500 [&_svg]:ease-[var(--ease-out)] hover:[&_svg]:translate-x-1 active:translate-y-px";

const sizes: Record<ButtonSize, string> = {
  lg: "h-13 px-6 text-[16px]",
  md: "h-11 px-4 text-[15px]",
  sm: "h-[34px] px-3 text-[13px]",
};

/**
 * Variantes seguem a identidade: vermelho como ação principal, inversão elegante no hover.
 * Em capítulos escuros o hover do primário vira branco/preto; em claros, preto/branco.
 */
const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-red text-white hover:bg-ink hover:text-white dark-chapter:hover:bg-white dark-chapter:hover:text-ink shadow-[0_10px_30px_-12px_rgba(234,25,35,.6)]",
  ghost:
    "bg-[rgba(23,23,23,.06)] text-[var(--fg)] hairline backdrop-blur-[8px] pointer-coarse:backdrop-blur-none hover:bg-[var(--fg)] hover:text-[var(--bg)] dark-chapter:bg-[rgba(0,0,0,.35)]",
  outline: "bg-transparent text-[var(--fg)] hairline hover:bg-[var(--fg)] hover:text-[var(--bg)]",
  dark: "bg-ink text-white hover:bg-red",
  white: "bg-white text-ink hover:bg-red hover:text-white",
  link: "h-auto px-0 text-[14px] text-[var(--fg)] underline-offset-4 hover:text-red",
};

export const Button = forwardRef<HTMLAnchorElement | HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const { variant = "primary", size = "md", arrow, icon, className, children, full } = props;
  const scramble = useScrambleHover();
  const classes = cn(base, sizes[size], variants[variant], full && "w-full", className);
  const inner = (
    <>
      <span data-label="">{children}</span>
      {icon}
      {arrow && <ArrowIcon />}
    </>
  );
  if ("href" in props && props.href) {
    const { href, target, rel, onClick } = props;
    return (
      <TransitionLink
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
        className={classes}
        onPointerEnter={scramble}
        onClick={onClick}
      >
        {inner}
      </TransitionLink>
    );
  }
  const { variant: _v, size: _s, arrow: _a, icon: _i, full: _f, className: _c, children: _ch, ...buttonProps } = props as AsButton;
  void _v; void _s; void _a; void _i; void _f; void _c; void _ch;
  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} type="button" className={classes} onPointerEnter={scramble} {...buttonProps}>
      {inner}
    </button>
  );
});

export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4 shrink-0", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
