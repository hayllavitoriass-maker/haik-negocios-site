"use client";
/* eslint-disable react-hooks/immutability -- objetos do Three.js são mutados por frame de propósito (useFrame) */

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Fog,
  InstancedMesh,
  Object3D,
  PMREMGenerator,
  PlaneGeometry,
  PointsMaterial,
  ShaderMaterial,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { FLOOR_Y } from "./formations";
import { useStageConfig } from "./stage-config";
import { getStage } from "./stage-store";

/**
 * Ambiente: RoomEnvironment via PMREM (reflexos do clearcoat, sem HDR externo), halo
 * vermelho radial, chão em grade com cruzes "+" instanciadas, poeira esparsa e névoa na cor
 * do fundo. O fundo do canvas é transparente (a cor vem do CSS); só o tom do ambiente é
 * interpolado por tema, com amortecimento.
 */
const DARK_BG = new Color("#0B0B0B");
const LIGHT_BG = new Color("#FEFEFE");
const GRID_DARK = new Color("#FFFFFF");
const GRID_LIGHT = new Color("#171717");
const DUST_DARK = new Color("#FFFFFF");
const DUST_LIGHT = new Color("#6E6E6E");
const RED = new Color("#EA1923");

const GRID_RADIUS = 22;
const CROSS_RADIUS = 15;
const THEME_DAMP = 3;

const haloVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const haloFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float d = length(p * vec2(1.0, 1.25));
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(uColor, a * uIntensity);
  }
`;

const gridVertex = /* glsl */ `
  varying vec2 vXZ;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vXZ = w.xz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const gridFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  uniform float uRadius;
  varying vec2 vXZ;
  void main() {
    // distância (em pixels) até a linha inteira mais próxima: linha de 1px, anti-aliased
    vec2 g = abs(fract(vXZ - 0.5) - 0.5) / fwidth(vXZ);
    float line = 1.0 - min(min(g.x, g.y), 1.0);
    float fade = 1.0 - smoothstep(uRadius * 0.3, uRadius, length(vXZ));
    float a = line * fade * uAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

const crossVertex = /* glsl */ `
  uniform float uRadius;
  varying float vFade;
  void main() {
    vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vFade = 1.0 - smoothstep(uRadius * 0.25, uRadius * 0.95, length(w.xz));
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const crossFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  varying float vFade;
  void main() {
    gl_FragColor = vec4(uColor, uAlpha * vFade * 2.4);
  }
`;

/** Posições das cruzes: interseções alternadas da grade dentro de um raio. */
function crossPositions(radius: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const r = Math.floor(radius);
  for (let x = -r; x <= r; x++) {
    for (let z = -r; z <= r; z++) {
      if ((x + z) % 2 !== 0) continue;
      if (x * x + z * z > radius * radius) continue;
      out.push([x, z]);
    }
  }
  return out;
}

function createCrossGeometry(): BufferGeometry {
  const a = new PlaneGeometry(0.26, 0.035);
  const b = new PlaneGeometry(0.035, 0.26);
  const merged = mergeGeometries([a, b], false) ?? a.clone();
  a.dispose();
  b.dispose();
  merged.rotateX(-Math.PI / 2); // deitado no chão
  return merged;
}

function createDustGeometry(count: number): BufferGeometry {
  // determinístico (LCG simples) para a poeira ser a mesma a cada carregamento
  let s = 1234567;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rnd() - 0.5) * 34;
    positions[i * 3 + 1] = (rnd() - 0.4) * 14;
    positions[i * 3 + 2] = (rnd() - 0.65) * 30;
    const red = rnd() < 0.3;
    const c = red ? RED : DUST_DARK;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return g;
}

