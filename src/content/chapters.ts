import type { Formation, StageTheme } from "@/components/three/stage-store";

/** Ordem canônica dos capítulos da Home (módulo sem "use client": seguro no servidor). */
export const HOME_CHAPTERS = [
  { id: "inicio", label: "Início", theme: "dark", formation: "ramp" },
  { id: "dores", label: "Dores", theme: "dark", formation: "stream" },
  { id: "haik", label: "A HAIK", theme: "dark", formation: "ring" },
  { id: "servicos", label: "Serviços", theme: "light", formation: "board" },
  { id: "metodo", label: "Método", theme: "dark", formation: "row" },
  { id: "ia", label: "IA", theme: "dark", formation: "rise" },
  { id: "segmentos", label: "Segmentos", theme: "light", formation: "stack" },
  { id: "fundadores", label: "Fundadores", theme: "dark", formation: "orbit" },
  { id: "projetos", label: "Projetos", theme: "light", formation: "exhibit" },
  { id: "contato", label: "Diagnóstico", theme: "dark", formation: "settle" },
] as const satisfies readonly { id: string; label: string; theme: StageTheme; formation: Formation }[];
