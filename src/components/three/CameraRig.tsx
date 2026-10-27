"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Vector3 } from "three";
import { cameraKeys, placeCamera, type CameraKey } from "./camera-keys";
import { useStageConfig } from "./stage-config";
import { getStage } from "./stage-store";

/**
 * Câmera: um keyframe por formação (ver camera-keys.ts), interpolado com amortecimento,
 * mais deriva orgânica e um "shake" proporcional à velocidade do scroll.
 */

/** Ganho global da deriva orgânica (1 = fórmulas de referência). */
const DRIFT_GAIN = 0.75;
const CAMERA_DAMP = 2.2;

export function CameraRig() {
  const { portrait, reduced } = useStageConfig();
  const keys = cameraKeys(portrait);
  const current = useRef<CameraKey>({ ...keys[getStage().formation] });
  const shake = useRef(0);
  const target = useMemo(() => new Vector3(), []);

  useFrame((state, delta) => {
    const cam = state.camera;
    if (!(cam instanceof PerspectiveCamera)) return;
    const s = getStage();
    const goal = keys[s.formation];
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 1 / 20);
    const cur = current.current;

    const k = reduced ? 1 : 1 - Math.exp(-CAMERA_DAMP * dt);
    cur.azim += (goal.azim - cur.azim) * k;
    cur.elev += (goal.elev - cur.elev) * k;
    cur.dist += (goal.dist + (s.progress - 0.5) * goal.travel - cur.dist) * k;
    cur.pan += (goal.pan - cur.pan) * k;
    cur.panY += (goal.panY - cur.panY) * k;
    cur.fov += (goal.fov - cur.fov) * k;

    let azim = cur.azim;
    let elev = cur.elev;
    let dist = cur.dist;
    if (!reduced) {
      // deriva orgânica (soma de senos incomensuráveis = nunca repete visivelmente)
      const g = DRIFT_GAIN * (portrait ? 0.55 : 1);
      azim += (Math.sin(t * 1.05) * 7 + Math.sin(t * 0.43 + 1) * 5) * g;
      elev += Math.sin(t * 0.74 + 2) * 3 * g;
      dist *= 1 + Math.sin(t * 0.84 + 0.5) * 0.06 * g;
      // shake: segue |velocidade| com atraso e decai depois que o scroll para
      shake.current += (Math.min(1, Math.abs(s.velocity)) - shake.current) * (1 - Math.exp(-6 * dt));
      azim += Math.sin(t * 21) * shake.current * 0.9;
      elev += Math.cos(t * 17) * shake.current * 0.7;
    }

    placeCamera(azim, elev, dist, cur.pan, cur.panY, cam.position, target);
    cam.lookAt(target);
    if (Math.abs(cam.fov - cur.fov) > 0.01) {
      cam.fov = cur.fov;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
