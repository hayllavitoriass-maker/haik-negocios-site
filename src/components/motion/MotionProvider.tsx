"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Contexto de motion do site público:
 * - instância única do Lenis sincronizada com o ticker do GSAP e com o ScrollTrigger;
 * - modo "estático" (sem animações de scroll) quando o sistema pede menos movimento
 *   ou quando o visitante escolhe "versão sem animações";
 * - refresh do ScrollTrigger a cada troca de rota.
 */
type MotionContextValue = {
  lenis: Lenis | null;
  reduced: boolean;
  staticScenes: boolean;
  setStaticScenes: (v: boolean) => void;
  scrollTo: (target: string | number | HTMLElement, opts?: { immediate?: boolean; offset?: number }) => void;
  lock: (locked: boolean) => void;
};

const MotionContext = createContext<MotionContextValue>({
  lenis: null,
  reduced: false,
  staticScenes: false,
  setStaticScenes: () => {},
  scrollTo: () => {},
  lock: () => {},
});

const STATIC_KEY = "haik:static-scenes";

export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const [userStatic, setUserStatic] = useState<boolean>(false);
  const pathname = usePathname();
  const lockDepth = useRef(0);

  // Preferência explícita do visitante (persistida só no navegador dele).
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- estado só conhecido no navegador, aplicado após a hidratação
      setUserStatic(window.localStorage.getItem(STATIC_KEY) === "1");
    } catch {
      /* armazenamento indisponível: segue o padrão */
    }
  }, []);

  const staticScenes = reduced || userStatic;

  useEffect(() => {
    document.documentElement.classList.toggle("scenes-static", staticScenes);
    document.documentElement.classList.toggle("reduced-motion", reduced);
  }, [staticScenes, reduced]);

  useEffect(() => {
    if (reduced) return; // sem smooth scroll quando o sistema pede menos movimento
    const instance = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
    const onScroll = () => ScrollTrigger.update();
    instance.on("scroll", onScroll);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a instância do Lenis só existe no cliente
    setLenis(instance);
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __lenis?: Lenis }).__lenis = instance;
    }
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, [reduced]);

  // Troca de rota: volta ao topo e recalcula gatilhos depois do layout assentar.
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => window.clearTimeout(id);
  }, [pathname, lenis]);

  const value = useMemo<MotionContextValue>(
    () => ({
      lenis,
      reduced,
      staticScenes,
      setStaticScenes: (v) => {
        setUserStatic(v);
        try {
          window.localStorage.setItem(STATIC_KEY, v ? "1" : "0");
        } catch {
          /* ignore */
        }
      },
      scrollTo: (target, opts) => {
        if (lenis) {
          lenis.scrollTo(target, { immediate: opts?.immediate, offset: opts?.offset ?? 0 });
          return;
        }
        let y: number;
        if (typeof target === "number") {
          y = target;
        } else {
          const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
          y = (el?.getBoundingClientRect().top ?? 0) + window.scrollY + (opts?.offset ?? 0);
        }
        window.scrollTo({ top: y, behavior: opts?.immediate || reduced ? "auto" : "smooth" });
      },
      lock: (locked) => {
        lockDepth.current = Math.max(0, lockDepth.current + (locked ? 1 : -1));
        const isLocked = lockDepth.current > 0;
        if (lenis) {
          if (isLocked) lenis.stop();
          else lenis.start();
        }
        document.documentElement.classList.toggle("is-locked", isLocked);
        document.documentElement.style.overflow = isLocked ? "hidden" : "";
      },
    }),
    [lenis, reduced, staticScenes],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotion() {
  return useContext(MotionContext);
}
