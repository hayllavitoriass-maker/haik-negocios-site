"use client";

import { createContext, useContext, useEffect, useEffectEvent, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { useChapters } from "./ChapterProvider";
import { useMotion } from "./MotionProvider";
import { setStage, type Formation, type StageTheme } from "@/components/three/stage-store";

/**
 * Cena sticky: a seção tem N viewports de altura e um frame fixo de 100svh.
 * As camadas (SceneLayer) aparecem conforme o progresso do scroll dentro da seção.
 * Em modo estático (reduced motion / escolha do visitante) tudo vira fluxo normal.
 */
const SceneContext = createContext<{ el: React.RefObject<HTMLElement | null> } | null>(null);

export type SceneProps = {
  id: string;
  index: number;
  label: string;
  theme: StageTheme;
  formation: Formation;
  /** Altura em viewports (svh). Ex.: 2.5 = 250svh. */
  height?: number;
  className?: string;
  frameClassName?: string;
  children: ReactNode;
  /** Último capítulo: aciona "fim da página" para esconder indicadores. */
  isLast?: boolean;
};

export function Scene({ id, index, label, theme, formation, height = 2.5, className, frameClassName, children, isLast }: SceneProps) {
  const ref = useRef<HTMLElement | null>(null);
  const { register, activate, setProgress, setAtEnd } = useChapters();
  const { staticScenes } = useMotion();

  useEffect(() => register({ id, index, label, theme, formation }), [register, id, index, label, theme, formation]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 55%",
        end: "bottom 45%",
        onToggle: (self) => {
          if (self.isActive) activate(id, self.progress);
          if (isLast) setAtEnd(self.isActive && self.progress > 0.6);
        },
        onUpdate: (self) => {
          if (self.isActive) {
            setProgress(self.progress);
            setStage({ velocity: gsap.utils.clamp(-1, 1, self.getVelocity() / 3000) });
            if (isLast) setAtEnd(self.progress > 0.6);
          }
        },
      });
      // Sincronização inicial: se a página já carregou dentro desta cena, ativa o capítulo.
      const y = st.scroll();
      if (y >= st.start && y <= st.end) activate(id, st.progress);
    }, el);
    return () => ctx.revert();
  }, [id, activate, setProgress, isLast, setAtEnd, staticScenes]);

  const style: CSSProperties = staticScenes ? {} : { height: `${height * 100}svh` };

  return (
    <SceneContext.Provider value={{ el: ref }}>
      <section
        ref={ref}
        id={id}
        className={cn("scene", className)}
        style={style}
        data-chapter={id}
        aria-labelledby={`${id}-title`}
      >
        <div className={cn("scene__frame", theme === "dark" ? "chapter--dark" : "chapter--light", frameClassName)}>{children}</div>
      </section>
    </SceneContext.Provider>
  );
}

export type SceneLayerProps = {
  /** Frações 0..1 do intervalo (altura da seção − viewport) em que a camada fica visível. */
  in: number;
  out?: number;
  className?: string;
  children: ReactNode;
  as?: "div" | "article";
  /** Mantém a camada interativa mesmo fora da janela (ex.: formulário). */
  alwaysInteractive?: boolean;
};

export function SceneLayer({ in: dataIn, out = 1, className, children, as: Tag = "div", alwaysInteractive }: SceneLayerProps) {
  const scene = useContext(SceneContext);
  const ref = useRef<HTMLDivElement | null>(null);
  const { staticScenes } = useMotion();

  useEffect(() => {
    const layer = ref.current;
    const sceneEl = scene?.el.current;
    if (!layer || !sceneEl) return;
    if (staticScenes) {
      layer.classList.add("is-in");
      layer.classList.remove("is-past");
      layer.removeAttribute("inert");
      return;
    }
    const range = () => Math.max(1, sceneEl.offsetHeight - window.innerHeight);
    const setInert = (visible: boolean) => {
      if (alwaysInteractive) return;
      if (visible) layer.removeAttribute("inert");
      else layer.setAttribute("inert", "");
    };
    setInert(false);
    const enter = () => {
      layer.classList.add("is-in");
      layer.classList.remove("is-past");
      setInert(true);
    };
    // `out >= 1` significa "fica visível até a cena sair da tela" (evita vazio enquanto o
    // frame sticky é liberado e rola para fora).
    const trigger = ScrollTrigger.create({
      trigger: sceneEl,
      start: () => `top+=${dataIn * range()} top`,
      end: () => (out >= 1 ? "bottom top" : `top+=${out * range()} top`),
      invalidateOnRefresh: true,
      onEnter: enter,
      onEnterBack: enter,
      onLeave: () => {
        layer.classList.remove("is-in");
        layer.classList.add("is-past");
        setInert(false);
      },
      onLeaveBack: () => {
        layer.classList.remove("is-in", "is-past");
        setInert(false);
      },
    });
    // Estado inicial (carregamento no meio da página ou no topo): `isActive` só é calculado
    // no primeiro update, então comparamos a posição atual com start/end manualmente.
    const y = trigger.scroll();
    if (y >= trigger.start && y <= trigger.end) enter();
    else if (y > trigger.end) layer.classList.add("is-past");
    return () => {
      trigger.kill();
      layer.removeAttribute("inert");
    };
  }, [scene, dataIn, out, staticScenes, alwaysInteractive]);

  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={cn("scene__layer", className)} data-in={dataIn} data-out={out}>
      {children}
    </Tag>
  );
}

/**
 * Faixa de progresso da cena: executa `onProgress` com 0..1 enquanto a cena está entre
 * `from` e `to`. Útil para sincronizar linhas animadas, estados de etapa e a cena 3D.
 */
export function useSceneProgress(from: number, to: number, onProgress: (p: number) => void) {
  const scene = useContext(SceneContext);
  const onProgressEvent = useEffectEvent(onProgress);
  const { staticScenes } = useMotion();
  useEffect(() => {
    const sceneEl = scene?.el.current;
    if (!sceneEl) return;
    if (staticScenes) {
      onProgressEvent(1);
      return;
    }
    const range = () => Math.max(1, sceneEl.offsetHeight - window.innerHeight);
    const trigger = ScrollTrigger.create({
      trigger: sceneEl,
      start: () => `top+=${from * range()} top`,
      end: () => `top+=${to * range()} top`,
      invalidateOnRefresh: true,
      onUpdate: (self) => onProgressEvent(self.progress),
    });
    return () => trigger.kill();
  }, [scene, from, to, staticScenes]);
}
