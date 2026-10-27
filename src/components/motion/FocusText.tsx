"use client";

import { useEffect, useMemo, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useMotion } from "./MotionProvider";
import { cn } from "@/lib/cn";

/**
 * Manifesto com palavras-chave: conforme o scroll, as palavras entram em cascata,
 * as chaves recebem a varredura vermelha e as demais perdem peso (500 → 300),
 * sem reflow graças à fonte variável.
 */
type Props = {
  text: string;
  keys: string[];
  className?: string;
  as?: "p" | "h2" | "h3";
  id?: string;
};

type Token = { text: string; key: boolean; keyIndex: number };

function tokenize(text: string, keys: string[]): Token[] {
  const lowerKeys = keys.map((k) => k.toLowerCase());
  const tokens: Token[] = [];
  let rest = text;
  let keyIndex = 0;
  while (rest.length) {
    let best: { idx: number; len: number } | null = null;
    for (const k of lowerKeys) {
      const idx = rest.toLowerCase().indexOf(k);
      if (idx !== -1 && (!best || idx < best.idx)) best = { idx, len: k.length };
    }
    if (!best) {
      tokens.push(...rest.split(/(\s+)/).filter(Boolean).map((t) => ({ text: t, key: false, keyIndex: -1 })));
      break;
    }
    const before = rest.slice(0, best.idx);
    tokens.push(...before.split(/(\s+)/).filter(Boolean).map((t) => ({ text: t, key: false, keyIndex: -1 })));
    tokens.push({ text: rest.slice(best.idx, best.idx + best.len), key: true, keyIndex: keyIndex++ });
    rest = rest.slice(best.idx + best.len);
  }
  return tokens;
}

export function FocusText({ text, keys, className, as: Tag = "p", id }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const { staticScenes } = useMotion();
  const tokens = useMemo(() => tokenize(text, keys), [text, keys]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (staticScenes) {
      el.querySelectorAll<HTMLElement>(".focus-key").forEach((k) => {
        k.style.setProperty("--sweep", "100%");
        k.classList.add("is-on");
      });
      return;
    }
    const ctx = gsap.context(() => {
      const words = el.querySelectorAll<HTMLElement>(".focus-text__word");
      const keyEls = el.querySelectorAll<HTMLElement>(".focus-key");
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.4 },
      });
      tl.from(words, { yPercent: 60, opacity: 0, filter: "blur(6px)", stagger: 0.12, duration: 1, ease: "power3.out" });
      keyEls.forEach((k, i) => {
        tl.to(k, { "--sweep": "100%", duration: 0.45, ease: "power2.out", onStart: () => k.classList.add("is-on"), onReverseComplete: () => k.classList.remove("is-on") }, `>-${0.3 - i * 0.05}`);
      });
      tl.to(
        Array.from(words).filter((w) => !w.classList.contains("focus-key")),
        { "--wght": 300, duration: 0.55, ease: "sine.inOut" },
        "<",
      );
    }, el);
    return () => ctx.revert();
  }, [tokens, staticScenes]);

  return (
    <Tag ref={ref as React.RefObject<HTMLParagraphElement>} id={id} className={cn("focus-text", className)}>
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">
        {tokens.map((t, i) =>
          /^\s+$/.test(t.text) ? (
            " "
          ) : (
            <span key={i} className={cn("focus-text__word", t.key && "focus-key")}>
              {t.text}
            </span>
          ),
        )}
      </span>
    </Tag>
  );
}
