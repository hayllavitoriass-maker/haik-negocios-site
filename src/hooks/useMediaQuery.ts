"use client";

import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string, serverDefault = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverDefault,
  );
}

export const useIsMobile = () => useMediaQuery("(width <= 900px)");
export const useIsCoarsePointer = () => useMediaQuery("(pointer: coarse)");
