"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { useScrambleHover } from "@/components/motion/ScrambleText";
import { useChaptersOptional } from "@/components/motion/ChapterProvider";
import { useMotion } from "@/components/motion/MotionProvider";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/icons";
import { MAIN_NAV, ROUTES } from "@/content/site";
import { cn } from "@/lib/cn";
import { MobileMenu } from "./MobileMenu";

/**
 * Header fixo. A cor acompanha o capítulo (var(--fg) muda com data-theme no <html>).
 * No desktop: wordmark, links com scramble no hover e CTA. No mobile: botão com o
 * capítulo atual que abre o menu em pixels.
 */
export function Header() {
  const scramble = useScrambleHover();
  const pathname = usePathname();
  const chapters = useChaptersOptional();
  const { lock } = useMotion();
  // O menu guarda a rota em que foi aberto: ao navegar, fecha sozinho sem efeito.
  const [openState, setOpenState] = useState<{ open: boolean; path: string }>({ open: false, path: pathname });
  const open = openState.open && openState.path === pathname;
  const setOpen = (next: boolean | ((v: boolean) => boolean)) =>
    setOpenState((prev) => ({ open: typeof next === "function" ? next(prev.open && prev.path === pathname) : next, path: pathname }));

  useEffect(() => {
    document.documentElement.classList.toggle("is-menu-open", open);
    lock(open);
    return () => {
      if (open) lock(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const active = chapters?.active;
  const chapterIndex = active ? String(active.index).padStart(2, "0") : "00";

  return (
    <>
      <header
        className="site-header fixed inset-x-0 top-0 z-20 flex h-[var(--header-h)] items-center gap-7 px-[max(var(--gutter),env(safe-area-inset-left))] text-[var(--fg)]"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <TransitionLink href={ROUTES.home} aria-label="HAIK Negócios, início" className="relative z-[2] flex items-center">
          <BrandLogo className="h-6" />
        </TransitionLink>

        <nav aria-label="Principal" className="ml-auto hidden items-center gap-5 text-[14px] desk:flex">
          {MAIN_NAV.map((item) => {
            const current = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <TransitionLink
                key={item.href}
                href={item.href}
                onPointerEnter={scramble}
                aria-current={current ? "page" : undefined}
                className={cn("-my-1.5 inline-flex items-center gap-[7px] py-1.5 transition-colors hover:text-red", current && "text-red")}
              >
                <span data-label="">{item.label}</span>
                <span className="grid size-4 place-items-center rounded-xs shadow-[inset_0_0_0_1px_var(--hairline)]" aria-hidden="true">
                  <Icon name="plus" className="size-2.5" />
                </span>
              </TransitionLink>
            );
          })}
        </nav>

        <div className="relative z-[2] hidden desk:block">
          <Button href={ROUTES.diagnostico} size="sm">
            Diagnóstico gratuito
          </Button>
        </div>

        <button
          type="button"
          className="ml-auto inline-flex h-10 items-center gap-2 pr-1 desk:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="mono rounded-xs bg-red px-[5px] pt-1 pb-[3px] text-[10px] text-white">{chapterIndex}</span>
          <span className="inline-flex h-7 items-center gap-2.5 rounded-xs bg-[rgba(127,127,127,.12)] px-2.5 shadow-[inset_0_0_0_1px_var(--hairline)]">
            <span className="mono text-[10px]">{active?.label ?? "Menu"}</span>
            {open ? <Icon name="close" className="size-3.5" /> : <Icon name="menu" className="size-3.5" />}
          </span>
        </button>
      </header>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
