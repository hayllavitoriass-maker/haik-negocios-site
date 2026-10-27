"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { MAIN_NAV, ROUTES, WHATSAPP_LINK, INSTAGRAM_LINK } from "@/content/site";
import { prefersReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";

const COLS = 12;

/**
 * Menu mobile em tela cheia: abre e fecha com uma grade de "pixels" (12 colunas)
 * desenhada em onda; os links entram em cascata depois da cobertura.
 */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const root = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  // A grade depende do tamanho da janela: só é calculada no cliente, para não quebrar a hidratação.
  const [cells, setCells] = useState<number[]>([]);
  useEffect(() => {
    const compute = () => {
      const rows = Math.ceil((window.innerHeight / window.innerWidth) * COLS) + 1;
      setCells(Array.from({ length: COLS * rows }, (_, i) => i));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const pixels = el.querySelectorAll<HTMLElement>(".menu-pixel");
    const items = el.querySelectorAll<HTMLElement>(".menu-item");
    const reduced = prefersReducedMotion();
    if (open) {
      el.style.visibility = "visible";
      if (reduced) {
        gsap.set(pixels, { opacity: 1, scale: 1 });
        gsap.set(items, { opacity: 1, y: 0 });
        return;
      }
      const tl = gsap.timeline();
      tl.fromTo(pixels, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.18, stagger: { amount: 0.35, grid: "auto", from: "end", axis: "y" }, ease: "power2.out" });
      tl.fromTo(items, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "expo.out" }, "-=0.1");
      (el.querySelector<HTMLElement>("a") ?? el).focus({ preventScroll: true });
      return () => {
        tl.kill();
      };
    }
    if (el.style.visibility !== "visible") return;
    if (reduced) {
      el.style.visibility = "hidden";
      return;
    }
    const tl = gsap.timeline({ onComplete: () => (el.style.visibility = "hidden") });
    tl.to(items, { opacity: 0, y: -12, duration: 0.2, ease: "power2.in" });
    tl.to(pixels, { opacity: 0, scale: 0.5, duration: 0.16, stagger: { amount: 0.3, grid: "auto", from: "start", axis: "y" }, ease: "power2.in" }, "-=0.05");
    return () => {
      tl.kill();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      ref={root}
      id="mobile-menu"
      className="fixed inset-0 z-[19] flex flex-col justify-end gap-7 px-[calc(var(--gutter)/2+16px)] pb-[calc(44px+env(safe-area-inset-bottom))] pt-[calc(96px+env(safe-area-inset-top))] text-white desk:hidden"
      style={{ visibility: "hidden" }}
      aria-hidden={!open}
      inert={!open ? true : undefined}
      data-lenis-prevent
    >
      <div className="absolute inset-0 -z-10 grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }} aria-hidden="true">
        {cells.map((i) => (
          <div key={i} className={cn("menu-pixel bg-ink-900", i % 13 === 0 && "bg-red")} style={{ opacity: 0 }} />
        ))}
      </div>
      <nav aria-label="Menu" className="grid gap-4">
        {[{ label: "Início", href: ROUTES.home }, ...MAIN_NAV, { label: "Contato", href: ROUTES.contato }].map((item) => {
          const current = pathname === item.href;
          return (
            <TransitionLink
              key={item.href}
              href={item.href}
              className={cn(
                "menu-item relative font-display text-[clamp(34px,10vw,46px)] font-semibold leading-[1.08] tracking-[-.04em] transition-opacity",
                current ? "opacity-100 before:absolute before:-left-5 before:top-1/2 before:size-2 before:-translate-y-1/2 before:bg-red" : "opacity-60",
              )}
              onClick={onClose}
            >
              {item.label}
            </TransitionLink>
          );
        })}
      </nav>
      <div className="menu-item flex items-center justify-between border-t border-white/15 pt-5">
        <Button href={ROUTES.diagnostico} size="sm" onClick={onClose}>
          Diagnóstico gratuito
        </Button>
        <div className="flex items-center gap-3">
          <a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" aria-label="Instagram @haiknegocios" className="grid size-10 place-items-center rounded-xs hairline-dark">
            <Icon name="instagram" />
          </a>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid size-10 place-items-center rounded-xs hairline-dark">
            <Icon name="whatsapp" />
          </a>
        </div>
      </div>
    </div>
  );
}
