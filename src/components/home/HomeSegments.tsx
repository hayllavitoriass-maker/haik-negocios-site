import { Scene, SceneLayer } from "@/components/motion/Scene";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Label } from "@/components/ui/Label";
import { Icon, IconTile, type IconName } from "@/components/ui/icons";
import type { HomeContent } from "@/content/pages/home";
import { HOME_CHAPTERS } from "@/content/chapters";
import { LayerStack } from "./LayerStack";

const chapter = HOME_CHAPTERS[6];
const ICONS: IconName[] = ["calendar", "vector", "bars"];

/** Capítulo 06 — Para quem trabalhamos (claro): pilha CSS 3D + três linhas de segmento. */
export function HomeSegments({ content }: { content: HomeContent["segments"] }) {
  return (
    <Scene id={chapter.id} index={6} label={chapter.label} theme={chapter.theme} formation={chapter.formation} height={2.8}>
      <div className="vignette-light pointer-events-none absolute inset-0" aria-hidden="true" />
      <SceneLayer in={0} out={0.32} className="scene__layer--center container-haik">
        <Label index="05" text="Segmentos" />
        <SplitHeading id={`${chapter.id}-title`} text={content.title} className="text-beat max-w-[12em] font-display font-semibold text-ink" />
      </SceneLayer>
      <SceneLayer in={0.34} out={1} className="container-haik justify-center">
        <div className="glass-panel is-on mx-auto grid w-full max-w-[1100px] gap-6 p-5 desk:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] desk:gap-8 desk:p-[clamp(20px,3vw,40px)]">
          <LayerStack
            layers={[
              { label: "Clínicas e consultórios", meta: "agenda · confirmação · site local", icons: ["calendar", "chat", "shield", "eye"] },
              { label: "Escritórios de arquitetura", meta: "portfólio · briefing · orçamento", icons: ["vector", "layout", "grid", "cursor"] },
              { label: "Contabilidade e imobiliárias", meta: "automação · sistema · atendimento", icons: ["bars", "gear", "arrows", "chip"] },
            ]}
          />
          <ul className="grid content-center">
            {content.items.map((item, i) => (
              <li key={item.title} className="flex items-start gap-3.5 border-t border-ink/10 py-3.5 first:border-t-0">
                <IconTile name={ICONS[i] ?? "cube"} size={28} />
                <div className="grid gap-1">
                  <h3 className="font-sans text-[18px] font-medium tracking-[-.01em]">{item.title}</h3>
                  <p className="text-[14px] leading-[1.55] text-grey-600">{item.body}</p>
                  {item.cta && item.href && (
                    <TransitionLink href={item.href} className="group mt-1 inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-red-700 hover:text-red">
                      {item.cta}
                      <Icon name="arrow" className="size-3.5 transition-transform group-hover:translate-x-1" />
                    </TransitionLink>
                  )}
                </div>
              </li>
            ))}
            <li className="border-t border-ink/10 pt-4 text-[14px] text-grey-500">{content.closing}</li>
          </ul>
        </div>
      </SceneLayer>
    </Scene>
  );
}
