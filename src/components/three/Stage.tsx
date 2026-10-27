"use client";

import { Component, Suspense, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { CameraRig } from "./CameraRig";
import { Environment } from "./Environment";
import { StageFallback } from "./StageFallback";
import { StageConfigContext, tileCount, type StageConfig } from "./stage-config";
import { getStage, subscribeStage, type StageState } from "./stage-store";
import { Tiles } from "./Tiles";
import "./stage.css";

/**
 * Cena WebGL persistente (React Three Fiber), montada uma vez pelo SiteShell e fixa atrás
 * de todo o conteúdo. Lê o estado de `stage-store` e reage a formação/tema/progresso.
 * Sem WebGL, com a cena desligada ou em erro: composição estática em CSS.
 */
const MAX_DPR = 1.75;

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Lê uma única chave do store (re-render só quando ESSA chave muda, não a cada scroll). */
function useStageKey<K extends keyof StageState>(key: K): StageState[K] {
  return useSyncExternalStore(
    subscribeStage,
    () => getStage()[key],
    () => getStage()[key],
  );
}

function useMediaFlag(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Retrato = altura > largura·1.15 (não só orientação, para tablets e janelas estreitas). */
function usePortrait(): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);
      return () => window.removeEventListener("resize", cb);
    },
    () => window.innerHeight > window.innerWidth * 1.15,
    () => false,
  );
}

function useDocumentHidden(): boolean {
  return useSyncExternalStore(
    (cb) => {
      document.addEventListener("visibilitychange", cb);
      return () => document.removeEventListener("visibilitychange", cb);
    },
    () => document.visibilityState === "hidden",
    () => false,
  );
}

/** Em modo "demand" (reduced motion / aba oculta) renderiza um frame a cada mudança do store. */
function DemandInvalidator() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => subscribeStage(() => invalidate()), [invalidate]);
  return null;
}

class StageBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") console.error("[stage] cena WebGL desativada:", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function StageCanvas({ reduced, portrait, coarse, hidden }: { reduced: boolean; portrait: boolean; coarse: boolean; hidden: boolean }) {
  const [ready, setReady] = useState(false);
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, MAX_DPR));
  const config = useMemo<StageConfig>(() => ({ count: tileCount(portrait, coarse), portrait, reduced, coarse }), [portrait, reduced, coarse]);
  const frameloop = reduced || hidden ? "demand" : "always";

  return (
    <div className={ready ? "stage is-ready" : "stage"} aria-hidden="true">
      <Canvas
        flat
        dpr={dpr}
        frameloop={frameloop}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: true, stencil: false }}
        camera={{ fov: 40, near: 0.1, far: 160, position: [0, 2.2, 9] }}
        // setTimeout (não rAF): a transição de opacidade começa mesmo com frames throttled
        onCreated={() => window.setTimeout(() => setReady(true), 60)}
      >
        <StageConfigContext.Provider value={config}>
          <PerformanceMonitor
            flipflops={3}
            onDecline={() => setDpr((d) => Math.max(1, Math.round((d - 0.25) * 4) / 4))}
            onIncline={() => setDpr((d) => Math.min(Math.min(window.devicePixelRatio || 1, MAX_DPR), Math.round((d + 0.25) * 4) / 4))}
            onFallback={() => setDpr(1)}
          />
          <DemandInvalidator />
          <Suspense fallback={null}>
            <Environment />
            <Tiles />
            <CameraRig />
          </Suspense>
        </StageConfigContext.Provider>
      </Canvas>
    </div>
  );
}

export function Stage() {
  const [support, setSupport] = useState<"unknown" | "ok" | "none">("unknown");
  const enabled = useStageKey("enabled");
  const reduced = useMediaFlag("(prefers-reduced-motion: reduce)");
  const coarse = useMediaFlag("(pointer: coarse)");
  const portrait = usePortrait();
  const hidden = useDocumentHidden();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- estado só conhecido no navegador, aplicado após a hidratação
    setSupport(detectWebGL() ? "ok" : "none");
  }, []);

  if (support === "unknown") return null;
  if (support === "none" || !enabled) return <StageFallback />;

  return (
    <StageBoundary fallback={<StageFallback />}>
      <StageCanvas reduced={reduced} portrait={portrait} coarse={coarse} hidden={hidden} />
    </StageBoundary>
  );
}
