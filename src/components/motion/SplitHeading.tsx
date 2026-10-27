"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { CHARS_IN, gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { useMotion } from "./MotionProvider";
import { cn } from "@/lib/cn";

type Props = {
  as?: ElementType;
  id?: string;
  className?: string;
  /** Texto completo (acessível). Quebras de linha explícitas com "\n". */
  text: string;
  /** Palavra ou trecho a destacar em vermelho. */
  highlight?: string;
  /** "chars" (letras) ou "words". */
  mode?: "chars" | "words";
  /** Dispara imediatamente ao montar (hero) em vez de esperar o scroll. */
  immediate?: boolean;
  delay?: number;
  children?: ReactNode;
};

/**
 * Título com entrada por caractere (SplitText): cada letra sobe com blur, em stagger.
 * O texto fica semanticamente íntegro: aria-label com a frase completa e as divs
 * geradas marcadas como aria-hidden.
 */
export function SplitHeading({ as: Tag = "h2", id, className, text, highlight, mode = "chars", immediate, delay = 0 }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const { staticScenes } = useMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || staticScenes) return;
    let split: SplitText | null = null;
    let ctx: ReturnType<typeof gsap.context> | null = null;
    // Dividir em letras custa layout: só fazemos quando o título está perto de aparecer.
    const observer = immediate
      ? null
      : new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              observer?.disconnect();
              run();
            }
          },
          { rootMargin: "120% 0px" },
        );
    const run = () => {
    ctx = gsap.context(() => {
      split = SplitText.create(el, {
        type: mode === "chars" ? "lines,words,chars" : "lines,words",
        linesClass: "emerge-line",
        wordsClass: "split-word",
        charsClass: "split-char",
        autoSplit: true,
        onSplit: (self) => {
          const targets = mode === "chars" ? self.chars : self.words;
          gsap.set(el, { visibility: "visible" });
          return gsap.from(targets, {
            ...CHARS_IN,
            stagger: mode === "chars" ? CHARS_IN.stagger : 0.04,
            delay,
            scrollTrigger: immediate
              ? undefined
              : { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
          });
        },
      });
    }, el);
    };
    if (immediate) run();
    else observer?.observe(el);
    return () => {
      observer?.disconnect();
      ctx?.revert();
      split?.revert();
    };
  }, [text, mode, immediate, delay, staticScenes]);

  const lines = text.split("\n");
  // Sem quebras explícitas o texto fica "solto" no elemento, para o SplitText medir as linhas reais.
  const content =
    lines.length === 1
      ? renderHighlight(text, highlight)
      : lines.map((line, i) => (
          <span key={i} className="block">
            {renderHighlight(line, highlight)}
          </span>
        ));

  return (
    <Tag ref={ref} id={id} className={cn(className)} aria-label={text.replace(/\n/g, " ")} data-chars>
      {content}
    </Tag>
  );
}

function renderHighlight(line: string, highlight?: string) {
  if (!highlight) return line;
  const idx = line.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) return line;
  const before = line.slice(0, idx);
  const match = line.slice(idx, idx + highlight.length);
  const after = line.slice(idx + highlight.length);
  return (
    <>
      {before}
      <span className="text-red">{match}</span>
      {after}
    </>
  );
}

/** Mantém o ScrollTrigger atualizado quando fontes carregam (evita recortes nas linhas). */
export function useRefreshOnFonts() {
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);
}
