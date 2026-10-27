import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent, getSettings } from "@/server/content";
import { getPublicProject, listPublicProjects } from "@/server/repos/public";
import { pageMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";
import { MAIN_NAV, ROUTES } from "@/content/site";
import { Container, Section } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Label";
import { Icon } from "@/components/ui/icons";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/sections/Stagger";
import { PageHero } from "@/components/sections/PageHero";
import { PageSetup } from "@/components/sections/PageSetup";
import { FinalCta } from "@/components/sections/FinalCta";
import { BrandPlaceholder, MediaFigure } from "@/components/sections/primitives";
import { embedUrl, initialsOf } from "@/components/sections/format";

type Props = { params: Promise<{ slug: string }> };

const NAV_LABEL = MAIN_NAV.find((i) => i.href === ROUTES.projetos)?.label ?? "Projetos";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [project, seo] = await Promise.all([getPublicProject(slug), getContent("seo")]);
  if (!project) return {};
  return pageMetadata({
    title: project.seoTitle || `${project.title} | HAIK Negócios`,
    description: project.seoDescription || project.summary || seo.projetos.description,
    path: `${ROUTES.projetos}/${project.slug}`,
    image: project.cover?.url,
  });
}

export default async function ProjetoPage({ params }: Props) {
  const { slug } = await params;
  const [t, projects, settings] = await Promise.all([getContent("projects"), listPublicProjects(), getSettings()]);
  const index = projects.findIndex((p) => p.slug === slug);
  const project = index >= 0 ? projects[index] : await getPublicProject(slug);
  if (!project) notFound();

  const prev = index > 0 ? projects[index - 1] : null;
  const next = index >= 0 && index < projects.length - 1 ? projects[index + 1] : null;
  const path = `${ROUTES.projetos}/${project.slug}`;
  const video = embedUrl(project.videoUrl);
  const blocks = [
    { label: t.labels.scenario, text: project.scenario, icon: "eye" as const },
    { label: t.labels.bottleneck, text: project.bottleneck, icon: "target" as const },
    { label: t.labels.solution, text: project.solution, icon: "spark" as const },
  ].filter((b) => b.text);

  return (
    <>
      <PageSetup formation="exhibit" />
      <JsonLd
        data={breadcrumbLd([
          { name: "Início", path: "/" },
          { name: NAV_LABEL, path: ROUTES.projetos },
          { name: project.title, path },
        ])}
      />

      <PageHero
        eyebrow={{ index: project.segment ?? undefined, text: project.client ?? NAV_LABEL }}
        title={project.title}
        intro={project.summary || undefined}
        size="beat"
        aside={
          project.cover ? (
            <MediaFigure media={project.cover} sizes="(min-width: 901px) 38vw, 100vw" priority className="aspect-[4/3] shadow-[var(--shadow-card)]" />
          ) : (
            <BrandPlaceholder label={project.title} initials={initialsOf(project.client ?? project.title)} icon="cube" className="aspect-[4/3] hairline-dark" />
          )
        }
      >
        {(project.isDemo || project.services.length > 0) && (
          <Reveal y={16} delay={0.7}>
            <ul className="flex flex-wrap gap-1.5" aria-label={t.labels.services}>
              {project.isDemo && (
                <li>
                  <Tag tone="red" className="bg-red text-white dark-chapter:text-white">
                    {t.demoBadge}
                  </Tag>
                </li>
              )}
              {project.services.map((s) => (
                <li key={s}>
                  <Tag tone="line" className="text-grey-300">
                    {s}
                  </Tag>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </PageHero>

      {blocks.length > 0 && (
        <Section id="historia">
          <Container className="grid gap-8">
            <Stagger as="ol" stagger={0.12} className="grid gap-4 md:grid-cols-3">
              {blocks.map((b) => (
                <li key={b.label} className="grid content-start gap-4 rounded-md bg-white p-6 text-ink shadow-[var(--shadow-card-light)] hairline-light sm:p-8">
                  <span className="grid size-10 place-items-center rounded-xs bg-ink text-white" aria-hidden="true">
                    <Icon name={b.icon} className="size-4" />
                  </span>
                  <h2 className="mono text-red">{b.label}</h2>
                  <p className="text-[16px] leading-[1.65]">{b.text}</p>
                </li>
              ))}
            </Stagger>
            {project.result && (
              <Reveal className="grid gap-4 rounded-md border-l-[3px] border-red bg-white p-6 text-ink shadow-[var(--shadow-card-light)] sm:p-8">
                <h2 className="mono text-red">{t.labels.result}</h2>
                <p className="max-w-[60ch] font-display text-[20px] font-medium leading-[1.4] tracking-[-.01em] desk:text-[24px]">{project.result}</p>
              </Reveal>
            )}
          </Container>
        </Section>
      )}

      {(project.gallery.length > 0 || video) && (
        <Section id="galeria" className="pt-0">
          <Container className="grid gap-5">
            {video && (
              <Reveal className="overflow-hidden rounded-md bg-ink-900 shadow-[var(--shadow-card)]">
                <iframe
                  src={video}
                  title={project.title}
                  className="aspect-video w-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </Reveal>
            )}
            {project.gallery.length > 0 && (
              <Stagger as="ul" stagger={0.1} className="grid gap-5 sm:grid-cols-2">
                {project.gallery.map((m) => (
                  <li key={m.id}>
                    <MediaFigure media={m} sizes="(min-width: 640px) 50vw, 100vw" className="aspect-[4/3] shadow-[var(--shadow-card-light)]" />
                  </li>
                ))}
              </Stagger>
            )}
          </Container>
        </Section>
      )}

      {(project.links.length > 0 || project.isDemo) && (
        <Section id="links" className="pt-0">
          <Container className="grid gap-5 desk:grid-cols-2">
            {project.links.length > 0 && (
              <Reveal className="grid content-start gap-3">
                {project.links.map((l) => (
                  <Button key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" variant="outline" arrow className="w-full sm:w-fit">
                    {l.label}
                  </Button>
                ))}
              </Reveal>
            )}
            {project.isDemo && (
              <Reveal className="flex items-start gap-4 rounded-md bg-white p-6 text-ink shadow-[var(--shadow-card-light)] hairline-light">
                <span className="grid size-10 shrink-0 place-items-center rounded-xs bg-red text-white" aria-hidden="true">
                  <Icon name="instagram" className="size-5" />
                </span>
                <p className="text-[16px] leading-[1.6]">
                  <strong className="font-display font-semibold">{t.labels.follow}:</strong>{" "}
                  <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-red underline-offset-4 hover:text-red">
                    {t.followBody}
                  </a>
                </p>
              </Reveal>
            )}
          </Container>
        </Section>
      )}

      {(prev || next) && (
        <Section className="pt-0">
          <Container>
            <nav aria-label={NAV_LABEL} className="grid gap-3 sm:grid-cols-2">
              {prev ? (
                <TransitionLink href={`${ROUTES.projetos}/${prev.slug}`} className="group grid gap-2 rounded-xs bg-[var(--bg)]/70 p-5 hairline transition-colors hover:bg-[var(--fg)] hover:text-[var(--bg)]">
                  <span className="mono text-red">←</span>
                  <span className="font-display text-[18px] font-semibold tracking-[-.02em]">{prev.title}</span>
                </TransitionLink>
              ) : (
                <span aria-hidden="true" />
              )}
              {next && (
                <TransitionLink href={`${ROUTES.projetos}/${next.slug}`} className="group grid gap-2 rounded-xs bg-[var(--bg)]/70 p-5 text-right hairline transition-colors hover:bg-[var(--fg)] hover:text-[var(--bg)]">
                  <span className="mono text-red">→</span>
                  <span className="font-display text-[18px] font-semibold tracking-[-.02em]">{next.title}</span>
                </TransitionLink>
              )}
            </nav>
          </Container>
        </Section>
      )}

      <FinalCta eyebrow={NAV_LABEL} />
    </>
  );
}
