"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { useSceneProgress } from "@/components/motion/Scene";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { setStage } from "@/components/three/stage-store";
import { Tag } from "@/components/ui/Label";
import { Icon } from "@/components/ui/icons";
import type { PublicProject } from "@/server/repos/public";
import { cn } from "@/lib/cn";

/**
 * Galeria cinematográfica: um projeto em destaque por vez (o índice ativo acompanha o scroll
 * e é enviado à cena 3D como `focus`). A "tela" do projeto usa a capa real quando existir.
 */
export function ProjectExhibit({ projects, demoBadge, from, to }: { projects: PublicProject[]; demoBadge: string; from: number; to: number }) {
  const [active, setActive] = useState(0);
  const n = Math.max(1, projects.length);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useSceneProgress(from, to, (p) => {
    const idx = Math.min(n - 1, Math.floor(p * n));
    setActive((prev) => (prev === idx ? prev : idx));
    setStage({ focus: idx });
    refs.current.forEach((el, i) => {
      if (!el) return;
      const local = gsap.utils.clamp(0, 1, 1 - Math.abs(p * n - (i + 0.5)) * 1.2);
      el.style.opacity = String(0.15 + 0.85 * local);
      el.style.transform = `translate3d(0, ${(1 - local) * 24}px, 0)`;
    });
  });

  if (projects.length === 0) return null;

  return (
    <div className="mx-auto grid w-full max-w-[1100px] items-center gap-6 desk:grid-cols-[minmax(0,400px)_minmax(0,1fr)] desk:gap-10">
      <div className="grid [grid-template-areas:'stack']">
        {projects.map((project, i) => (
          <article
            key={project.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={cn("grid gap-4 [grid-area:stack] will-change-[opacity,transform]", i !== active && "pointer-events-none")}
            aria-hidden={i !== active}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono inline-flex gap-[3px]">
                <span className="rounded-xs bg-red px-[7px] py-[5px] text-white">{String(i + 1).padStart(2, "0")}</span>
                <span className="rounded-xs bg-ink px-[7px] py-[5px] text-white">{project.client ?? project.segment ?? "Projeto"}</span>
              </span>
              {project.isDemo && <Tag tone="line">{demoBadge}</Tag>}
            </div>
            <h3 className="text-h3 font-display font-semibold text-ink">{project.title}</h3>
            <p className="text-[16px] leading-[1.6] text-grey-600">{project.summary || project.solution}</p>
            <ul className="flex flex-wrap gap-1.5" aria-label="Serviços">
              {project.services.map((s) => (
                <li key={s}>
                  <Tag>{s}</Tag>
                </li>
              ))}
            </ul>
            <TransitionLink href={`/projetos/${project.slug}`} className="group inline-flex w-fit items-center gap-2 border-b border-red pb-0.5 font-mono text-[13px] uppercase tracking-[.08em] text-ink">
              Ver projeto <Icon name="arrow" className="size-3.5 transition-transform group-hover:translate-x-1" />
            </TransitionLink>
          </article>
        ))}
      </div>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md bg-ink-900 shadow-[0_40px_90px_-40px_rgba(23,23,23,.5)] hairline-light [transform:perspective(1200px)_rotateY(-6deg)]">
        {projects.map((project, i) => (
          <div key={project.id} className={cn("absolute inset-0 transition-opacity duration-700", i === active ? "opacity-100" : "opacity-0")} aria-hidden={i !== active}>
            {project.cover ? (
              <Image src={project.cover.url} alt={project.cover.alt || project.title} fill sizes="(max-width: 900px) 100vw, 640px" className="object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center grid-bg">
                <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_100%,rgba(234,25,35,.5),transparent_70%)]" />
                <div className="relative grid gap-3 text-center text-white">
                  <span className="mx-auto size-14 rounded-xs bg-red shadow-[var(--shadow-tile)]" />
                  <span className="mono text-white/70">{project.isDemo ? "projeto em construção" : "imagens em breve"}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        <div className="absolute left-3 top-3 flex gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-white/40" />
          <span className="size-2 rounded-full bg-white/40" />
          <span className="size-2 rounded-full bg-red" />
        </div>
      </div>
    </div>
  );
}
