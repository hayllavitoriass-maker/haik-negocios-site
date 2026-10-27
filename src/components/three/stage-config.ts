"use client";

import { createContext, useContext } from "react";
import type { Icon3DName } from "./icons3d";

/** Configuração estática da cena (decidida fora do Canvas, lida por todos os componentes). */
export type StageConfig = {
  /** Quantidade de tiles (12 desktop, 8 retrato, 10 touch paisagem). */
  count: number;
  /** Viewport retrato (altura > largura·1.15): layout próprio e câmera mais próxima. */
  portrait: boolean;
  /** prefers-reduced-motion: formações "pulam" para o alvo, sem deriva de câmera. */
  reduced: boolean;
  /** pointer: coarse (touch): menos tiles e partículas. */
  coarse: boolean;
};

export const DEFAULT_STAGE_CONFIG: StageConfig = { count: 12, portrait: false, reduced: false, coarse: false };

export const StageConfigContext = createContext<StageConfig>(DEFAULT_STAGE_CONFIG);

export function useStageConfig(): StageConfig {
  return useContext(StageConfigContext);
}

export function tileCount(portrait: boolean, coarse: boolean): number {
  if (portrait) return 8;
  return coarse ? 10 : 12;
}

/** 12 símbolos para desktop (marketing → tecnologia → design → dados). */
const DESKTOP_ICONS: Icon3DName[] = ["megaphone", "chart", "target", "chat", "braces", "code", "chip", "cube", "gear", "network", "cursor", "layout"];
/** 8 símbolos para telas estreitas. */
const COMPACT_ICONS: Icon3DName[] = ["megaphone", "chart", "chat", "code", "chip", "gear", "network", "cursor"];

export function pickIcons(count: number): Icon3DName[] {
  const base = count <= 8 ? COMPACT_ICONS : DESKTOP_ICONS;
  return Array.from({ length: count }, (_, i) => base[i % base.length]);
}
