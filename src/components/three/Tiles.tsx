"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
/** Ícones construídos por passo ocioso (cada um custa poucos ms; nunca todos de uma vez). */
const ICONS_PER_STEP = 2;

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/**
 * Os tiles: uma geometria e três materiais compartilhados; por tile um grupo com a caixa
 * (2 draw calls) e o ícone (1 draw call). Toda a animação acontece em useFrame lendo o
 * store diretamente (zero re-renders React durante o scroll).
 *
 * Inicialização progressiva: só o primeiro ícone é construído de forma síncrona (para o
 * material do ícone entrar na compilação de shaders); os demais chegam 2 por callback
 * ocioso, e cada tile nasce (cresce do zero) quando o seu ícone fica pronto.
 */
export function Tiles() {
  const config = useStageConfig();
  const { count, portrait, reduced } = config;

  const icons = useMemo(() => pickIcons(count), [count]);
  const seeds = useMemo(() => tileSeeds(count), [count]);

  const geometry = useMemo(() => createTileGeometry(), []);
  const materials = useMemo(() => createTileMaterials(), []);
  const boxMaterials = useMemo(() => [materials.side, materials.face], [materials]);

  // quantos ícones (em ordem) já têm geometria pronta
  const [readyCount, setReadyCount] = useState(() => {
    getIconGeometry(icons[0]);
    return 1;
  });
  const readyRef = useRef(readyCount);
  readyRef.current = readyCount;

  useEffect(() => {
    let cancelled = false;
    let built = 1;
    const win = window as IdleWindow;
    let handle = 0;
    let viaIdle = false;
    const step = () => {
      if (cancelled) return;
      for (let k = 0; k < ICONS_PER_STEP && built < icons.length; k++, built++) getIconGeometry(icons[built]);
      setReadyCount(built);
      if (built < icons.length) schedule();
    };
    const schedule = () => {
      if (win.requestIdleCallback) {
        viaIdle = true;
        handle = win.requestIdleCallback(step, { timeout: 120 });
      } else {
        viaIdle = false;
        handle = window.requestAnimationFrame(step);
      }
    };
    if (icons.length > 1) schedule();
    return () => {
      cancelled = true;
      if (viaIdle) win.cancelIdleCallback?.(handle);
      else window.cancelAnimationFrame(handle);
    };
  }, [icons]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      materials.dispose();
      disposeIconCache();
    };
  }, [geometry, materials]);

  const groups = useRef<(Group | null)[]>([]);
  const motions = useRef<(TileMotion | null)[]>([]);
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

  // tiles em mudança de contagem (retrato ↔ paisagem): recomeça os movimentos
  useEffect(() => {
    motions.current = [];
  }, [count, seeds]);

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

    const ready = readyRef.current;
    for (let i = 0; i < count; i++) {
      const group = groups.current[i];
      if (!group) continue;
      if (i >= ready) {
        group.visible = false;
        continue;
      }
      let motion = motions.current[i];
      if (!motion) {
        // nasce agora: pesos em zero, cresce a partir deste instante
        motion = new TileMotion(i, count, seeds[i], s.formation, now);
        motions.current[i] = motion;
      }
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
          visible={false}
        >
          <mesh geometry={geometry} material={boxMaterials} />
          {i < readyCount && <mesh geometry={getIconGeometry(name)} material={materials.icon} position={[0, 0, ICON_Z]} />}
        </group>
      ))}
    </group>
  );
}
