"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { useMotion } from "@/components/motion/MotionProvider";
import { cn } from "@/lib/cn";

type Props = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  delay?: number;
  y?: number;
  /** Intervalo entre os filhos diretos. */
  stagger?: number;
  once?: boolean;
  id?: string;
};

/**
 * Entrada em cascata dos filhos diretos (listas e grades). O contêiner fica oculto por CSS
 * ([data-fade]) até a hidratação e é liberado no mesmo instante em que os filhos começam
 * a animar, para nunca ficar invisível.
 */
export function Stagger({ as: Tag = "div", className, children, delay = 0, y = 40, stagger = 0.1, once = false, id }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const { staticScenes } = useMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.set(el, { opacity: 1, translate: "0px 0px" });
    if (staticScenes) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        Array.from(el.children),
        { y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.1,
          ease: "expo.out",
          delay,
          stagger,
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
