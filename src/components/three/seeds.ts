/**
 * Aleatoriedade determinística por tile: a composição é a mesma em todo carregamento
 * (sem "pulo" entre renders) e pode ser testada em Node.
 */
export type TileSeeds = { a: number; b: number; c: number };

/** PRNG mulberry32: pequeno, rápido e suficiente para variação visual. */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function tileSeeds(count: number, salt = 7): TileSeeds[] {
  const rnd = mulberry32(0x9e3779b9 ^ (count * 131 + salt));
  return Array.from({ length: count }, () => ({ a: rnd(), b: rnd(), c: rnd() }));
}
