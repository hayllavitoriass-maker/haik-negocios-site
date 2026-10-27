import { PageStage } from "@/components/motion/PageStage";
import type { Formation } from "@/components/three/stage-store";
import { FooterThemeSync } from "./ThemeZone";

/**
 * Configuração de uma página interna: formação/intensidade da cena 3D persistente
 * e sincronização do tema do header com o rodapé escuro.
 */
export function PageSetup({ formation, intensity = 0.45 }: { formation: Formation; intensity?: number }) {
  return (
    <>
      <PageStage formation={formation} theme="light" intensity={intensity} />
      <FooterThemeSync />
    </>
  );
}
