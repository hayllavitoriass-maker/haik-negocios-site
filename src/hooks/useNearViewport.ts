"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * true quando o elemento está a até `rootMargin` da viewport (e permanece true depois).
 * Usado para só criar ScrollTriggers/divisões de texto perto de onde o visitante está:
 * criar tudo na hidratação força dezenas de reflows numa página longa.
 */
export function useNearViewport(ref: RefObject<Element | null>, rootMargin = "150% 0px"): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    if (typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sem IO, considera próximo
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          setNear(true);
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin, near]);
  return near;
}
