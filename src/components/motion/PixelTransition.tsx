"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/hooks/useReducedMotion";
import { useMotion } from "./MotionProvider";

/**
 * Transição em pixels: uma grade de células cobre a tela em onda (preto com acentos
 * vermelhos), a rota muda por baixo e a grade se dissolve. Implementação própria.
 *
 * Segurança: nunca bloqueia para sempre. Há um limite de tempo para o cover, a revelação
 * acontece na troca de rota (ou após um fallback) e a grade só existe durante a transição.
 */
type TransitionContextValue = {
  navigate: (href: string) => void;
  jumpTo: (selectorOrY: string | number) => void;
  isTransitioning: boolean;
};

const TransitionContext = createContext<TransitionContextValue>({
  navigate: () => {},
  jumpTo: () => {},
  isTransitioning: false,
});

const COLS = 18;
const COVER_MS = 520;
const REVEAL_MS = 620;
const SAFETY_MS = 2600;

export function PixelTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { scrollTo } = useMotion();
  const [active, setActive] = useState(false);
  const veilRef = useRef<HTMLDivElement | null>(null);
  const pendingReveal = useRef<(() => void) | null>(null);
  const safetyTimer = useRef<number | null>(null);
  const lastPath = useRef(pathname);

  const cells = useMemo(() => {
    if (!active) return [];
    const rows = Math.ceil((typeof window !== "undefined" ? window.innerHeight / window.innerWidth : 0.6) * COLS) + 1;
    return Array.from({ length: COLS * rows }, (_, i) => ({ i, red: (i * 7919) % 11 === 0 }));
  }, [active]);

  const reveal = useCallback(() => {
    const veil = veilRef.current;
    if (!veil) {
      setActive(false);
      return;
    }
    veil.classList.remove("is-blocking");
    const cellEls = veil.querySelectorAll<HTMLElement>(".pixel-veil__cell");
    gsap.to(cellEls, {
      opacity: 0,
      scale: 0.6,
      duration: REVEAL_MS / 1000,
      ease: "power2.in",
      stagger: { amount: 0.35, from: "random" },
      onComplete: () => setActive(false),
    });
  }, []);

  const cover = useCallback(
    (onCovered: () => void) => {
      if (prefersReducedMotion()) {
        onCovered();
        return;
      }
      setActive(true);
      // A grade é montada no próximo frame; animamos quando existir no DOM.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const veil = veilRef.current;
          if (!veil) {
            onCovered();
            return;
          }
          veil.classList.add("is-blocking");
          const cellEls = veil.querySelectorAll<HTMLElement>(".pixel-veil__cell");
          gsap.fromTo(
            cellEls,
            { opacity: 0, scale: 0.6 },
            {
              opacity: 1,
              scale: 1,
              duration: COVER_MS / 1000,
              ease: "power2.out",
              stagger: { amount: 0.4, grid: "auto", from: "start", axis: "x" },
              onComplete: onCovered,
            },
          );
          if (safetyTimer.current) window.clearTimeout(safetyTimer.current);
          safetyTimer.current = window.setTimeout(() => {
            pendingReveal.current = null;
            reveal();
          }, SAFETY_MS);
        });
      });
    },
    [reveal],
  );

  // Revela quando a nova rota renderizou.
  useEffect(() => {
    if (pathname !== lastPath.current) {
      lastPath.current = pathname;
      if (pendingReveal.current) {
        const fn = pendingReveal.current;
        pendingReveal.current = null;
        if (safetyTimer.current) window.clearTimeout(safetyTimer.current);
        window.setTimeout(fn, 60);
      }
    }
  }, [pathname]);

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname) return;
      cover(() => {
        pendingReveal.current = reveal;
        router.push(href);
      });
    },
    [cover, pathname, reveal, router],
  );

  const jumpTo = useCallback(
    (target: string | number) => {
      cover(() => {
        scrollTo(target, { immediate: true, offset: 0 });
        if (safetyTimer.current) window.clearTimeout(safetyTimer.current);
        window.setTimeout(reveal, 80);
      });
    },
    [cover, reveal, scrollTo],
  );

  const value = useMemo(() => ({ navigate, jumpTo, isTransitioning: active }), [navigate, jumpTo, active]);

  return (
    <TransitionContext.Provider value={value}>
      {children}
      {active && (
        <div
          ref={veilRef}
          className="pixel-veil"
          aria-hidden="true"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        >
          {cells.map((c) => (
            <div key={c.i} className={c.red ? "pixel-veil__cell is-red" : "pixel-veil__cell"} />
          ))}
        </div>
      )}
    </TransitionContext.Provider>
  );
}

export function usePixelTransition() {
  return useContext(TransitionContext);
}
