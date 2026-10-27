import { Vector3 } from "three";
import type { Formation } from "./stage-store";

/**
 * Keyframes de câmera por formação (puros, testáveis em Node). `CameraRig` interpola entre
 * eles; aqui fica só a tabela e a conversão esférica → posição/alvo.
 */
export type CameraKey = {
  /** Azimute em graus (0 = de frente, +z). */
  azim: number;
  /** Elevação em graus. */
  elev: number;
  dist: number;
  /** Alvo (look-at) em x/y; z = 0. */
  pan: number;
  panY: number;
  fov: number;
  /** Variação da distância ao longo do capítulo (progress 0→1), efeito de dolly. */
  travel: number;
};

const key = (azim: number, elev: number, dist: number, pan: number, panY: number, fov: number, travel = 0): CameraKey => ({
  azim,
  elev,
  dist,
  pan,
  panY,
  fov,
  travel,
});

export const DESKTOP_KEYS: Record<Formation, CameraKey> = {
  ramp: key(0, 6, 11, 0, 0.3, 40, -1),
  stream: key(0, 2, 7, 0, 0.2, 48),
  ring: key(4, 30, 12.5, 0, 0.1, 40, 1),
  board: key(-14, 46, 13.5, 0, -0.8, 38, 1.5),
  row: key(8, 9, 10.5, 0, 0, 40),
  rise: key(-10, 12, 11.5, 0, 0.5, 40, -1.5),
  stack: key(34, 32, 12.5, 0, 0, 36, 1),
  orbit: key(0, 14, 10, 0, 0.4, 40),
  // enquadra EXHIBIT_ANCHOR.desktop (1.7, 0.25, 2.6) à direita do centro
  exhibit: key(0, 3, 9.5, 1.2, 0.3, 38),
  settle: key(-6, 16, 12.5, 1.5, -0.6, 40, 1),
  drift: key(0, 5, 11, 0.5, 0, 40),
};

/**
 * Retrato: mais perto, mais alto e olhando ACIMA dos tiles (panY +2): com a compressão
 * vertical feita em `tile-motion.ts`, todas as formações caem na faixa inferior da tela,
 * deixando o texto centralizado livre.
 */
const PORTRAIT_LIFT = 2.8;
export const PORTRAIT_KEYS: Record<Formation, CameraKey> = {
  ramp: key(0, 10, 9.5, 0, PORTRAIT_LIFT, 42, -0.8),
  stream: key(0, 4, 7, 0, PORTRAIT_LIFT, 50),
  ring: key(0, 18, 10, 0, PORTRAIT_LIFT, 42, 0.8),
  board: key(-8, 30, 11, 0, PORTRAIT_LIFT, 40, 1),
  row: key(4, 12, 9, 0, PORTRAIT_LIFT, 42),
  rise: key(-6, 14, 10, 0, PORTRAIT_LIFT, 42, -1),
  stack: key(30, 26, 10.5, 0, PORTRAIT_LIFT, 38, 0.8),
  orbit: key(0, 16, 8.5, 0, PORTRAIT_LIFT, 42),
  exhibit: key(0, 6, 8.5, 0, PORTRAIT_LIFT, 40),
  settle: key(-4, 18, 11, 0, PORTRAIT_LIFT, 42, 0.8),
  drift: key(0, 8, 10, 0.3, PORTRAIT_LIFT, 42),
};

export function cameraKeys(portrait: boolean): Record<Formation, CameraKey> {
  return portrait ? PORTRAIT_KEYS : DESKTOP_KEYS;
}

const DEG = Math.PI / 180;

/** Posição/alvo da câmera a partir de (azimute, elevação, distância, pan). Sem alocações. */
export function placeCamera(
  azimDeg: number,
  elevDeg: number,
  dist: number,
  pan: number,
  panY: number,
  outPosition: Vector3,
  outTarget: Vector3,
) {
  const az = azimDeg * DEG;
  const el = elevDeg * DEG;
  outTarget.set(pan, panY, 0);
  outPosition.set(
    outTarget.x + dist * Math.sin(az) * Math.cos(el),
    outTarget.y + dist * Math.sin(el),
    outTarget.z + dist * Math.cos(az) * Math.cos(el),
  );
}
