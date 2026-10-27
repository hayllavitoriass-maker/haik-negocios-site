"use client";

import { useRef } from "react";
import { useSceneProgress } from "./Scene";
import { cn } from "@/lib/cn";

/**
 * Frase de impacto apresentada como objeto selecionado num editor que dá zoom de 10% a 100%.
 * `--z` controla a escala; bordas, alças e readout são divididas por --z para manter o
 * tamanho visual durante a escala (técnica da referência).
 */
export function Statement({ lines, from = 0.1, to = 0.6, className, id }: { lines: string[]; from?: number; to?: number; className?: string; id?: string }) {
  const frame = useRef<HTMLDivElement | null>(null);
  const readout = useRef<HTMLSpanElement | null>(null);

  useSceneProgress(from, to, (p) => {
    // easing power2.inOut
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const z = 0.1 + 0.9 * e;
    frame.current?.style.setProperty("--z", z.toFixed(4));
    if (readout.current) readout.current.textContent = `${Math.round(z * 100)}%`;
  });

  return (
    <div className={cn("statement", className)}>
      <div ref={frame} className="statement__frame" style={{ ["--z" as string]: 0.1 }}>
        <span ref={readout} className="statement__readout" aria-hidden="true">
          10%
        </span>
        <span className="statement__handle statement__handle--tl" aria-hidden="true" />
        <span className="statement__handle statement__handle--tr" aria-hidden="true" />
        <span className="statement__handle statement__handle--bl" aria-hidden="true" />
        <span className="statement__handle statement__handle--br" aria-hidden="true" />
        <p id={id} className="grid justify-items-center whitespace-nowrap text-statement font-display font-semibold">
          {lines.map((l, i) => (
            <span key={i} className="block">
              {l}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
