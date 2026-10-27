import { CanvasTexture, EquirectangularReflectionMapping, SRGBColorSpace } from "three";

/**
 * Ambiente de estúdio procedural: um equiretangular minúsculo (256×128) pintado em canvas —
 * chão escuro → horizonte cinza → teto claro, uma luz-chave branca ampla, um realce quente
 * e um reflexo vermelho baixo. Passado por `PMREMGenerator.fromEquirectangular` custa poucos
 * milissegundos (contra centenas da RoomEnvironment renderizada + desfocada) e dá ao
 * clearcoat reflexos suaves, sem "plástico".
 */
export const STUDIO_ENV_WIDTH = 256;
export const STUDIO_ENV_HEIGHT = 128;

export function createStudioEnvironment(): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = STUDIO_ENV_WIDTH;
  canvas.height = STUDIO_ENV_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const w = canvas.width;
  const h = canvas.height;

  // base: gradiente vertical (teto claro, horizonte neutro, chão escuro)
  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, "#f4f1f0");
  base.addColorStop(0.42, "#b9b5b4");
  base.addColorStop(0.55, "#4a4747");
  base.addColorStop(1, "#111010");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // luz-chave: softbox largo acima/à frente (frente = centro do equiretangular)
  const key = ctx.createRadialGradient(w * 0.5, h * 0.18, 4, w * 0.5, h * 0.18, w * 0.34);
  key.addColorStop(0, "rgba(255,255,255,1)");
  key.addColorStop(0.35, "rgba(255,255,255,0.8)");
  key.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = key;
  ctx.fillRect(0, 0, w, h);

  // realce quente à direita (preenchimento), mais estreito
  const fill = ctx.createRadialGradient(w * 0.82, h * 0.3, 2, w * 0.82, h * 0.3, w * 0.16);
  fill.addColorStop(0, "rgba(255,228,214,0.9)");
  fill.addColorStop(1, "rgba(255,228,214,0)");
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, w, h);

  // reflexo vermelho baixo à esquerda (lembrete da marca nos reflexos)
  const rim = ctx.createRadialGradient(w * 0.16, h * 0.68, 2, w * 0.16, h * 0.68, w * 0.2);
  rim.addColorStop(0, "rgba(234,25,35,0.45)");
  rim.addColorStop(1, "rgba(234,25,35,0)");
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, w, h);

  const texture = new CanvasTexture(canvas);
  texture.mapping = EquirectangularReflectionMapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
