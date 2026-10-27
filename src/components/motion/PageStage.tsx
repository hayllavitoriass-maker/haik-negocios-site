"use client";

import { useEffect } from "react";
import { setStage, type Formation, type StageTheme } from "@/components/three/stage-store";

/**
 * Páginas internas (sem capítulos) definem aqui a formação, o tema e a presença da
 * cena 3D persistente. Renderize uma vez no topo da página.
 */
export function PageStage({
  formation = "drift",
  theme = "light",
  intensity = 0.45,
  focus = null,
}: {
  formation?: Formation;
  theme?: StageTheme;
  intensity?: number;
  focus?: number | null;
}) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    setStage({ formation, theme, intensity, focus, progress: 0 });
  }, [formation, theme, intensity, focus]);
  return null;
}
