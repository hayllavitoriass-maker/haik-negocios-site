"use client";

import { useSyncExternalStore } from "react";

/**
 * Estado compartilhado entre as seções (que sabem onde o usuário está) e a cena 3D
 * (que só reage). Sem dependência externa: store mínimo com useSyncExternalStore.
 *
 * Formações disponíveis para os tiles 3D (ver src/components/three/formations.ts):
 * ramp     rampa diagonal com onda (hero)
 * stream   túnel: objetos atravessam a profundidade (dores)
 * ring     anel em volta do título (o que a HAIK é)
 * board    tabuleiro/grade pousada no chão (serviços)
 * row      esteira em linhas (método, progressão)
 * rise     subida em espiral (bandeira IA)
 * stack    três planos empilhados (segmentos)
 * orbit    órbita em torno de um ponto (fundadores)
 * exhibit  destaque cinematográfico de um elemento (projetos)
 * settle   acomodação organizada (CTA final / rodapé)
 * drift    flutuação orgânica (páginas internas)
 */
export type Formation =
  | "ramp"
  | "stream"
  | "ring"
  | "board"
  | "row"
  | "rise"
  | "stack"
  | "orbit"
  | "exhibit"
  | "settle"
  | "drift";

export type StageTheme = "dark" | "light";

export type StageState = {
  formation: Formation;
  theme: StageTheme;
  /** Progresso 0..1 dentro do capítulo atual (anima câmera e transição entre formações). */
  progress: number;
  /** Índice do tile em destaque (exhibit) ou passo ativo (row). */
  focus: number | null;
  /** 0..1: quão presente a cena fica (páginas internas usam valores baixos). */
  intensity: number;
  /** Velocidade de scroll normalizada (-1..1), usada para "shake" e onda. */
  velocity: number;
  /** Cena desligada (ex.: painel, reduced motion com fallback estático). */
  enabled: boolean;
};

const initial: StageState = {
  formation: "drift",
  theme: "light",
  progress: 0,
  focus: null,
  intensity: 0.6,
  velocity: 0,
  enabled: true,
};

let state: StageState = initial;
const listeners = new Set<() => void>();

export function getStage(): StageState {
  return state;
}

export function setStage(partial: Partial<StageState>) {
  let changed = false;
  for (const key of Object.keys(partial) as (keyof StageState)[]) {
    if (state[key] !== partial[key]) {
      changed = true;
      break;
    }
  }
  if (!changed) return;
  state = { ...state, ...partial };
  listeners.forEach((l) => l());
}

export function subscribeStage(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useStage(): StageState {
  return useSyncExternalStore(subscribeStage, getStage, () => initial);
}
