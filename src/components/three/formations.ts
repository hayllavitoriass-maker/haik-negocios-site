import { Euler, Vector3 } from "three";
import type { Formation } from "./stage-store";

/**
 * Formações: funções puras `(index, count, params, out) => Pose` que descrevem onde cada
 * tile está AGORA para uma formação. Não há estado aqui: o movimento contínuo (ondas,
 * órbitas, esteiras) vem de `params.time`/`params.progress`; a suavização entre formações
 * fica em `tile-motion.ts`.
 *
 * Unidades: mundo Three.js. Tiles medem 1×1×0.24. A câmera fica a ~7–13 de distância com
 * fov 40, logo ±4 em y e ±7 em x (16:9) são os limites visíveis aproximados.
 */

export const FORMATIONS: readonly Formation[] = ["ramp", "stream", "ring", "board", "row", "rise", "stack", "orbit", "exhibit", "settle", "drift"];

/** Ângulo de ouro (rad): distribui pontos numa espiral sem alinhamentos visíveis. */
export const GOLDEN_ANGLE = 2.39996;
/** Plano do chão (grid) — os tiles de `board` pousam logo acima. */
export const FLOOR_Y = -1.8;
/** Onde o tile em destaque fica em `exhibit` (a câmera enquadra este ponto). */
export const EXHIBIT_ANCHOR = {
  desktop: new Vector3(1.7, 0.25, 2.6),
  portrait: new Vector3(0, 1.0, 2.0),
};

const TAU = Math.PI * 2;

export type FormationParams = {
  /** Tempo em segundos (relógio da cena). */
  time: number;
  /** Progresso 0..1 dentro do capítulo. */
  progress: number;
  focus: number | null;
  intensity: number;
  velocity: number;
  portrait: boolean;
  /** Largura/altura do viewport (para compor a cena à direita do texto). */
  aspect: number;
  /** Aleatórios determinísticos do tile, em [0,1). Preenchidos por TileMotion. */
  seed: number;
  seed2: number;
  seed3: number;
};

export type Pose = { position: Vector3; rotation: Euler; scale: number };

export function createPose(): Pose {
  return { position: new Vector3(), rotation: new Euler(), scale: 1 };
}

export type FormationFn = (index: number, count: number, p: FormationParams, out: Pose) => Pose;

function fract(x: number) {
  return x - Math.floor(x);
}

