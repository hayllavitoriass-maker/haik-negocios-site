"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useChaptersOptional } from "@/components/motion/ChapterProvider";
import { usePixelTransition } from "@/components/motion/PixelTransition";
import { useMotion } from "@/components/motion/MotionProvider";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Icon } from "@/components/ui/icons";
import { ROUTES } from "@/content/site";
import { cn } from "@/lib/cn";

/**
 * Elementos fixos do site público:
 * - indicador de capítulo (inferior esquerdo, desktop);
 * - pontos de navegação por capítulo (lateral direita, desktop);
 * - botão flutuante do WhatsApp (desktop) e barra fixa com CTA + WhatsApp (mobile);
 * - alternador "versão sem animações" (acessibilidade).
 */
export function ChapterIndicator() {
  const chapters = useChaptersOptional();
  if (!chapters?.active || chapters.atEnd) return null;
  const { active } = chapters;
  return (
    <div
      className="fixed bottom-4 left-4 z-20 hidden items-stretch gap-[3px] text-[var(--fg)] transition-opacity duration-500 desk:inline-flex"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="mono grid min-w-[38px] place-items-center rounded-xs bg-red text-[13px] text-white">
        {String(active.index).padStart(2, "0")}
      </span>
      <span className="grid rounded-xs bg-[var(--bg)] px-3 py-[7px] hairline">
        <span className="mono text-[9px] text-grey-400">Capítulo</span>
        <span className="mono text-[12px]">{active.label}</span>
      </span>
    </div>
  );
}

export function ChapterDots() {
  const chapters = useChaptersOptional();
  const { jumpTo } = usePixelTransition();
  if (!chapters || chapters.chapters.length < 2 || chapters.atEnd) return null;
  return (
    <nav aria-label="Capítulos" className="fixed right-3.5 top-1/2 z-20 hidden -translate-y-1/2 desk:block">
      <ul className="grid gap-1">
        {chapters.chapters.map((c) => {
          const isActive = chapters.active?.id === c.id;
          return (
            <li key={c.id} className="group relative">
              <button
                type="button"
                onClick={() => jumpTo(`#${c.id}`)}
                aria-current={isActive ? "step" : undefined}
                aria-label={`${String(c.index).padStart(2, "0")} ${c.label}`}
                className="grid size-5 place-items-center"
              >
                <span
                  className={cn(
                    "block w-1.5 rounded-[1px] transition-[height,background-color] duration-500 ease-[var(--ease-out)] group-hover:bg-[var(--fg)]",
                    isActive ? "h-[18px] bg-red" : "h-1.5 bg-[var(--fg)]/45",
                  )}
                />
              </button>
              <span className="mono pointer-events-none absolute right-[26px] top-1/2 -translate-y-1/2 translate-x-1.5 whitespace-nowrap rounded-xs bg-[var(--fg)] px-2 py-1.5 text-[var(--bg)] opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                {String(c.index).padStart(2, "0")} {c.label}
              </span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function WhatsAppFab({ href, tooltip }: { href: string; tooltip: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-5 right-5 z-20 hidden size-12 place-items-center rounded-full bg-red text-white shadow-[0_12px_30px_-8px_rgba(234,25,35,.6)] transition-transform duration-300 hover:scale-105 desk:grid"
      aria-label={`WhatsApp: ${tooltip}`}
    >
      <Icon name="whatsapp" className="size-6" />
      <span className="mono pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-xs bg-ink px-2 py-1.5 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {tooltip}
      </span>
    </a>
  );
}

export function MobileBar({ whatsappHref, label }: { whatsappHref: string; label: string }) {
  const pathname = usePathname();
  if (pathname === ROUTES.diagnostico) return null;
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 flex items-stretch gap-2 border-t border-[var(--hairline)] bg-[var(--bg)]/95 p-2 backdrop-blur-[8px] pointer-coarse:backdrop-blur-none desk:hidden"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      <TransitionLink href={ROUTES.diagnostico} className="flex h-11 flex-1 items-center justify-center rounded-xs bg-red text-[15px] font-medium text-white">
        {label}
      </TransitionLink>
      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid h-11 w-12 place-items-center rounded-xs bg-ink text-white">
        <Icon name="whatsapp" className="size-5" />
      </a>
    </div>
  );
}

export function MotionToggle() {
  const { staticScenes, setStaticScenes, reduced } = useMotion();
  const [visible, setVisible] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- estado só conhecido no navegador, aplicado após a hidratação
  useEffect(() => setVisible(true), []);
  if (!visible || reduced) return null;
  return (
    <button
      type="button"
      onClick={() => setStaticScenes(!staticScenes)}
      className="mono fixed bottom-4 left-1/2 z-20 hidden -translate-x-1/2 rounded-xs bg-[var(--bg)]/80 px-2.5 py-2 text-[var(--fg-muted)] hairline backdrop-blur-[8px] transition-colors hover:text-[var(--fg)] desk:block"
      aria-pressed={staticScenes}
    >
      {staticScenes ? "Ativar animações" : "Versão sem animações"}
    </button>
  );
}
