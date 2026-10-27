import { Scene, SceneLayer } from "@/components/motion/Scene";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/content/site";
import type { HomeContent } from "@/content/pages/home";
import { HOME_CHAPTERS } from "@/content/chapters";
import { MethodRoute, MethodStep } from "./MethodSteps";

const chapter = HOME_CHAPTERS[4];

const LOGS: Record<string, string[]> = {
  C: ["> clareza", "→ diagnóstico gratuito de 30 min", "→ gargalo principal identificado"],
  L: ["> leitura", "→ briefing e reunião", "→ rotina, público e metas mapeados"],
  A: ["> arquitetura", "→ solução completa desenhada", "→ prazos e metas definidos"],
  R: ["> realização", "→ produção em etapas", "→ sua aprovação a cada entrega"],
  O: ["> operação", "→ entrega em reunião", "→ acompanhamento dos resultados"],
};

/**
 * Capítulo 04 — Método CLARO: uma rota com cinco nós que acende com o scroll (desktop)
 * e cinco painéis de etapa com terminal digitado. A formação 3D "row" destaca a etapa ativa.
 */
export function HomeMethod({ content }: { content: HomeContent["method"] }) {
  const n = content.steps.length;
  const first = 0.2;
  const span = (0.98 - first) / n;
  return (
    <Scene id={chapter.id} index={4} label={chapter.label} theme={chapter.theme} formation={chapter.formation} height={4.2}>
      <div className="vignette-dark pointer-events-none absolute inset-0" aria-hidden="true" />
      <SceneLayer in={0} out={0.17} className="scene__layer--center container-haik">
        <Label index="04" text="Método CLARO" />
        <SplitHeading id={`${chapter.id}-title`} text={content.title} className="text-beat max-w-[11em] font-display font-semibold text-white" />
        <p className="text-intro max-w-[34em] text-grey-200 text-shadow-legible">{content.subtitle}</p>
      </SceneLayer>

      <SceneLayer in={0.16} out={1} className="scene__layer--desk pointer-events-none justify-end pb-[8vh]">
        <div className="container-haik">
          <MethodRoute steps={content.steps} from={first} to={0.98} />
        </div>
      </SceneLayer>

      {content.steps.map((step, i) => {
        const start = first + i * span;
        const end = start + span - 0.02;
        return (
          <SceneLayer key={step.letter} in={start} out={end} className="scene__layer--left container-haik pb-[18vh] desk:pb-[24vh]" as="article">
            <MethodStep
              index={i}
              total={n}
              letter={step.letter}
              name={step.name}
              body={step.body}
              log={LOGS[step.letter] ?? []}
              from={start}
              to={end}
              cta={
                i === n - 1 ? (
                  <Button href={ROUTES.metodo} size="sm" arrow className="mt-2">
                    {content.cta}
                  </Button>
                ) : null
              }
            />
          </SceneLayer>
        );
      })}
    </Scene>
  );
}
