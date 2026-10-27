import { Scene, SceneLayer } from "@/components/motion/Scene";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/content/site";
import type { HomeContent } from "@/content/pages/home";
import type { MediaSlotMap } from "@/server/content";
import type { MediaSlotKey } from "@/content/site";
import { HOME_CHAPTERS } from "@/content/chapters";
import { FounderPortrait } from "./FounderPortrait";

const chapter = HOME_CHAPTERS[7];

/** Capítulo 07 — Quem está por trás: dois cards com fotos reais (ou composição de marca). */
export function HomeFounders({ content, slots }: { content: HomeContent["founders"]; slots: MediaSlotMap }) {
  return (
    <Scene id={chapter.id} index={7} label={chapter.label} theme={chapter.theme} formation={chapter.formation} height={2.8}>
      <div className="vignette-dark pointer-events-none absolute inset-0" aria-hidden="true" />
      <SceneLayer in={0} out={0.3} className="scene__layer--center container-haik">
        <Label index="06" text="Fundadores" />
        <SplitHeading id={`${chapter.id}-title`} text={content.title} className="text-beat max-w-[11em] font-display font-semibold text-white" />
        <p className="text-intro max-w-[34em] text-grey-200 text-shadow-legible">{content.body}</p>
      </SceneLayer>
      <SceneLayer in={0.32} out={1} className="container-haik justify-center">
        <div className="mx-auto grid w-full max-w-[1000px] gap-4 desk:grid-cols-2 desk:gap-6">
          {content.people.map((person, i) => (
            <Reveal key={person.name} delay={i * 0.12} as="article" className="grid gap-4 rounded-md bg-ink-900/80 p-3 text-white hairline-dark backdrop-blur-[12px] pointer-coarse:backdrop-blur-none desk:grid-cols-[150px_minmax(0,1fr)] desk:p-4">
              <FounderPortrait media={slots[person.slot as MediaSlotKey]} name={person.name} className="aspect-[4/5] desk:aspect-auto desk:h-full" sizes="(max-width: 900px) 100vw, 150px" />
              <div className="grid content-start gap-2 p-1">
                <h3 className="text-card font-display font-semibold">{person.name}</h3>
                <p className="mono text-red-300">{person.role}</p>
                <p className="text-[15px] leading-[1.6] text-grey-300">{person.body}</p>
              </div>
            </Reveal>
          ))}
          <div className="grid items-center gap-4 desk:col-span-2 desk:grid-cols-[1fr_auto]">
            <p className="text-[15px] text-grey-300 text-shadow-legible">{content.closing}</p>
            <Button href={ROUTES.sobre} variant="ghost" arrow>
              {content.cta}
            </Button>
          </div>
        </div>
      </SceneLayer>
    </Scene>
  );
}
