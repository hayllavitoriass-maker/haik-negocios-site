"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { setStage, type StageTheme } from "@/components/three/stage-store";
import { cn } from "@/lib/cn";

const HEADER = 64;

function applyTheme(theme: StageTheme) {
  document.documentElement.dataset.theme = theme;
  setStage({ theme });
}

/**
 * Trecho de página com tema próprio. Enquanto o bloco está sob o header fixo,
 * o `data-theme` do documento (e a paleta da cena 3D) acompanham o tema do bloco,
 * para o header inverter de cor sobre heros e CTAs escuros das páginas internas.
 * `untilEnd` mantém o tema até o fim da página (CTA final seguido do rodapé escuro).
 */
export function ThemeZone({
  as: Tag = "section",
  theme = "dark",
  untilEnd = false,
  className,
  children,
  id,
  labelledBy,
}: {
  as?: ElementType;
  theme?: StageTheme;
  untilEnd?: boolean;
  className?: string;
  children: ReactNode;
  id?: string;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const other: StageTheme = theme === "dark" ? "light" : "dark";
    const st = ScrollTrigger.create({
      trigger: el,
      start: `top ${HEADER}px`,
      end: untilEnd ? "max" : `bottom ${HEADER}px`,
      onToggle: (self) => applyTheme(self.isActive ? theme : other),
    });
    // Os provedores do layout aplicam o tema padrão nos próprios efeitos de montagem;
    // por isso a zona reafirma o seu tema logo após e a cada refresh do ScrollTrigger.
    const sync = () => {
      if (st.isActive) applyTheme(theme);
    };
    sync();
    const timer = window.setTimeout(sync, 60);
    ScrollTrigger.addEventListener("refresh", sync);
    return () => {
      window.clearTimeout(timer);
      ScrollTrigger.removeEventListener("refresh", sync);
      st.kill();
    };
  }, [theme, untilEnd]);

  return (
    <Tag ref={ref} id={id} aria-labelledby={labelledBy} className={cn(theme === "dark" && "chapter--dark", className)}>
      {children}
    </Tag>
  );
}

/** Mantém o header claro sobre o rodapé escuro em páginas sem CTA final escuro. */
export function FooterThemeSync() {
  useEffect(() => {
    const footer = document.querySelector<HTMLElement>("footer.chapter--dark");
    if (!footer) return;
    const st = ScrollTrigger.create({
      trigger: footer,
      start: `top ${HEADER}px`,
      end: "max",
      onToggle: (self) => applyTheme(self.isActive ? "dark" : "light"),
    });
    return () => st.kill();
  }, []);
  return null;
}
