"use client";

import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/icons";
import type { Icon3DName } from "./icons3d";
import { useStage } from "./stage-store";

/**
 * Composição estática em CSS quando não há WebGL, quando a cena está desligada ou quando a
 * cena WebGL falha: tiles vermelhos com os ícones 2D, flutuando devagar, à direita.
 */
type FallbackTile = { icon: Icon3DName; x: number; y: number; size: number; delay: number; depth: number };

const TILES: FallbackTile[] = [
  { icon: "megaphone", x: 62, y: 22, size: 84, delay: 0, depth: 1 },
  { icon: "chart", x: 78, y: 34, size: 64, delay: -2.1, depth: 0.7 },
  { icon: "code", x: 88, y: 18, size: 52, delay: -4.4, depth: 0.5 },
  { icon: "network", x: 70, y: 58, size: 72, delay: -1.3, depth: 0.85 },
  { icon: "gear", x: 90, y: 66, size: 58, delay: -3.2, depth: 0.6 },
  { icon: "chat", x: 56, y: 78, size: 48, delay: -5.1, depth: 0.45 },
  { icon: "cursor", x: 82, y: 86, size: 40, delay: -2.8, depth: 0.4 },
];

export function StageFallback() {
  const { theme, intensity } = useStage();
  return (
    <div className="stage stage-fallback is-ready" data-theme={theme} aria-hidden="true" style={{ "--presence": intensity } as CSSProperties}>
      <div className="stage-fallback__halo" />
      {TILES.map((t) => (
        <span
          key={t.icon}
          className="stage-fallback__tile"
          style={{ left: `${t.x}%`, top: `${t.y}%`, width: t.size, height: t.size, animationDelay: `${t.delay}s`, opacity: 0.45 + t.depth * 0.55 }}
        >
          <Icon name={t.icon} className="size-[42%]" />
        </span>
      ))}
    </div>
  );
}
