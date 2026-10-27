import { Scene, SceneLayer } from "@/components/motion/Scene";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/content/site";
import type { HomeContent } from "@/content/pages/home";
import type { PublicProject, PublicTestimonial } from "@/server/repos/public";
import { HOME_CHAPTERS } from "@/content/chapters";
import { ProjectExhibit } from "./ProjectExhibit";
import { TestimonialRail } from "./TestimonialRail";

const chapter = HOME_CHAPTERS[8];

/**
 * Capítulo 08 — Prova (claro). Versão de lançamento: Projeto HAIK demonstrativo em destaque.
 * Quando houver depoimentos autorizados, a camada final mostra "O que nossos clientes dizem".
 */
export function HomeProjects({
  content,
  projects,
  testimonials,
  demoBadge,
}: {
  content: HomeContent["proof"];
  projects: PublicProject[];
  testimonials: PublicTestimonial[];
  demoBadge: string;
}) {
  const hasTestimonials = testimonials.length > 0;
  const projectsOut = hasTestimonials ? 0.68 : 1;
  const first = projects[0];
  return (
    <Scene id={chapter.id} index={8} label={chapter.label} theme={chapter.theme} formation={chapter.formation} height={hasTestimonials ? 3.4 : 2.8}>
      <div className="vignette-light pointer-events-none absolute inset-0" aria-hidden="true" />
      <SceneLayer in={0} out={0.26} className="scene__layer--center container-haik">
        <Label index="07" text="Projetos" />
        <SplitHeading id={`${chapter.id}-title`} text={content.title} className="text-beat max-w-[12em] font-display font-semibold text-ink" />
        <p className="text-intro max-w-[36em] text-grey-600">{content.body}</p>
        <Button href={first ? `${ROUTES.projetos}/${first.slug}` : ROUTES.projetos} arrow>
          {content.cta}
        </Button>
      </SceneLayer>
      <SceneLayer in={0.28} out={projectsOut} className="container-haik justify-center">
        <ProjectExhibit projects={projects} demoBadge={demoBadge} from={0.28} to={projectsOut} />
      </SceneLayer>
      {hasTestimonials && (
        <SceneLayer in={0.7} out={1} className="scene__layer--center container-haik">
          <h3 className="text-h2 max-w-[12em] font-display font-semibold text-ink">{content.testimonialsTitle}</h3>
          <TestimonialRail items={testimonials} />
        </SceneLayer>
      )}
    </Scene>
  );
}
