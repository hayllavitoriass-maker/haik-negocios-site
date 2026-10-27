"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useSceneProgress } from "@/components/motion/Scene";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/**
 * Seis "balões de conversa" que entram um a um, ligados ao progresso da cena.
 * Cada card tem uma janela de progresso; fora dela fica apagado e recuado.
 */
export function PainCards({ items, from, to }: { items: string[]; from: number; to: number }) {
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const n = items.length;

  useSceneProgress(from, to, (p) => {
    refs.current.forEach((el, i) => {
      if (!el) return;
      const start = i / (n + 1);
      const local = gsap.utils.clamp(0, 1, (p - start) / (1.6 / (n + 1)));
      const e = 1 - Math.pow(1 - local, 3);
      el.style.opacity = String(e);
      el.style.transform = `translate3d(0, ${(1 - e) * 48}px, 0) scale(${0.96 + 0.04 * e})`;
      el.style.filter = `blur(${(1 - e) * 6}px)`;
    });
  });

  return (
    <ul className="mx-auto grid w-full max-w-[1000px] gap-3 desk:grid-cols-2 desk:gap-4" aria-label="Frases comuns de quem procura a HAIK">
      {items.map((text, i) => (
        <li
          key={text}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={cn(
            "relative rounded-md bg-ink-800/85 px-5 py-4 text-[clamp(16px,1.4vw,20px)] leading-[1.45] text-white hairline-dark backdrop-blur-[12px] pointer-coarse:backdrop-blur-none will-change-[opacity,transform]",
            i % 2 === 0 ? "desk:mr-10" : "desk:ml-10",
          )}
          style={{ opacity: 0 }}
        >
          <span className="absolute -left-2 top-4 hidden size-8 place-items-center rounded-xs bg-red text-white desk:grid" aria-hidden="true">
            <Icon name="chat" className="size-4" />
          </span>
          <span className="mono mb-2 block text-red-300">{String(i + 1).padStart(2, "0")}</span>
          “{text}”
        </li>
      ))}
    </ul>
  );
}
