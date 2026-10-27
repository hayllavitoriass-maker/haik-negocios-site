import { Scene, SceneLayer } from "@/components/motion/Scene";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { FocusText } from "@/components/motion/FocusText";
import { Label } from "@/components/ui/Label";
import type { HomeContent } from "@/content/pages/home";
import { HOME_CHAPTERS } from "@/content/chapters";

const chapter = HOME_CHAPTERS[2];

/** Capítulo 02 — O que a HAIK é: título em anel de tiles e manifesto com palavras-chave. */
export function HomeAbout({ content }: { content: HomeContent["about"] }) {
  return (
    <Scene id={chapter.id} index={2} label={chapter.label} theme={chapter.theme} formation={chapter.formation} height={2.6}>
      <div className="vignette-dark pointer-events-none absolute inset-0" aria-hidden="true" />
      <SceneLayer in={0} out={0.38} className="scene__layer--center container-haik">
        <Label index="02" text="A HAIK" />
        <SplitHeading id={`${chapter.id}-title`} text={content.title} className="text-beat max-w-[11em] font-display font-semibold text-white" />
      </SceneLayer>
      <SceneLayer in={0.42} out={1} className="scene__layer--center container-haik">
        <FocusText text={content.body} keys={content.keywords} className="text-manifesto max-w-[26em] font-display font-medium text-white text-shadow-legible" />
      </SceneLayer>
    </Scene>
  );
}
