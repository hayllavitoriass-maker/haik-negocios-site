"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { useMotion } from "./MotionProvider";
import { cn } from "@/lib/cn";

type Props = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  delay?: number;
  /** Deslocamento inicial em px. */
  y?: number;
  /** Anima os filhos diretos em cascata. */
  stagger?: number;
  once?: boolean;
  id?: string;
};

/**
 * Entrada "fade + subida" (1.1s expo.out) disparada ao entrar na viewport.
 * Equivalente ao [data-fade] da referência, com reversão ao sair.
 */
export function Reveal({ as: Tag = "div", className, children, delay = 0, y = 40, stagger, once = false, id }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const { staticScenes } = useMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || staticScenes) return;
    const targets = stagger ? Array.from(el.children) : el;
    const ctx = gsap.context(() => {
      // Com stagger, quem anima são os filhos: o contêiner precisa ficar visível.
      if (stagger) gsap.set(el, { opacity: 1, translate: "0px 0px" });
      gsap.fromTo(
        targets,
        { y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.1,
          ease: "expo.out",
          delay,
          stagger: stagger ?? 0,
          scrollTrigger: { trigger: el, start: "top 90%", toggleActions: once ? "play none none none" : "play none none reverse" },
        },
      );
    }, el);
    return () => ctx.revert();
  }, [delay, y, stagger, once, staticScenes]);

  return (
    <Tag ref={ref} id={id} className={cn(className)} data-fade>
      {children}
    </Tag>
  );
}
