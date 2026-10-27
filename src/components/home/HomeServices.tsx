import { Scene, SceneLayer } from "@/components/motion/Scene";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Label } from "@/components/ui/Label";
import type { HomeContent } from "@/content/pages/home";
import { HOME_CHAPTERS } from "@/content/chapters";
import { FeatureCards } from "./FeatureCards";

const chapter = HOME_CHAPTERS[3];

/** Capítulo 03 — Serviços (capítulo claro): quatro cards com entrada cinematográfica; pilha no mobile. */
export function HomeServices({ content }: { content: HomeContent["services"] }) {
  return (
    <Scene id={chapter.id} index={3} label={chapter.label} theme={chapter.theme} formation={chapter.formation} height={3.2}>
      <div className="vignette-light pointer-events-none absolute inset-0" aria-hidden="true" />
      <SceneLayer in={0} out={0.26} className="scene__layer--center container-haik">
        <Label index="03" text="Serviços" />
        <SplitHeading id={`${chapter.id}-title`} text={content.title} className="text-beat max-w-[11em] font-display font-semibold text-ink" />
      </SceneLayer>
      <SceneLayer in={0.28} out={1} className="container-haik justify-center">
        <FeatureCards items={content.items} from={0.28} to={0.95} />
      </SceneLayer>
    </Scene>
  );
}
