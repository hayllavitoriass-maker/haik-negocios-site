import Image from "next/image";
import { Scene, SceneLayer } from "@/components/motion/Scene";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/content/site";
import type { HomeContent } from "@/content/pages/home";
import type { PublicMedia } from "@/server/media/url";
import { HOME_CHAPTERS } from "@/content/chapters";

const chapter = HOME_CHAPTERS[0];

/**
 * Capítulo 00 — Hero. Título com entrada por caractere e a palavra "clareza" em vermelho.
 * Espaço reservado para a foto real dos sócios (slot founders.together); sem foto,
 * a composição fica por conta dos tiles 3D.
 */
export function HomeHero({ content, photo }: { content: HomeContent["hero"]; photo?: PublicMedia | null }) {
  return (
    <Scene id={chapter.id} index={0} label={chapter.label} theme={chapter.theme} formation={chapter.formation} height={2.1} className="[--scene-gap:10vh]">
      <SceneLayer in={0} out={0.86} className="justify-end">
        <div className="vignette-dark pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <div className="container-haik grid items-end gap-8 pb-[clamp(96px,14vh,140px)] pt-[calc(var(--header-h)+24px)] desk:grid-cols-[minmax(0,1.3fr)_minmax(0,420px)] desk:gap-10">
          <div className="grid gap-6">
            <p className="animate-intro-in mono inline-flex w-fit items-center gap-[3px]">
              <span className="rounded-xs bg-red px-[9px] pt-[7px] pb-[6px] text-white">00</span>
              <span className="rounded-xs bg-white px-[9px] pt-[7px] pb-[6px] text-ink">{content.badge}</span>
            </p>
            <SplitHeading
              as="h1"
              id={`${chapter.id}-title`}
              text={content.title}
              highlight={content.highlight}
              immediate
              delay={0.2}
              className="text-hero -ml-[.05em] max-w-[11em] font-display font-semibold text-white"
            />
          </div>
          <div className="grid gap-6 desk:pb-2">
            {photo && (
              <div className="relative aspect-[4/3] w-full max-w-[420px] overflow-hidden rounded-md hairline-dark">
                <Image
                  src={photo.url}
                  alt={photo.alt || content.photoCaption}
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 420px"
                  className="object-cover"
                  style={{ objectPosition: `${photo.focalX * 100}% ${photo.focalY * 100}%` }}
                />
                <span className="mono absolute bottom-3 left-3 rounded-xs bg-ink/80 px-2 py-1.5 text-white">{content.photoCaption}</span>
              </div>
            )}
            <p className="animate-intro-in text-intro max-w-[36em] text-grey-200 text-shadow-legible [animation-delay:.5s]">{content.subtitle}</p>
            <div className="animate-intro-in flex flex-wrap gap-2 [animation-delay:.65s]">
              <Button href={ROUTES.diagnostico} arrow>
                {content.primaryCta}
              </Button>
              <Button href={ROUTES.metodo} variant="ghost">
                {content.secondaryCta}
              </Button>
            </div>
            <p className="animate-intro-in text-[13px] text-grey-400 [animation-delay:.8s]">{content.support}</p>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-grey-400 desk:flex" aria-hidden="true">
          <span className="mono">role para descobrir</span>
          <span className="block h-8 w-px overflow-hidden bg-white/15">
            <span className="block h-1/2 w-full animate-[scroll-hint_1.8s_ease-in-out_infinite] bg-red" />
          </span>
        </div>
      </SceneLayer>
    </Scene>
  );
}