export function Environment() {
  const { gl, scene } = useThree();
  const { coarse, reduced } = useStageConfig();

  // Iluminação baseada em imagem: sala procedural → PMREM. Sem rede, sem HDR.
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    scene.environment = target.texture;
    room.dispose();
    pmrem.dispose();
    return () => {
      if (scene.environment === target.texture) scene.environment = null;
      target.dispose();
    };
  }, [gl, scene]);

  const fog = useMemo(() => new Fog(getStage().theme === "dark" ? DARK_BG.clone() : LIGHT_BG.clone(), 16, 44), []);
  useEffect(() => {
    scene.fog = fog;
    return () => {
      if (scene.fog === fog) scene.fog = null;
    };
  }, [scene, fog]);

  const haloUniforms = useMemo(() => ({ uColor: { value: RED.clone() }, uIntensity: { value: 0.4 } }), []);
  const gridUniforms = useMemo(() => ({ uColor: { value: GRID_DARK.clone() }, uAlpha: { value: 0.15 }, uRadius: { value: GRID_RADIUS } }), []);
  const crossUniforms = useMemo(() => ({ uColor: { value: GRID_DARK.clone() }, uAlpha: { value: 0.15 }, uRadius: { value: CROSS_RADIUS } }), []);

  const crossGeometry = useMemo(() => createCrossGeometry(), []);
  const crosses = useMemo(() => crossPositions(CROSS_RADIUS), []);
  const crossRef = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = crossRef.current;
    if (!mesh) return;
    const dummy = new Object3D();
    crosses.forEach(([x, z], i) => {
      dummy.position.set(x, 0, z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [crosses]);

  const dustCount = coarse ? 220 : 380;
  const dustGeometry = useMemo(() => createDustGeometry(dustCount), [dustCount]);
  const dustMaterial = useRef<PointsMaterial>(null);
  const gridMaterial = useRef<ShaderMaterial>(null);

  useEffect(() => {
    return () => {
      crossGeometry.dispose();
      dustGeometry.dispose();
    };
  }, [crossGeometry, dustGeometry]);

  // 1 = escuro, 0 = claro; amortecido para a troca de tema ser contínua
  const tint = useRef(getStage().theme === "dark" ? 1 : 0);
  const dustRef = useRef<Object3D>(null);

  useFrame((state, delta) => {
    const s = getStage();
    const goal = s.theme === "dark" ? 1 : 0;
    const dt = Math.min(delta, 1 / 20);
    const k = reduced ? 1 : 1 - Math.exp(-THEME_DAMP * dt);
    tint.current += (goal - tint.current) * k;
    const d = tint.current;

    fog.color.lerpColors(LIGHT_BG, DARK_BG, d);
    haloUniforms.uIntensity.value = 0.16 + (0.62 - 0.16) * d;
    gridUniforms.uColor.value.lerpColors(GRID_LIGHT, GRID_DARK, d);
    gridUniforms.uAlpha.value = 0.12 + (0.15 - 0.12) * d;
    crossUniforms.uColor.value.copy(gridUniforms.uColor.value);
    crossUniforms.uAlpha.value = gridUniforms.uAlpha.value;
    if (dustMaterial.current) {
      dustMaterial.current.color.lerpColors(DUST_LIGHT, DUST_DARK, d);
      dustMaterial.current.opacity = 0.3 + (0.5 - 0.3) * d;
    }
    if (dustRef.current && !reduced) {
      const t = state.clock.elapsedTime;
      dustRef.current.rotation.y = t * 0.012;
      dustRef.current.position.y = Math.sin(t * 0.09) * 0.4;
    }
  });

  return (
    <>
      <directionalLight position={[4, 7, 6]} intensity={0.9} color="#fff4f2" />
      <ambientLight intensity={0.12} />

      {/* halo vermelho no canto superior direito, bem atrás da cena */}
      <mesh position={[9, 5, -16]} scale={[30, 22, 1]} renderOrder={-10} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial uniforms={haloUniforms} vertexShader={haloVertex} fragmentShader={haloFragment} transparent depthWrite={false} />
      </mesh>

      {/* chão em grade (linhas finas) */}
      <mesh position={[0, FLOOR_Y, -2]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-5}>
        <planeGeometry args={[GRID_RADIUS * 2.2, GRID_RADIUS * 2.2]} />
        <shaderMaterial ref={gridMaterial} uniforms={gridUniforms} vertexShader={gridVertex} fragmentShader={gridFragment} transparent depthWrite={false} />
      </mesh>

      {/* cruzes "+" em interseções alternadas */}
      <instancedMesh ref={crossRef} args={[crossGeometry, undefined, crosses.length]} position={[0, FLOOR_Y + 0.003, -2]} renderOrder={-4} frustumCulled={false}>
        <shaderMaterial uniforms={crossUniforms} vertexShader={crossVertex} fragmentShader={crossFragment} transparent depthWrite={false} />
      </instancedMesh>

      {/* poeira */}
      <points ref={dustRef} geometry={dustGeometry} frustumCulled={false}>
        <pointsMaterial ref={dustMaterial} size={1.6} sizeAttenuation={false} vertexColors transparent opacity={0.4} depthWrite={false} />
      </points>
    </>
  );
}
