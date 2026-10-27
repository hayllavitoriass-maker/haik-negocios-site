"use client";

import Link, { type LinkProps } from "next/link";
import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { usePixelTransition } from "./PixelTransition";

type Props = LinkProps & AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode };

/**
 * Link interno com transição em pixels. Mantém o comportamento nativo para
 * modificadores (nova aba), links externos, âncoras e hash na mesma página.
 */
export const TransitionLink = forwardRef<HTMLAnchorElement, Props>(function TransitionLink(
  { href, onClick, children, ...rest },
  ref,
) {
  const { navigate, jumpTo } = usePixelTransition();
  const hrefStr = typeof href === "string" ? href : ((href as { pathname?: string | null }).pathname ?? "/");
  const isExternal = /^(https?:|mailto:|tel:)/.test(hrefStr);
  const isHash = hrefStr.startsWith("#");

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || isExternal) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (rest.target === "_blank") return;
    e.preventDefault();
    if (isHash) {
      jumpTo(hrefStr);
      return;
    }
    navigate(hrefStr);
  };

  if (isExternal) {
    return (
      <a ref={ref} href={hrefStr} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link ref={ref} href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
});
