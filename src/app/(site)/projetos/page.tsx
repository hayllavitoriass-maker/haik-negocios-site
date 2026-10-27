import type { Metadata } from "next";
import { getContent } from "@/server/content";
import { listPublicProjects } from "@/server/repos/public";
import { pageMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";
import { MAIN_NAV, ROUTES } from "@/content/site";
import { Container, Section } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/sections/Stagger";
import { PageHero } from "@/components/sections/PageHero";
import { PageSetup } from "@/components/sections/PageSetup";
import { FinalCta } from "@/components/sections/FinalCta";
import { ProjectCard } from "@/components/sections/Cards";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getContent("seo");
  return pageMetadata({ ...seo.projetos, path: ROUTES.projetos });
}

const NAV_LABEL = MAIN_NAV.find((i) => i.href === ROUTES.projetos)?.label ?? "Projetos";

export default async function ProjetosPage() {
  const [t, projects] = await Promise.all([getContent("projects"), listPublicProjects()]);
  const hasClientProject = projects.some((p) => !p.isDemo);

  return (
    <>
      <PageSetup formation="exhibit" />
      <JsonLd data={breadcrumbLd([{ name: "Início", path: "/" }, { name: NAV_LABEL, path: ROUTES.projetos }])} />

      <PageHero eyebrow={{ text: NAV_LABEL }} title={t.title} intro={t.subtitle} size="beat" />

      <Section id="lista">
        <Container className="grid gap-8">
          {projects.length > 0 && (
            <Stagger as="ul" stagger={0.15} className="grid gap-6">
              {projects.map((p, i) => (
                <ProjectCard key={p.id} project={p} labels={t.labels} demoBadge={t.demoBadge} viewCta={t.viewCta} priority={i === 0} />
              ))}
            </Stagger>
          )}
          {!hasClientProject && (
            <Reveal className="grid gap-5 rounded-md bg-white p-6 text-ink shadow-[var(--shadow-card-light)] hairline-light sm:p-8 desk:flex desk:items-center desk:justify-between">
              <p className="max-w-[48ch] font-display text-[20px] font-medium leading-[1.4] tracking-[-.01em] desk:text-[24px]">{t.emptyBody}</p>
              <Button href={ROUTES.diagnostico} arrow size="lg" className="w-full sm:w-fit">
                {t.emptyCta}
              </Button>
            </Reveal>
          )}
        </Container>
      </Section>

      <FinalCta eyebrow={NAV_LABEL} />
    </>
  );
}
