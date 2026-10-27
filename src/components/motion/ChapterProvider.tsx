"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { setStage, type Formation, type StageTheme } from "@/components/three/stage-store";

/**
 * Capítulos: cada cena da Home se registra com índice, rótulo, tema e formação 3D.
 * O capítulo ativo define o tema do <html> (header muda de cor), a formação da cena 3D,
 * o indicador inferior e os pontos laterais.
 */
export type Chapter = {
  id: string;
  index: number;
  label: string;
  theme: StageTheme;
  formation: Formation;
};

type ChapterContextValue = {
  chapters: Chapter[];
  active: Chapter | null;
  register: (chapter: Chapter) => () => void;
  activate: (id: string, progress?: number) => void;
  setProgress: (progress: number) => void;
  atEnd: boolean;
  setAtEnd: (v: boolean) => void;
};

const ChapterContext = createContext<ChapterContextValue | null>(null);

export function ChapterProvider({ children, defaultTheme = "light" }: { children: ReactNode; defaultTheme?: StageTheme }) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [atEnd, setAtEnd] = useState(false);
  const pathname = usePathname();
  const chaptersRef = useRef<Chapter[]>([]);

  const register = useCallback((chapter: Chapter) => {
    setChapters((prev) => {
      const next = [...prev.filter((c) => c.id !== chapter.id), chapter].sort((a, b) => a.index - b.index);
      chaptersRef.current = next;
      return next;
    });
    return () => {
      setChapters((prev) => {
        const next = prev.filter((c) => c.id !== chapter.id);
        chaptersRef.current = next;
        return next;
      });
    };
  }, []);

  const activate = useCallback((id: string, progress = 0) => {
    setActiveId(id);
    const chapter = chaptersRef.current.find((c) => c.id === id);
    if (chapter) setStage({ formation: chapter.formation, theme: chapter.theme, progress });
  }, []);

  const setProgress = useCallback((progress: number) => setStage({ progress }), []);

  const active = useMemo(() => chapters.find((c) => c.id === activeId) ?? null, [chapters, activeId]);

  // Tema do documento segue o capítulo ativo; sem capítulos (páginas internas) usa o padrão.
  useEffect(() => {
    if (active) {
      document.documentElement.dataset.theme = active.theme;
      setStage({ theme: active.theme });
      return;
    }
    // Sem capítulo ativo, só aplica o padrão se ninguém (PageStage/ThemeZone) definiu um tema.
    if (!document.documentElement.dataset.theme) {
      document.documentElement.dataset.theme = defaultTheme;
      setStage({ theme: defaultTheme });
    }
  }, [active, defaultTheme]);

  // Reinicia o capítulo só quando a rota muda de fato (não na montagem: os filhos já
  // podem ter ativado um capítulo, pois efeitos de filhos rodam antes dos do pai).
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    setActiveId(null);
    setAtEnd(false);
  }, [pathname]);

  const value = useMemo<ChapterContextValue>(
    () => ({ chapters, active, register, activate, setProgress, atEnd, setAtEnd }),
    [chapters, active, register, activate, setProgress, atEnd],
  );

  return <ChapterContext.Provider value={value}>{children}</ChapterContext.Provider>;
}

export function useChapters() {
  const ctx = useContext(ChapterContext);
  if (!ctx) throw new Error("useChapters precisa de ChapterProvider");
  return ctx;
}

export function useChaptersOptional() {
  return useContext(ChapterContext);
}
