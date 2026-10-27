import { CanvasTexture, MeshPhysicalMaterial, MeshStandardMaterial, SRGBColorSpace } from "three";

/**
 * Materiais compartilhados por todos os tiles (criados uma vez, descartados no unmount).
 * Paleta HAIK: vermelhos #9E0F16 → #EA1923 → #FF7A82 → #FFE4E6, branco #FEFEFE.
 */
export type TileMaterials = {
  side: MeshPhysicalMaterial;
  face: MeshPhysicalMaterial;
  icon: MeshStandardMaterial;
  texture: CanvasTexture | null;
  dispose: () => void;
};

/** Gradiente diagonal da face frontal (256², sRGB), gerado em canvas 2D. */
export function createFaceTexture(): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const grad = ctx.createLinearGradient(0, 256, 256, 0);
  grad.addColorStop(0, "#9E0F16");
  grad.addColorStop(0.5, "#EA1923");
  grad.addColorStop(0.85, "#FF7A82");
  grad.addColorStop(1, "#FFE4E6");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createTileMaterials(): TileMaterials {
  const texture = createFaceTexture();
  // Sem tone mapping (`flat`), as luzes de área da RoomEnvironment estouram em ângulos
  // rasantes; envMapIntensity mais baixo e clearcoat um pouco mais áspero mantêm o volume
  // sem faces "brancas".
  const side = new MeshPhysicalMaterial({
    color: "#B8121B",
    roughness: 0.3,
    metalness: 0,
    clearcoat: 0.7,
    clearcoatRoughness: 0.14,
    envMapIntensity: 0.55,
  });
  const face = new MeshPhysicalMaterial({
    map: texture ?? undefined,
    color: texture ? "#ffffff" : "#EA1923",
    roughness: 0.28,
    metalness: 0,
    clearcoat: 0.65,
    clearcoatRoughness: 0.12,
    envMapIntensity: 0.45,
  });
  const icon = new MeshStandardMaterial({ color: "#FEFEFE", roughness: 0.5, metalness: 0, envMapIntensity: 0.35 });
  return {
    side,
    face,
    icon,
    texture,
    dispose: () => {
      side.dispose();
      face.dispose();
      icon.dispose();
      texture?.dispose();
    },
  };
}
