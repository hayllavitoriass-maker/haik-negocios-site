import { BufferAttribute, BufferGeometry, Float32BufferAttribute, InterleavedBufferAttribute } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * Geometria do tile: RoundedBox 1×1×0.24, raio .06, 4 segmentos, reagrupada em DOIS
 * grupos de material (laterais, face frontal) em vez dos seis de BoxGeometry — assim um
 * tile custa 2 draw calls, não 6.
 */
export const TILE = { width: 1, height: 1, depth: 0.24, radius: 0.06, segments: 4 } as const;
/** Z da superfície frontal (os ícones ficam logo à frente). */
export const TILE_FACE_Z = TILE.depth / 2;

function floats(attr: BufferAttribute | InterleavedBufferAttribute): Float32Array {
  if (attr instanceof BufferAttribute && attr.array instanceof Float32Array) return attr.array;
  const out = new Float32Array(attr.count * attr.itemSize);
  for (let i = 0; i < attr.count; i++) for (let k = 0; k < attr.itemSize; k++) out[i * attr.itemSize + k] = attr.getComponent(i, k);
  return out;
}

export function createTileGeometry(): BufferGeometry {
  const rounded = new RoundedBoxGeometry(TILE.width, TILE.height, TILE.depth, TILE.segments, TILE.radius);
  const src = rounded.index ? rounded.toNonIndexed() : rounded;

  // Ordem das faces em BoxGeometry: +x, -x, +y, -y, +z (frente), -z. Laterais primeiro, frente por último.
  const order = [0, 1, 2, 3, 5, 4];
  const groups = src.groups;
  const total = groups.reduce((acc, g) => acc + g.count, 0);
  const pos = floats(src.getAttribute("position"));
  const nor = floats(src.getAttribute("normal"));
  const uv = floats(src.getAttribute("uv"));
  const outPos = new Float32Array(total * 3);
  const outNor = new Float32Array(total * 3);
  const outUv = new Float32Array(total * 2);

  let cursor = 0;
  let sideCount = 0;
  for (const face of order) {
    const g = groups[face];
    outPos.set(pos.subarray(g.start * 3, (g.start + g.count) * 3), cursor * 3);
    outNor.set(nor.subarray(g.start * 3, (g.start + g.count) * 3), cursor * 3);
    outUv.set(uv.subarray(g.start * 2, (g.start + g.count) * 2), cursor * 2);
    cursor += g.count;
    if (face !== 4) sideCount += g.count;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(outPos, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(outNor, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(outUv, 2));
  geometry.addGroup(0, sideCount, 0); // material 0: laterais
  geometry.addGroup(sideCount, total - sideCount, 1); // material 1: face frontal
  geometry.computeBoundingSphere();

  if (src !== rounded) src.dispose();
  rounded.dispose();
  return geometry;
}
