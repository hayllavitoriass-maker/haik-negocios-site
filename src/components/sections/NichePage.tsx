import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "./Stagger";
import { Button } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Container";
import { Icon } from "@/components/ui/icons";
import type { Formation } from "@/components/three/stage-store";
import type { NicheContent } from "@/content/pages/niches";
import { ROUTES } from "@/content/site";
import { breadcrumbLd, JsonLd } from "@/lib/seo";
import { PageHero } from "./PageHero";
import { PageSetup } from "./PageSetup";
import { FinalCta } from "./FinalCta";
import { ThemeZone } from "./ThemeZone";
import { QuoteCard, SectionHead } from "./primitives";

/** Template das páginas de nicho (Saúde e Arquitetura). */
export function NichePage({ content, path, eyebrow, formation = "stack" }: { content: NicheContent; path: string; eyebrow: string; formation?: Formation }) {
  return (
    <>
      <PageSetup formation={formation} />
      <JsonLd data={breadcrumbLd([{ name: "Início", path: "/" }, { name: eyebrow, path }])} />

      <PageHero
        eyebrow={{ text: eyebrow }}
        title={content.title}
        intro={content.subtitle}
        actions={
          <Button href={ROUTES.diagnostico} size="lg" arrow>
            {content.cta}
          </Button>
        }
      />

      <Section id="dores">
        <Container className="grid gap-12">
          <SectionHead title={content.painsTitle} size="h2" />
          <Stagger as="ul" stagger={0.1} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {content.pains.map((pain, i) => (
              <QuoteCard key={pain} text={pain} index={i} />
            ))}
          </Stagger>
        </Container>
      </Section>

      <ThemeZone theme="dark" className="relative isolate overflow-hidden bg-ink-900 py-[clamp(64px,10vw,140px)] text-white">
        <div aria-hidden="true" className="grid-bg pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(60%_70%_at_20%_50%,#000,transparent_75%)]" />
        <Container className="relative grid gap-12 desk:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] desk:gap-20">
          <SectionHead title={content.solutionsTitle} size="h2" className="desk:sticky desk:top-[calc(var(--header-h)+32px)] desk:self-start" />
          <Stagger as="ol" stagger={0.1} className="grid gap-3">
            {content.solutions.map((s, i) => (
              <li key={s.title} className="glass-panel is-on grid grid-cols-[44px_minmax(0,1fr)] gap-4 p-5 sm:p-6">
                <span className="mono inline-flex h-7 w-11 items-center justify-center rounded-xs bg-red text-[12px] text-white">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-[17px] leading-[1.55]">
                  <strong className="font-display font-semibold tracking-[-.01em] text-white">{s.title}</strong> <span className="text-grey-300">{s.body}</span>
                </p>
              </li>
            ))}
          </Stagger>
        </Container>
      </ThemeZone>

      {(content.care || content.project) && (
        <Section>
          <Container className="grid gap-5 desk:grid-cols-2">
            {content.care && (
              <Reveal className="grid content-start gap-4 rounded-md bg-white p-6 shadow-[var(--shadow-card-light)] hairline-light sm:p-8">
                <span className="grid size-11 place-items-center rounded-xs bg-ink text-white" aria-hidden="true">
                  <Icon name="shield" className="size-5" />
                </span>
                <h2 className="text-card">{content.careTitle}</h2>
                <p className="max-w-[52ch] text-[16px] leading-[1.6] text-grey-600">{content.care}</p>
              </Reveal>
            )}
            {content.project && (
              <Reveal delay={0.1} className="grid content-start gap-4 rounded-md bg-white p-6 shadow-[var(--shadow-card-light)] hairline-light sm:p-8">
                <span className="grid size-11 place-items-center rounded-xs bg-red text-white shadow-[var(--shadow-tile)]" aria-hidden="true">
                  <Icon name="eye" className="size-5" />
                </span>
                <h2 className="text-card">{content.projectTitle}</h2>
                <p className="max-w-[52ch] text-[16px] leading-[1.6] text-grey-600">{content.project}</p>
                <Button href={ROUTES.projetos} variant="dark" arrow className="mt-2 w-fit">
                  {content.projectCta}
                </Button>
              </Reveal>
            )}
          </Container>
        </Section>
      )}

      <FinalCta cta={content.cta} eyebrow={eyebrow} />
    </>
  );
}
