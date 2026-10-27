"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useMotion } from "@/components/motion/MotionProvider";
import { TypeLines } from "@/components/motion/TypeLines";
import { setStage } from "@/components/three/stage-store";
import type { MethodContent } from "@/content/pages/method";
import { cn } from "@/lib/cn";

type Step = MethodContent["steps"][number];

/**
 * Progressão C-L-A-R-O: uma rota vertical que se preenche com o scroll (scrub no
 * stroke-dashoffset), nós com a letra de cada etapa e painéis de vidro que acendem ao
 * entrar na viewport. A etapa ativa também vira o foco da cena 3D (formação "row").
 */
export function MethodRoute({ steps, deliverableLabel }: { steps: readonly Step[]; deliverableLabel: string }) {
  const rootRef = useRef<HTMLOListElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const { staticScenes } = useMotion();

  useEffect(() => {
    const root = rootRef.current;
    const path = pathRef.current;
    if (!root || !path) return;
    if (staticScenes) {
      gsap.set(path, { attr: { "stroke-dashoffset": 0 } });
      return;
    }
    // A linha acompanha o scroll diretamente (o Lenis já suaviza a rolagem).
    const st = ScrollTrigger.create({
      trigger: root,
      start: "top 62%",
      end: "bottom 62%",
      onUpdate: (self) => gsap.set(path, { attr: { "stroke-dashoffset": 1 - self.progress } }),
      onRefresh: (self) => gsap.set(path, { attr: { "stroke-dashoffset": 1 - self.progress } }),
    });
    return () => st.kill();
  }, [staticScenes]);

  return (
    <div className="relative">
      <svg aria-hidden="true" className="absolute bottom-10 left-[19px] top-6 w-[2px] desk:left-[35px]" viewBox="0 0 2 100" preserveAspectRatio="none">
        <path d="M1 0V100" className="stroke-[var(--hairline)]" strokeWidth="2" vectorEffect="non-scaling-stroke" fill="none" />
        <path
          ref={pathRef}
          d="M1 0V100"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset="1"
          className="stroke-red"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          fill="none"
        />
      </svg>
      <ol ref={rootRef} className="grid gap-10 desk:gap-14">
        {steps.map((step, i) => (
          <MethodStep key={step.letter + step.name} step={step} index={i} total={steps.length} deliverableLabel={deliverableLabel} />
        ))}
      </ol>
    </div>
  );
}

function MethodStep({ step, index, total, deliverableLabel }: { step: Step; index: number; total: number; deliverableLabel: string }) {
  const ref = useRef<HTMLLIElement>(null);
  const [entered, setEntered] = useState(false);
  const { staticScenes } = useMotion();
  const active = staticScenes || entered;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (staticScenes) {
      el.classList.add("is-in");
      return;
    }
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 64%",
      end: "bottom 36%",
      toggleClass: { targets: el, className: "is-in" },
      onEnter: () => {
        setEntered(true);
        setStage({ focus: index, progress: (index + 1) / total });
      },
      onEnterBack: () => setStage({ focus: index, progress: (index + 1) / total }),
    });
    return () => st.kill();
  }, [index, total, staticScenes]);

  // Identidade estável: o TypeLines reinicia a digitação quando o array muda.
  const lines = useMemo(
    () => [`> ${step.name.toLowerCase()}`, `→ etapa ${index + 1} de ${total}`, `→ ${step.deliverable}`],
    [step.name, step.deliverable, index, total],
  );
  const rest = step.name.startsWith(step.letter) ? step.name.slice(step.letter.length) : step.name;

  return (
    <li ref={ref} className="group relative grid grid-cols-[40px_minmax(0,1fr)] gap-4 desk:grid-cols-[72px_minmax(0,1fr)] desk:gap-8">
      <div className="relative flex justify-center pt-6">
        <span
          aria-hidden="true"
          className="grid size-10 place-items-center rounded-xs bg-[var(--bg)] font-display text-[16px] font-bold hairline transition-[background-color,color,box-shadow] duration-700 ease-[var(--ease-out)] group-[.is-in]:bg-red group-[.is-in]:text-white group-[.is-in]:shadow-[var(--shadow-tile)] desk:size-[72px] desk:text-[28px]"
        >
          {step.letter}
        </span>
      </div>
      <article className="glass-panel relative grid gap-6 overflow-hidden p-6 sm:p-8 desk:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] desk:gap-10 desk:p-10">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-2 -top-6 select-none font-display text-[clamp(120px,16vw,220px)] font-bold leading-none tracking-[-.06em] text-red/[.07] transition-colors duration-700 group-[.is-in]:text-red/[.13]"
        >
          {step.letter}
        </span>
        <div className="relative grid content-start gap-4">
          <div className="flex items-center gap-4">
            <span className="mono text-red">{String(index + 1).padStart(2, "0")}</span>
            <ol className="step-progress" aria-hidden="true">
              {Array.from({ length: total }, (_, j) => (
                <li key={j} className={cn(j <= index && "is-on")} />
              ))}
            </ol>
          </div>
          <h3 className="text-h3">
            <span className="text-red">{step.letter}</span>
            {rest}
          </h3>
          <p className="max-w-[56ch] text-[17px] leading-[1.6] text-[var(--fg-muted)]">{step.body}</p>
        </div>
        <div className="chapter--dark relative grid content-start gap-3 rounded-xs bg-ink-900 p-5 text-white">
          <p className="mono text-red-300">{deliverableLabel}</p>
          <TypeLines lines={lines} active={active} />
        </div>
      </article>
    </li>
  );
}
