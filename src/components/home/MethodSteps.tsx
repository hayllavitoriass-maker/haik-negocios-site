"use client";

import { useRef, useState, type ReactNode } from "react";
import { useSceneProgress } from "@/components/motion/Scene";
import { TypeLines } from "@/components/motion/TypeLines";
import { setStage } from "@/components/three/stage-store";
import { cn } from "@/lib/cn";

type Step = { letter: string; name: string; body: string };

/**
 * Rota SVG (1000×220) com trilha tracejada e linha vermelha desenhada progressivamente,
 * cinco nós que acendem e rótulos das etapas. Oculta no mobile (como na referência).
 */
export function MethodRoute({ steps, from, to }: { steps: Step[]; from: number; to: number }) {
  const line = useRef<SVGPathElement | null>(null);
  const head = useRef<SVGCircleElement | null>(null);
  const [active, setActive] = useState(-1);
  const n = steps.length;
  const points = steps.map((_, i) => ({ x: 40 + (920 * i) / (n - 1), y: i % 2 === 0 ? 150 : 70 }));
  const d = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `C${points[i - 1].x + 120},${points[i - 1].y} ${p.x - 120},${p.y} ${p.x},${p.y}`)).join(" ");
  const LENGTH = 1400; // comprimento aproximado; ajustado em runtime

  useSceneProgress(from, to, (p) => {
    const path = line.current;
    if (!path) return;
    const len = path.getTotalLength() || LENGTH;
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len * (1 - p)}`;
    const pt = path.getPointAtLength(len * p);
    head.current?.setAttribute("cx", String(pt.x));
    head.current?.setAttribute("cy", String(pt.y));
    const idx = Math.min(n - 1, Math.floor(p * n + 0.0001));
    setActive((prev) => (prev === idx ? prev : idx));
    setStage({ focus: idx });
  });

  return (
    <div className="pointer-events-auto mx-auto w-full max-w-[920px]" style={{ aspectRatio: "1000 / 220" }}>
      <svg viewBox="0 0 1000 220" className="h-full w-full overflow-visible" aria-hidden="true">
        <path d={d} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1.5" strokeDasharray="3 6" vectorEffect="non-scaling-stroke" />
        <path ref={line} d={d} fill="none" stroke="#EA1923" strokeWidth="2.5" vectorEffect="non-scaling-stroke" style={{ strokeDasharray: LENGTH, strokeDashoffset: LENGTH }} />
        {points.map((p, i) => (
          <g key={i}>
            <rect x={p.x - 7} y={p.y - 7} width="14" height="14" fill={i <= active ? "#EA1923" : "#0b0b0b"} stroke={i <= active ? "#EA1923" : "rgba(255,255,255,.4)"} strokeWidth="1.5" />
            <text
              x={p.x}
              y={p.y + (i % 2 === 0 ? 34 : -22)}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="11"
              letterSpacing="1"
              fill={i <= active ? "#fff" : "rgba(255,255,255,.45)"}
            >
              {String(i + 1).padStart(2, "0")} {steps[i].name.toUpperCase()}
            </text>
          </g>
        ))}
        <circle ref={head} r="5" fill="#fff" cx={points[0].x} cy={points[0].y} />
      </svg>
    </div>
  );
}

/** Painel de etapa: letra grande, nome, texto, terminal e progresso. */
export function MethodStep({
  index,
  total,
  letter,
  name,
  body,
  log,
  from,
  to,
  cta,
}: {
  index: number;
  total: number;
  letter: string;
  name: string;
  body: string;
  log: string[];
  from: number;
  to: number;
  cta?: ReactNode;
}) {
  const [active, setActive] = useState(false);
  useSceneProgress(from, to, (p) => {
    const on = p > 0 && p < 1;
    setActive((prev) => (prev === on ? prev : on));
  });
  const light = index % 2 === 0;
  return (
    <div
      className={cn(
        "grid w-[min(520px,100%)] gap-4 rounded-xs p-5 backdrop-blur-[12px] pointer-coarse:backdrop-blur-none desk:ml-[max(0px,calc(6vw-var(--gutter)))] desk:gap-5 desk:p-6",
        light ? "bg-white/90 text-ink shadow-[inset_0_0_0_1px_rgba(23,23,23,.12)]" : "bg-ink-900/85 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.12)]",
      )}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xs bg-red font-display text-[22px] font-bold text-white">{letter}</span>
        <span className="mono opacity-70">
          Etapa {index + 1} de {total}
        </span>
      </div>
      <h3 className="text-h3 font-display font-semibold">{name}</h3>
      <p className={cn("text-[16px] leading-[1.6]", light ? "text-grey-600" : "text-grey-300")}>{body}</p>
      <div className={cn("border-t pt-3.5", light ? "border-ink/10" : "border-white/10")}>
        <TypeLines lines={log} active={active} />
      </div>
      <ol className="step-progress" aria-label={`Etapa ${index + 1} de ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <li key={i} className={cn(i <= index && "is-on")} aria-current={i === index ? "step" : undefined} />
        ))}
      </ol>
      {cta}
    </div>
  );
}
