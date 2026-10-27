"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useMotion } from "@/components/motion/MotionProvider";
import { Icon, type IconName } from "@/components/ui/icons";

type Layer = { label: string; meta: string; icons: IconName[] };

/**
 * Três planos em perspectiva CSS (rotateX 58° rotateZ -42°) empilhados; cada plano
 * entra de translateZ(160px) com fade e assenta. Legendas em ordem invertida para
 * casar com o plano superior.
 */
export function LayerStack({ layers }: { layers: Layer[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { staticScenes } = useMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || staticScenes) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll(".layer-stack__plane"),
        { opacity: 0, z: 160 },
        { opacity: 1, z: 0, duration: 1.4, ease: "expo.out", stagger: 0.18, scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" } },
      );
    }, el);
    return () => ctx.revert();
  }, [staticScenes]);

  return (
    <div ref={ref} className="grid gap-4 desk:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] desk:items-center">
      <div className="layer-stack__scene" aria-hidden="true">
        {layers.map((layer, i) => (
          <div key={layer.label} className="layer-stack__slot" style={{ ["--i" as string]: layers.length - 1 - i }}>
            <div className="layer-stack__plane">
              {layer.icons.map((icon) => (
                <span key={icon} className="layer-stack__tile">
                  <Icon name={icon} className="size-4" />
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ul className="flex flex-col gap-3 desk:gap-6">
        {layers.map((layer, i) => (
          <li key={layer.label} className="grid gap-1">
            <span className="mono inline-flex w-fit gap-[3px]">
              <span className="rounded-xs bg-red px-[7px] py-[5px] text-white">{String(i + 1).padStart(2, "0")}</span>
              <span className="rounded-xs bg-ink px-[7px] py-[5px] text-white">{layer.label}</span>
            </span>
            <span className="mono text-grey-500">{layer.meta}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
