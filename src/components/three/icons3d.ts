import { BufferGeometry, CatmullRomCurve3, LineCurve3, SphereGeometry, TubeGeometry, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Ícones 3D: os mesmos símbolos de `ui/icons.tsx`, redesenhados como geometria real.
 * Cada ícone é descrito em polilinhas/curvas numa grade de 24 unidades (coordenadas SVG,
 * y para baixo). Cada traço vira TubeGeometry (segmentos retos = um tubo por segmento com
 * esferas nas juntas; curvas = um tubo ao longo de CatmullRom) e tudo é fundido numa única
 * geometria por ícone (um draw call), em unidades do tile (ocupa ~58% da face).
 */
export type Icon3DName =
  | "megaphone"
  | "chart"
  | "target"
  | "chat"
  | "hashtag"
  | "heart"
  | "at"
  | "braces"
  | "code"
  | "terminal"
  | "chip"
  | "cube"
  | "gear"
  | "arrows"
  | "network"
  | "cursor"
  | "vector"
  | "grid"
  | "browser"
  | "layout"
  | "bars";

type Pt = [number, number];
type Stroke =
  | { kind: "line"; pts: Pt[]; closed?: boolean }
  | { kind: "curve"; pts: Pt[]; closed?: boolean }
  | { kind: "dot"; at: Pt; r?: number };

/** Fração da face ocupada pelo ícone. */
export const ICON_SPAN = 0.58;
const GRID = 24;
const UNIT = ICON_SPAN / GRID;
/** Raio do traço em unidades da grade (traço 2D = 1.75 de largura; aqui ligeiramente mais fino). */
const STROKE_R = 0.6;

const line = (...pts: Pt[]): Stroke => ({ kind: "line", pts });
const loop = (...pts: Pt[]): Stroke => ({ kind: "line", pts, closed: true });
const curve = (pts: Pt[], closed = false): Stroke => ({ kind: "curve", pts, closed });
const dot = (at: Pt, r = 0.9): Stroke => ({ kind: "dot", at, r });

/** Arco amostrado (ângulos em rad, convenção SVG: y para baixo, ângulo crescente = horário). */
function arc(cx: number, cy: number, r: number, a0: number, a1: number, steps?: number): Pt[] {
  const n = steps ?? Math.max(3, Math.ceil((Math.abs(a1 - a0) / (Math.PI * 2)) * 24));
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

function circle(cx: number, cy: number, r: number): Stroke {
  const pts = arc(cx, cy, r, 0, Math.PI * 2, Math.max(12, Math.round(r * 4)));
  pts.pop(); // fechado: o último ponto repetiria o primeiro
  return curve(pts, true);
}

/** Bézier cúbica amostrada (sem o ponto inicial, para encadear). */
function cubic(p0: Pt, c1: Pt, c2: Pt, p1: Pt, n = 8): Pt[] {
  const out: Pt[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    out.push([a * p0[0] + b * c1[0] + c * c2[0] + d * p1[0], a * p0[1] + b * c1[1] + c * c2[1] + d * p1[1]]);
  }
  return out;
}

/** Retângulo com cantos arredondados (raio rx), como polilinha fechada. */
function rrect(x: number, y: number, w: number, h: number, rx = 0): Stroke {
  if (rx <= 0) return loop([x, y], [x + w, y], [x + w, y + h], [x, y + h]);
  const H = Math.PI / 2;
  const pts: Pt[] = [
    ...arc(x + w - rx, y + rx, rx, -H, 0, 3),
    ...arc(x + w - rx, y + h - rx, rx, 0, H, 3),
    ...arc(x + rx, y + h - rx, rx, H, Math.PI, 3),
    ...arc(x + rx, y + rx, rx, Math.PI, Math.PI * 1.5, 3),
  ];
  return { kind: "line", pts, closed: true };
}

const H = Math.PI / 2;

const ICONS: Record<Icon3DName, Stroke[]> = {
  megaphone: [
    loop([3, 10], [3, 14], [4, 15], [7, 15], [15, 19], [15, 5], [7, 9], [4, 9]),
    curve(arc(18, 12, 3, -H, H)),
    line([7, 15], [7, 19], [8, 20], [9, 20]),
  ],
  chart: [line([4, 4], [4, 20], [20, 20]), line([7, 14], [11, 10], [14, 13], [20, 7]), line([16, 7], [20, 7], [20, 11])],
  target: [circle(12, 12, 9), circle(12, 12, 5), dot([12, 12], 1.1)],
  chat: [loop([4, 5], [20, 5], [20, 16], [9, 16], [4, 20])],
  hashtag: [line([9, 4], [7, 20]), line([17, 4], [15, 20]), line([4, 9], [21, 9]), line([3, 15], [20, 15])],
  heart: [
    curve(
      [
        [12, 20],
        ...cubic([12, 20], [12, 20], [5, 15.5], [5, 10], 6),
        ...arc(9.0, 10.14, 4, 3.176, 5.563, 8).slice(1),
        ...arc(15.0, 10.14, 4, 3.863, 6.248, 8).slice(1),
        ...cubic([19, 10], [19, 15.5], [12, 20], [12, 20], 6).slice(0, -1),
      ],
      true,
    ),
  ],
  at: [
    circle(12, 12, 4),
    {
      kind: "line",
      pts: [[16, 12], ...arc(18.5, 13.5, 2.5, Math.PI, 0, 8), [21, 12], ...arc(12, 12, 9, 0, -Math.PI * 2 + 0.912, 26).slice(1)],
    },
  ],
  braces: [
    curve([[8, 4], [7, 4], ...arc(7, 6, 2, -H, -Math.PI, 4).slice(1), [5, 10], ...arc(3, 10, 2, 0, H, 4).slice(1), ...arc(3, 14, 2, -H, 0, 4).slice(1), [5, 18], ...arc(7, 18, 2, Math.PI, H, 4).slice(1), [8, 20]]),
    curve([[16, 4], [17, 4], ...arc(17, 6, 2, -H, 0, 4).slice(1), [19, 10], ...arc(21, 10, 2, Math.PI, H, 4).slice(1), ...arc(21, 14, 2, -H, Math.PI, 4).slice(1), [19, 18], ...arc(17, 18, 2, 0, H, 4).slice(1), [16, 20]]),
  ],
  code: [line([8, 7], [3, 12], [8, 17]), line([16, 7], [21, 12], [16, 17]), line([14, 4], [10, 20])],
  terminal: [line([5, 7], [10, 12], [5, 17]), line([12, 17], [19, 17])],
  chip: [
    rrect(7, 7, 10, 10, 1.5),
    line([10, 3], [10, 7]),
    line([14, 3], [14, 7]),
    line([10, 17], [10, 21]),
    line([14, 17], [14, 21]),
    line([3, 10], [7, 10]),
    line([3, 14], [7, 14]),
    line([17, 10], [21, 10]),
    line([17, 14], [21, 14]),
  ],
  cube: [loop([12, 3], [20, 7.5], [20, 16.5], [12, 21], [4, 16.5], [4, 7.5]), line([12, 12], [4, 7.5]), line([12, 12], [20, 7.5]), line([12, 12], [12, 21])],
  gear: [
    circle(12, 12, 3),
    line([12, 2], [12, 5]),
    line([12, 19], [12, 22]),
    line([2, 12], [5, 12]),
    line([19, 12], [22, 12]),
    line([4.9, 4.9], [7, 7]),
    line([17, 17], [19.1, 19.1]),
    line([4.9, 19.1], [7, 17]),
    line([17, 7], [19.1, 4.9]),
  ],
  arrows: [line([4, 7], [16, 7], [13, 4]), line([20, 17], [8, 17], [11, 20])],
  network: [circle(5, 12, 2), circle(19, 6, 2), circle(19, 18, 2), circle(12, 12, 2), line([7, 12], [10, 12]), line([14, 11], [17, 7]), line([14, 13], [17, 17])],
  cursor: [loop([5, 4], [19, 11], [13, 13], [11, 19])],
  vector: [curve([[5, 19], ...cubic([5, 19], [5, 10], [10, 5], [19, 5], 10)]), rrect(3, 17, 4, 4), rrect(17, 3, 4, 4), rrect(9, 9, 6, 6)],
  grid: [rrect(4, 4, 7, 7, 1), rrect(13, 4, 7, 7, 1), rrect(4, 13, 7, 7, 1), rrect(13, 13, 7, 7, 1)],
  browser: [rrect(3, 4, 18, 16, 2), line([3, 9], [21, 9]), dot([7, 6.5], 0.8), dot([10, 6.5], 0.8)],
  layout: [rrect(3, 4, 18, 16, 2), line([3, 10], [21, 10]), line([10, 10], [10, 20])],
  bars: [line([5, 20], [5, 14]), line([12, 20], [12, 8]), line([19, 20], [19, 4])],
};

export const ICON_NAMES = Object.keys(ICONS) as Icon3DName[];

function toWorld([x, y]: Pt): Vector3 {
  // centraliza na face e inverte y (SVG cresce para baixo)
  return new Vector3((x - GRID / 2) * UNIT, (GRID / 2 - y) * UNIT, 0);
}

function cap(at: Vector3, r: number): BufferGeometry {
  return new SphereGeometry(r, 8, 6).translate(at.x, at.y, at.z);
}

function buildStroke(stroke: Stroke, parts: BufferGeometry[]) {
  const r = STROKE_R * UNIT;
  if (stroke.kind === "dot") {
    parts.push(cap(toWorld(stroke.at), (stroke.r ?? 0.9) * UNIT));
    return;
  }
  const v = stroke.pts.map(toWorld);
  if (v.length < 2) return;
  if (stroke.kind === "curve") {
    const path = new CatmullRomCurve3(v, !!stroke.closed, "centripetal");
    parts.push(new TubeGeometry(path, Math.max(6, v.length * 3), r, 6, !!stroke.closed));
    if (!stroke.closed) {
      parts.push(cap(v[0], r), cap(v[v.length - 1], r));
    }
    return;
  }
  const segs = stroke.closed ? v.length : v.length - 1;
  for (let i = 0; i < segs; i++) {
    const a = v[i];
    const b = v[(i + 1) % v.length];
    if (a.distanceToSquared(b) < 1e-10) continue;
    parts.push(new TubeGeometry(new LineCurve3(a, b), 1, r, 6, false));
  }
  // esferas em todas as juntas e pontas: cantos e caps redondos como no ícone 2D
  for (const p of v) parts.push(cap(p, r));
}

/** Constrói a geometria (fundida) de um ícone. Chame `getIconGeometry` para a versão em cache. */
export function buildIconGeometry(name: Icon3DName): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (const stroke of ICONS[name]) buildStroke(stroke, parts);
  const merged: BufferGeometry | null = mergeGeometries(parts, false);
  for (const g of parts) g.dispose();
  if (!merged) throw new Error(`icons3d: falha ao fundir "${name}"`);
  merged.computeBoundingSphere();
  return merged;
}

const cache = new Map<Icon3DName, BufferGeometry>();

export function getIconGeometry(name: Icon3DName): BufferGeometry {
  let g = cache.get(name);
  if (!g) {
    g = buildIconGeometry(name);
    cache.set(name, g);
  }
  return g;
}

export function disposeIconCache() {
  for (const g of cache.values()) g.dispose();
  cache.clear();
}
