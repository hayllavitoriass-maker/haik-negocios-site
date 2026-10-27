"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

/**
 * Registro único dos plugins (GSAP 3.13+ distribui SplitText e ScrambleText gratuitamente).
 * Importar este módulo garante que os plugins estão disponíveis em qualquer componente.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);
  gsap.defaults({ ease: "power3.out", duration: 1.2 });
}

export const GLYPHS = "░▒▓▌▐▀▄";
export const EASE_OUT = "expo.out";

/** Parâmetros oficiais da entrada por caractere (seção 09 da engenharia reversa). */
export const CHARS_IN = {
  yPercent: 100,
  opacity: 0,
  filter: "blur(6px)",
  duration: 1.4,
  stagger: 0.022,
  ease: "power3.out",
} as const;

export { gsap, ScrollTrigger, SplitText, ScrambleTextPlugin };

// Em desenvolvimento, expõe os objetos para inspeção no console do navegador.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as unknown as { __gsap?: unknown; __ScrollTrigger?: unknown }).__gsap = gsap;
  (window as unknown as { __gsap?: unknown; __ScrollTrigger?: unknown }).__ScrollTrigger = ScrollTrigger;
}
