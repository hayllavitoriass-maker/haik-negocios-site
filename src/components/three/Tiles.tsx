"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { FormationParams } from "./formations";
import { disposeIconCache, getIconGeometry } from "./icons3d";
import { createTileMaterials } from "./materials";
import { tileSeeds } from "./seeds";
import { pickIcons, useStageConfig } from "./stage-config";
import { getStage } from "./stage-store";
import { createTileGeometry, TILE_FACE_Z } from "./tile-geometry";
import { TileMotion } from "./tile-motion";

/** Z do ícone: logo à frente da face (evita z-fighting com o clearcoat). */
const ICON_Z = TILE_FACE_Z + 0.01;

/**
 * Os tiles: uma geometria e três materiais compartilhados; por tile um grupo com a caixa
 * (2 draw calls) e o ícone (1 draw call). Toda a animação acontece em useFrame lendo o
 * store diretamente (zero re-renders React durante o scroll).
 */
export function Tiles() {
  const config = useStageConfig();
  const { count, portrait, reduced } = config;

  const icons = useMemo(() => pickIcons(count), [count]);
  const seeds = useMemo(() => tileSeeds(count), [count]);
  const motions = useMemo(() => seeds.map((s, i) => new TileMotion(i, count, s, getStage().formation)), [seeds, count]);

  const geometry = useMemo(() => createTileGeometry(), []);
  const materials = useMemo(() => createTileMaterials(), []);
  const boxMaterials = useMemo(() => [materials.side, materials.face], [materials]);
  const iconGeometries = useMemo(() => icons.map((name) => getIconGeometry(name)), [icons]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      materials.dispose();
      disposeIconCache();
    };
  }, [geometry, materials]);

  const groups = useRef<(Group | null)[]>([]);
  const params = useRef<FormationParams>({
    time: 0,
    progress: 0,
    focus: null,
    intensity: 1,
    velocity: 0,
    portrait,
    aspect: 16 / 9,
    seed: 0,
    seed2: 0,
    seed3: 0,
  });

  useFrame((state, delta) => {
    const s = getStage();
    const now = state.clock.elapsedTime;
    const dt = Math.min(delta, 1 / 20); // abas em segundo plano não devem "saltar"
    const p = params.current;
    p.time = now;
    p.progress = s.progress;
    p.focus = s.focus;
    p.intensity = s.intensity;
    p.velocity = s.velocity;
    p.portrait = portrait;
    p.aspect = state.size.height > 0 ? state.size.width / state.size.height : 16 / 9;

    for (let i = 0; i < motions.length; i++) {
      const motion = motions[i];
      const group = groups.current[i];
      if (!group) continue;
      motion.setFormation(s.formation, now);
      motion.update(now, dt, p, reduced);
      group.position.copy(motion.position);
      group.quaternion.copy(motion.quaternion);
      group.scale.setScalar(Math.max(0, motion.scale));
      group.visible = motion.scale > 0.002;
    }
  });

  return (
    <group>
      {icons.map((name, i) => (
        <group
          key={`${name}-${i}`}
          ref={(el) => {
            groups.current[i] = el;
          }}
          scale={0}
        >
          <mesh geometry={geometry} material={boxMaterials} />
          <mesh geometry={iconGeometries[i]} material={materials.icon} position={[0, 0, ICON_Z]} />
        </group>
      ))}
    </group>
  );
}
