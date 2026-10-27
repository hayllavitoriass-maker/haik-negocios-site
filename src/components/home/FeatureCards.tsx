"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useSceneProgress } from "@/components/motion/Scene";
import { useMotion } from "@/components/motion/MotionProvider";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { IconTile, Icon, type IconName } from "@/components/ui/icons";
import { Tag } from "@/components/ui/Label";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type { HomeContent } from "@/content/pages/home";
import { cn } from "@/lib/cn";

const ICONS: Record<string, IconName> = {
  sites: "browser",
  sistemas: "layout",
  "automacoes-e-ia": "gear",
  marketing: "megaphone",
};

type Item = HomeContent["services"]["items"][number];

/**
 * Cards de serviço. Desktop: grade de 4 com entrada em cascata (scale .97, y 56, blur).
 * Mobile: pilha — cada card seguinte sobe de baixo e escurece o anterior, guiado pelo scroll.
 */
export function FeatureCards({ items, from, to }: { items: Item[]; from: number; to: number }) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const isMobile = useIsMobile();
  const { staticScenes } = useMotion();
  const n = items.length;

  useSceneProgress(from, to, (p) => {
    refs.current.forEach((el, i) => {
      if (!el) return;
      if (isMobile && !staticScenes) {
        // pilha: card i entra entre [i/n, (i+1)/n]
        const start = i / n;
        const local = i === 0 ? 1 : gsap.utils.clamp(0, 1, (p - start) / (0.9 / n));
        const e = 1 - Math.pow(1 - local, 3);
        const dimNext = i < n - 1 ? gsap.utils.clamp(0, 1, (p - (i + 1) / n) / (0.9 / n)) : 0;
        el.style.transform = `translate3d(0, ${(1 - e) * 100}vh, 0) scale(${1 - dimNext * 0.04})`;
        el.style.setProperty("--dim", String(dimNext * 0.7));
        el.style.opacity = "1";
        return;
      }
      const start = (i / (n + 1)) * 0.5;
      const local = gsap.utils.clamp(0, 1, (p - start) / 0.3);
      const e = 1 - Math.pow(1 - local, 3);
      el.style.opacity = String(e);
      el.style.transform = `translate3d(0, ${(1 - e) * 56}px, 0) scale(${0.97 + 0.03 * e})`;
      el.style.setProperty("--dim", "0");
    });
  });

  return (
    <div
      className={cn(
        "mx-auto w-full",
        isMobile ? "grid [grid-template-areas:'stack'] place-items-start" : "grid gap-[clamp(12px,1.4vw,20px)] desk:grid-cols-2 lg:grid-cols-4",
      )}
    >
      {items.map((item, i) => (
        <article
          key={item.slug}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={cn(
            "relative grid w-full grid-rows-[auto_1fr_auto_auto] gap-5 rounded-md bg-white px-2 pb-[18px] pt-2 text-ink shadow-[var(--shadow-card-light)] will-change-[opacity,transform] after:pointer-events-none after:absolute after:inset-0 after:rounded-md after:bg-ink-900 after:opacity-[var(--dim,0)] after:transition-opacity",
            isMobile && "[grid-area:stack] mx-auto max-w-[360px] origin-top",
          )}
          style={{ opacity: isMobile ? 1 : 0, ["--dim" as string]: 0 }}
        >
          <div className="relative grid aspect-[16/9] place-items-center overflow-hidden rounded-sm bg-red-50 grid-bg">
            <div className="absolute inset-0 bg-[radial-gradient(70%_80%_at_50%_115%,rgba(234,25,35,.45),transparent_70%)]" aria-hidden="true" />
            <span className="mono absolute left-3 top-[11px] text-red-700">{String(i + 1).padStart(2, "0")}</span>
            <IconTile name={ICONS[item.slug] ?? "cube"} size={64} className="relative scale-[1.2]" />
          </div>
          <div className="grid content-start gap-2.5 px-3.5">
            <h3 className="text-card font-display font-semibold">{item.title}</h3>
            <p className="text-[15px] leading-[1.55] text-grey-600">{item.body}</p>
          </div>
          <ul className="flex flex-wrap gap-1.5 px-3.5" aria-label="Exemplos">
            {item.tags.map((t) => (
              <li key={t}>
                <Tag>{t}</Tag>
              </li>
            ))}
          </ul>
          <TransitionLink
            href={`/servicos/${item.slug}`}
            className="group mx-3.5 flex items-center justify-between border-t border-grey-200 pt-3.5 text-[14px] transition-colors duration-300 hover:text-red-700"
          >
            {item.cta}
            <Icon name="arrow" className="size-4 text-red-700 transition-transform duration-[400ms] ease-[var(--ease-out)] group-hover:translate-x-1" />
          </TransitionLink>
        </article>
      ))}
    </div>
  );
}
