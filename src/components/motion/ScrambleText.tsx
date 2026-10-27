"use client";

import { useCallback, useEffect, useRef, type ElementType } from "react";
import { GLYPHS, gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";

/**
 * Texto que passa por caracteres embaralhados (░▒▓▌▐▀▄) antes de assentar.
 * - `trigger="view"`: revela ao entrar na viewport (rótulos, manifesto).
 * - `trigger="mount"`: revela ao montar (navegação, indicadores).
 * O conteúdo real fica no DOM desde o início para leitores de tela.
 */
type Props = {
  as?: ElementType;
  text: string;
  className?: string;
  trigger?: "view" | "mount";
  duration?: number;
  delay?: number;
  speed?: number;
};

export function ScrambleText({ as: Tag = "span", text, className, trigger = "view", duration = 1.1, delay = 0, speed = 0.5 }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.to(el, {
        duration,
        delay,
        scrambleText: { text, chars: GLYPHS, speed, revealDelay: 0.2 },
        ease: "none",
        scrollTrigger: trigger === "view" ? { trigger: el, start: "top 92%", once: true } : undefined,
      });
    }, el);
    return () => ctx.revert();
  }, [text, trigger, duration, delay, speed]);

  return (
    <Tag ref={ref} className={cn(className)} aria-label={text}>
      {text}
    </Tag>
  );
}

/**
 * Scramble no hover (navegação e botões). Trava a largura durante a animação para não
 * deslocar o layout. Retorna o handler para `onPointerEnter`.
 */
export function useScrambleHover() {
  return useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse" || prefersReducedMotion()) return;
    const target = e.currentTarget.querySelector<HTMLElement>("[data-label]") ?? e.currentTarget;
    const text = target.dataset.label || target.textContent || "";
    if (!text) return;
    target.dataset.label = text;
    target.style.width = `${target.getBoundingClientRect().width}px`;
    target.style.display = "inline-block";
    gsap.to(target, {
      duration: 0.6,
      scrambleText: { text, chars: GLYPHS, speed: 0.9 },
      overwrite: true,
      ease: "none",
      onComplete: () => {
        target.style.width = "";
        target.style.display = "";
      },
    });
  }, []);
}