function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function smoothstep(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/**
 * Índice em destaque: o explícito (`focus`) ou, quando nulo, o passo derivado do progresso
 * do capítulo (o destaque percorre os tiles conforme o usuário rola).
 */
export function resolveFocus(focus: number | null, progress: number, count: number): number {
  if (count <= 0) return 0;
  if (focus !== null && Number.isFinite(focus)) return ((Math.round(focus) % count) + count) % count;
  return Math.min(count - 1, Math.floor(clamp01(progress) * count));
}

/** Rampa diagonal (hero): desce do canto superior esquerdo ao inferior direito com onda contínua. */
const ramp: FormationFn = (i, n, p, out) => {
  const u = n > 1 ? i / (n - 1) : 0.5;
  const sx = p.portrait ? 0.36 : 1;
  // onda viajante ao longo da rampa (fase avança com o tempo, atrasa por posição)
  const wave = Math.sin(p.time * 0.85 - u * 4.6 + p.seed * 0.6);
  const x = (u - 0.5) * 13 * sx + (p.portrait ? 0 : 1.0) + p.progress * 1.5;
  // o título do hero vive embaixo à esquerda: a rampa deixa esse canto livre
  const y = (0.5 - u) * (p.portrait ? 6.5 : 3.4) + wave * 0.45 + 0.6 - p.progress * 1.2;
  const z = -1.8 - u * 1.6 + Math.sin(u * TAU + p.seed2 * TAU) * 1.1;
  out.position.set(x, y, z);
  out.rotation.set(wave * 0.3, Math.sin(p.time * 0.55 + u * 5.2) * 0.45, -0.28 + wave * 0.18);
  out.scale = 0.92 + p.seed3 * 0.22;
  return out;
};

/** Túnel: tiles espalhados em profundidade fluem em direção à câmera, em loop. */
const stream: FormationFn = (i, n, p, out) => {
  const theta = i * GOLDEN_ANGLE + p.seed * 0.5;
  const r = (p.portrait ? 1.5 : 2.4) + (i % 3) * 0.6;
  // 0 = fundo do túnel, 1 = passou da câmera; avança com o tempo e com o scroll
  const phase = fract(i / n + p.time * 0.03 + p.progress * 1.15 + p.seed2 * 0.2);
  const z = -38 + phase * 43;
  out.position.set(Math.cos(theta) * r, Math.sin(theta) * r * 0.72 + 0.2, z);
  out.rotation.set(0, Math.sin(theta) * 0.25, theta * 0.35 + p.time * 0.15);
  // nasce na névoa e some antes de bater na lente (o "salto" do loop acontece invisível)
  out.scale = (1 + phase * 0.15) * smoothstep(0, 0.12, phase) * (1 - smoothstep(0.76, 0.92, phase));
  return out;
};

/** Anel em volta do título, levemente inclinado, ritmo lento. */
const ring: FormationFn = (i, n, p, out) => {
  const theta = (i / n) * TAU + p.time * 0.09 + p.progress * 0.9;
  const rx = p.portrait ? 1.6 : 5.0;
  const rz = p.portrait ? 3.4 : 4.2;
  const tilt = 0.2;
  const s = Math.sin(theta);
  const c = Math.cos(theta);
  out.position.set(c * rx, 0.1 - s * rz * Math.sin(tilt) + Math.sin(p.time * 0.7 + i * 1.3) * 0.12, s * rz * Math.cos(tilt));
  out.rotation.set(-0.12, c * 0.35, 0);
  out.scale = 1;
  return out;
};

/** Tabuleiro: grade 4×N pousada no chão, tiles deitados. */
const board: FormationFn = (i, n, p, out) => {
  const cols = p.portrait ? 2 : 4;
  const rows = Math.ceil(n / cols);
  const col = i % cols;
  const row = Math.floor(i / cols);
  const gap = 1.45;
  const lift = (1 + Math.sin(p.time * 1.1 + col * 0.9 + row * 1.7)) * 0.03;
  out.position.set((col - (cols - 1) / 2) * gap, FLOOR_Y + 0.12 + lift, (row - (rows - 1) / 2) * gap - 0.4);
  // deitado: a face (+z local) aponta para cima
  out.rotation.set(-Math.PI / 2, 0, (col % 2 ? 1 : -1) * 0.02);
  out.scale = 1;
  return out;
};

/** Esteira em duas linhas; o passo em destaque sobe e vem à frente. */
const row: FormationFn = (i, n, p, out) => {
  const lane = i % 2;
  const col = Math.floor(i / 2);
  const cols = Math.ceil(n / 2);
  const gap = p.portrait ? 1.2 : 1.55;
  const f = resolveFocus(p.focus, p.progress, n);
  // a esteira desliza para manter o passo ativo perto do centro
  const shift = (Math.floor(f / 2) - (cols - 1) / 2) * gap * 0.7;
  const focused = i === f;
  const x = (col - (cols - 1) / 2) * gap + (lane ? gap * 0.5 : 0) - shift;
  out.position.set(x, (lane ? -1.05 : 1.05) + (focused ? 0.45 : 0), (lane ? 0.3 : -0.5) + (focused ? 0.9 : 0));
  out.rotation.set(0, Math.sin(p.time * 0.5 + i) * 0.1 + (focused ? -0.08 : 0), 0);
  out.scale = focused ? 1.18 : 1;
  return out;
};

/** Subida em espiral (ângulo de ouro). */
const rise: FormationFn = (i, n, p, out) => {
  const u = n > 1 ? i / (n - 1) : 0.5;
  const theta = i * GOLDEN_ANGLE + p.time * 0.16 + p.progress * 1.8;
  const r = (p.portrait ? 1.3 : 2.5) + u * 0.5;
  out.position.set(Math.cos(theta) * r, -2.9 + u * 6.2 - p.progress * 1.1 + Math.sin(p.time * 0.9 + i) * 0.08, Math.sin(theta) * r);
  out.rotation.set(0.08, Math.sin(theta) * 0.65, Math.cos(theta) * 0.12);
  out.scale = 0.9 + u * 0.15;
  return out;
};

/** Três planos empilhados de 4 tiles, vista quase isométrica. */
const stack: FormationFn = (i, n, p, out) => {
  const per = 4;
  const planes = Math.ceil(n / per);
  const plane = Math.floor(i / per);
  const s = i % per;
  const yaw = 0.62;
  const g = p.portrait ? 1.25 : 1.5;
  const lx = ((s % 2) - 0.5) * g;
  const lz = (Math.floor(s / 2) - 0.5) * g;
  const spacing = (p.portrait ? 1.5 : 1.7) + p.progress * 0.6;
  out.position.set(
    lx * Math.cos(yaw) - lz * Math.sin(yaw),
    (plane - (planes - 1) / 2) * spacing + 0.1 + Math.sin(p.time * 0.8 + plane * 1.1) * 0.07,
    lx * Math.sin(yaw) + lz * Math.cos(yaw),
  );
  // deitado e girado junto com a grade (Rz local = giro em torno do Y do mundo após Rx(-90°))
  out.rotation.set(-Math.PI / 2, 0, -yaw);
  out.scale = 1;
  return out;
};

/** Órbita inclinada em torno de um ponto focal. */
const orbit: FormationFn = (i, n, p, out) => {
  const incl = 0.5;
  const theta = (i / n) * TAU + p.time * 0.2 + p.progress * 1.6;
  const r = (p.portrait ? 1.6 : 3.4) + (i % 3) * (p.portrait ? 0.45 : 0.7);
  const s = Math.sin(theta);
  const c = Math.cos(theta);
  out.position.set(c * r, 0.3 + s * r * Math.sin(incl), s * r * Math.cos(incl));
  out.rotation.set(-incl * 0.45, s * 0.5, c * 0.12);
  out.scale = 0.95;
  return out;
};

/** Destaque: o tile em foco vira uma "tela" à frente; os outros recuam num arco. */
const exhibit: FormationFn = (i, n, p, out) => {
  const f = resolveFocus(p.focus, p.progress, n);
  const anchor = p.portrait ? EXHIBIT_ANCHOR.portrait : EXHIBIT_ANCHOR.desktop;
  if (i === f) {
    out.position.set(anchor.x, anchor.y + Math.sin(p.time * 0.8) * 0.05, anchor.z);
    out.rotation.set(Math.sin(p.time * 0.5) * 0.03, -0.14 + Math.sin(p.time * 0.37) * 0.04, 0);
    out.scale = p.portrait ? 1.7 : 2.1;
    return out;
  }
  const k = i < f ? i : i - 1;
  const m = Math.max(1, n - 1);
  const u = m > 1 ? k / (m - 1) : 0.5;
  const theta = (u - 0.5) * Math.PI * 1.15;
  const spread = p.portrait ? 3.2 : 6.5;
  out.position.set(
    Math.sin(theta) * spread + anchor.x * 0.4,
    -0.9 + (k % 2) * 1.6 + Math.sin(p.time * 0.6 + k) * 0.15,
    -4.5 - Math.cos(theta) * 2.5,
  );
  out.rotation.set(0, -Math.sin(theta) * 0.45, (k % 2 ? 1 : -1) * 0.08);
  out.scale = 0.78;
  return out;
};

/** Acomodação organizada no canto inferior direito (CTA / rodapé). */
const settle: FormationFn = (i, n, p, out) => {
  const cols = 4;
  const col = i % cols;
  const row = Math.floor(i / cols);
  const breathe = Math.sin(p.time * 0.9 + i * 0.7) * 0.04;
  if (p.portrait) out.position.set((col - 1.5) * 1.2, -3.4 + row * 1.15 + breathe, -1.2 - row * 0.3);
  else out.position.set(2.3 + col * 1.3 + row * 0.3, -2.5 + row * 1.2 + breathe, -1.5 - row * 1.0);
  out.rotation.set(-0.22, -0.18, 0);
  out.scale = 0.9;
  return out;
};

/** Flutuação orgânica em várias profundidades; com pouca intensidade fica à direita/fundo. */
const drift: FormationFn = (i, n, p, out) => {
  const k = clamp01(p.intensity);
  const cx = (1 - k) * 7 * (p.portrait ? 0.4 : 1);
  const span = (3 + k * 10) * (p.portrait ? 0.45 : 1);
  const x = cx + (p.seed - 0.5) * span + Math.sin(p.time * 0.22 + p.seed * TAU) * 0.5;
  const y = (p.seed2 - 0.5) * (p.portrait ? 9 : 6) + Math.sin(p.time * 0.31 + p.seed2 * TAU) * 0.5;
  const z = -2 - p.seed3 * (6 + (1 - k) * 4);
  out.position.set(x, y, z);
  out.rotation.set(
    Math.sin(p.time * 0.2 + p.seed * 7) * 0.4,
    p.time * 0.07 * (p.seed > 0.5 ? 1 : -1) + p.seed2 * TAU,
    Math.sin(p.time * 0.17 + p.seed3 * 5) * 0.25,
  );
  out.scale = 0.72 + p.seed3 * 0.3;
  return out;
};

export const formations: Record<Formation, FormationFn> = { ramp, stream, ring, board, row, rise, stack, orbit, exhibit, settle, drift };
