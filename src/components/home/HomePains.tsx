import { Scene, SceneLayer } from "@/components/motion/Scene";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Label } from "@/components/ui/Label";
import type { HomeContent } from "@/content/pages/home";
import { HOME_CHAPTERS } from "@/content/chapters";
import { PainCards } from "./PainCards";

const chapter = HOME_CHAPTERS[1];

/** Capítulo 01 — Dores: seis frases em "balões" que surgem em sequência conforme o scroll. */
export function HomePains({ content }: { content: HomeContent["pains"] }) {
  return (
    <Scene id={chapter.id} index={1} label={chapter.label} theme={chapter.theme} formation={chapter.formation} height={3}>
      <div className="vignette-dark pointer-events-none absolute inset-0" aria-hidden="true" />
      <SceneLayer in={0} out={0.22} className="scene__layer--center container-haik">
        <Label index="01" text="Dores" />
        <SplitHeading id={`${chapter.id}-title`} text={content.title} className="text-beat max-w-[12em] font-display font-semibold text-white" />
      </SceneLayer>
      <SceneLayer in={0.24} out={0.8} className="container-haik justify-center">
        <PainCards items={content.items} from={0.24} to={0.78} />
      </SceneLayer>
      <SceneLayer in={0.82} out={1} className="scene__layer--center container-haik">
        <p className="text-manifesto max-w-[20em] font-display font-medium text-white text-shadow-legible">{content.closing}</p>
      </SceneLayer>
    </Scene>
  );
}
