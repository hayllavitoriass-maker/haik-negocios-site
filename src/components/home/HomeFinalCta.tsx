import { Scene, SceneLayer } from "@/components/motion/Scene";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { ROUTES } from "@/content/site";
import type { HomeContent } from "@/content/pages/home";
import { HOME_CHAPTERS } from "@/content/chapters";

const chapter = HOME_CHAPTERS[9];

/** Capítulo 09 — Chamada final: toda a experiência converge para o diagnóstico gratuito. */
export function HomeFinalCta({ content, whatsappHref }: { content: HomeContent["finalCta"]; whatsappHref: string }) {
  return (
    <Scene id={chapter.id} index={9} label={chapter.label} theme={chapter.theme} formation={chapter.formation} height={1.5} isLast className="[--scene-gap:0px]">
      <div className="vignette-dark pointer-events-none absolute inset-0" aria-hidden="true" />
      <SceneLayer in={0} out={1} className="justify-end" alwaysInteractive>
        <div className="container-haik grid gap-6 pb-[clamp(72px,14vh,140px)] pt-[18vh] desk:max-w-[1100px]">
          <Label index="08" text="Diagnóstico gratuito" />
          <SplitHeading id={`${chapter.id}-title`} text={content.title} className="text-hero max-w-[9em] font-display font-semibold text-white" />
          <Reveal as="p" className="text-intro max-w-[32em] text-grey-200 text-shadow-legible">
            {content.body}
          </Reveal>
          <Reveal className="flex flex-wrap items-center gap-4">
            <Button href={ROUTES.diagnostico} size="lg" arrow>
              {content.cta}
            </Button>
            <span className="text-[14px] text-grey-300">
              {content.support}{" "}
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-white underline underline-offset-4 hover:text-red-300">
                <Icon name="whatsapp" className="size-4" /> {content.supportCta}
              </a>
            </span>
          </Reveal>
        </div>
      </SceneLayer>
    </Scene>
  );
}
