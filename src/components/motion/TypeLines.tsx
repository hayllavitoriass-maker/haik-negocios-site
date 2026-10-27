"use client";

import { useEffect, useRef, useState } from "react";
import { useMotion } from "./MotionProvider";
import { cn } from "@/lib/cn";

/**
 * Terminal: linhas digitadas caractere a caractere (26 ms/char, 380 ms entre linhas),
 * com cursor vermelho piscando na linha ativa. O texto completo fica em
 * `visually-hidden` para leitores de tela. Reinicia quando `active` volta a ser true.
 */
type Props = { lines: string[]; className?: string; active?: boolean; charMs?: number; lineMs?: number };

export function TypeLines({ lines, className, active = true, charMs = 26, lineMs = 380 }: Props) {
  const { staticScenes } = useMotion();
  const [typed, setTyped] = useState<string[]>(() => lines.map(() => ""));
  const [activeLine, setActiveLine] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (staticScenes) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- estado só conhecido no navegador, aplicado após a hidratação
      setTyped(lines);
      setActiveLine(lines.length - 1);
      return;
    }
    if (!active) return;
    setTyped(lines.map(() => ""));
    setActiveLine(0);
    let line = 0;
    let char = 0;
    const step = () => {
      if (line >= lines.length) return;
      const current = lines[line] ?? "";
      const at = line;
      char += 1;
      const slice = current.slice(0, char);
      setTyped((prev) => {
        const next = [...prev];
        next[at] = slice;
        return next;
      });
      if (char >= current.length) {
        line += 1;
        char = 0;
        if (line < lines.length) {
          timer.current = window.setTimeout(() => {
            setActiveLine(line);
            step();
          }, lineMs);
        }
      } else {
        timer.current = window.setTimeout(step, charMs);
      }
    };
    timer.current = window.setTimeout(step, 200);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [lines, active, staticScenes, charMs, lineMs]);

  return (
    <div className={cn("font-mono text-[13px] uppercase tracking-[.08em] leading-[1.6]", className)}>
      <p className="visually-hidden">{lines.join(" ")}</p>
      <div aria-hidden="true">
        {lines.map((l, i) => (
          <div key={i} className={cn(i === 0 ? "text-[var(--fg)]" : "text-[var(--fg-muted)]", "whitespace-pre-wrap")}>
            {typed[i]}
            {i === activeLine && typed[i].length < l.length && <span className="type-cursor" />}
          </div>
        ))}
      </div>
    </div>
  );
}
