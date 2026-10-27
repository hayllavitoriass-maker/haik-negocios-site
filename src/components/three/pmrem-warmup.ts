import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  OrthographicCamera,
  PMREMGenerator,
  type ShaderMaterial,
  type Texture,
  type WebGLRenderer,
  type WebGLRenderTarget,
} from "three";

/**
 * Gera o PMREM de um equiretangular SEM bloquear a thread principal.
 *
 * `PMREMGenerator.fromEquirectangular` cria os shaders de desfoque/GGX e desenha com eles
 * na mesma chamada; no Windows (ANGLE → HLSL) a compilação desses shaders custa centenas de
 * ms e a primeira draw call espera por ela de forma síncrona. Aqui os alvos e materiais
 * internos são alocados primeiro, os programas são linkados em paralelo
 * (`renderer.compileAsync`, KHR_parallel_shader_compile) e só então o PMREM é renderizado.
 *
 * Depende de membros privados do PMREMGenerator (three 0.186: `_setSize`,
 * `_allocateTargets`, `_blurMaterial`, `_ggxMaterial`, `_equirectMaterial`). Se a API mudar,
 * cai no caminho síncrono normal.
 */
type PmremInternals = {
  _setSize: (cubeSize: number) => void;
  _allocateTargets: () => WebGLRenderTarget;
  _blurMaterial: ShaderMaterial | null;
  _ggxMaterial: ShaderMaterial | null;
  _equirectMaterial: ShaderMaterial | null;
  _lodMeshes?: Mesh[];
};

/** Geometria mínima com atributo de posição (mesma chave de programa dos planos de lod). */
function positionOnlyGeometry(): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new Float32BufferAttribute([0, 0, 1, 0, 0, 1], 2));
  return g;
}

function internalsOf(pmrem: PMREMGenerator): PmremInternals | null {
  const p = pmrem as unknown as Partial<PmremInternals>;
  if (typeof p._setSize !== "function" || typeof p._allocateTargets !== "function") return null;
  return p as PmremInternals;
}

export async function pmremFromEquirectangularAsync(renderer: WebGLRenderer, equirect: Texture): Promise<{ pmrem: PMREMGenerator; target: WebGLRenderTarget }> {
  const pmrem = new PMREMGenerator(renderer);
  const internals = internalsOf(pmrem);
  const image = equirect.image as { width?: number } | undefined;
  if (!internals || !image?.width) {
    return { pmrem, target: pmrem.fromEquirectangular(equirect) };
  }

  // 1. aloca alvos e materiais internos (sem desenhar)
  internals._setSize(image.width / 4);
  const target = internals._allocateTargets();
  pmrem.compileEquirectangularShader(); // cria _equirectMaterial (compile síncrono = só cria o programa)

  // 2. linka todos os programas em paralelo. A chave de cache do programa inclui
  //    `hasPositionAttribute`/`vertexNormals` da GEOMETRIA desenhada: compila com a mesma
  //    geometria dos planos de lod do PMREM, senão o render real cria outra variante.
  const group = new Group();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const lodGeometry = internals._lodMeshes?.[0]?.geometry ?? positionOnlyGeometry();
  const ownGeometry = lodGeometry !== internals._lodMeshes?.[0]?.geometry;
  const materials = [internals._blurMaterial, internals._ggxMaterial, internals._equirectMaterial];
  for (const material of materials) {
    if (material) group.add(new Mesh(lodGeometry, material));
  }
  // O programa é cacheado pelo colorSpace do alvo ATUAL (sRGB da tela ≠ Linear do PMREM):
  // compila com o alvo do PMREM ligado, senão o render real cria outra variante e espera.
  const previousTarget = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  let pending: Promise<unknown>;
  try {
    pending = renderer.compileAsync(group, camera); // a criação dos programas é síncrona aqui
  } catch {
    pending = Promise.resolve();
  }
  renderer.setRenderTarget(previousTarget);
  try {
    await pending;
  } catch {
    /* sem suporte: segue e deixa o render esperar pelo link */
  }
  if (ownGeometry) lodGeometry.dispose();

  // 3. renderiza no alvo já alocado (reutiliza os materiais linkados)
  return { pmrem, target: pmrem.fromEquirectangular(equirect, target) };
}
