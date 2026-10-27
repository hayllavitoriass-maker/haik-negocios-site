import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent, getMediaSlots } from "@/server/content";
import { pageMetadata, breadcrumbLd, faqLd, JsonLd } from "@/lib/seo";
import { MAIN_NAV, ROUTES, SERVICE_NAV, type MediaSlotKey } from "@/content/site";
import { SERVICE_PAGES, type ServiceSlug } from "@/content/pages/services";
import type { ContentKey } from "@/content/registry";
import type { SeoKey } from "@/content/seo";
import { Container, Section } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Faq } from "@/components/ui/Faq";
import { IconTile } from "@/components/ui/icons";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/sections/Stagger";
import { PageHero } from "@/components/sections/PageHero";
import { PageSetup } from "@/components/sections/PageSetup";
import { FinalCta } from "@/components/sections/FinalCta";
import { ThemeZone } from "@/components/sections/ThemeZone";
import { SERVICE_ICONS } from "@/components/sections/ServiceCards";
import { CheckList, MediaFigure, SectionHead } from "@/components/sections/primitives";

const CONTENT_KEYS = {
  sites: "service.sites",
  sistemas: "service.sistemas",
  "automacoes-e-ia": "service.automacoes-e-ia",
  marketing: "service.marketing",
} as const satisfies Record<ServiceSlug, ContentKey>;

const SEO_KEYS = { sites: "sites", sistemas: "sistemas", "automacoes-e-ia": "automacoes", marketing: "marketing" } as const satisfies Record<ServiceSlug, SeoKey>;

const SLOT_KEYS = {
  sites: "services.sites",
  sistemas: "services.sistemas",
  "automacoes-e-ia": "services.automacoes",
  marketing: "services.marketing",
} as const satisfies Record<ServiceSlug, MediaSlotKey>;

function isServiceSlug(slug: string): slug is ServiceSlug {
  return slug in SERVICE_PAGES;
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isServiceSlug(slug)) return {};
  const seo = await getContent("seo");
  return pageMetadata({ ...seo[SEO_KEYS[slug]], path: `${ROUTES.servicos}/${slug}` });
}

const NAV_LABEL = MAIN_NAV.find((i) => i.href === ROUTES.servicos)?.label ?? "Serviços";

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  if (!isServiceSlug(slug)) notFound();

  const [t, slots] = await Promise.all([getContent(CONTENT_KEYS[slug]), getMediaSlots()]);
  const path = `${ROUTES.servicos}/${slug}`;
  const navIndex = SERVICE_NAV.findIndex((i) => i.href === path);
  const navLabel = SERVICE_NAV[navIndex]?.label ?? t.title;
  const cover = slots[SLOT_KEYS[slug]];
  const others = SERVICE_NAV.filter((i) => i.href !== path);

  return (
    <>
      <PageSetup formation="board" />
      <JsonLd
        data={breadcrumbLd([
          { name: "Início", path: "/" },
          { name: NAV_LABEL, path: ROUTES.servicos },
          { name: navLabel, path },
        ])}
      />
      <JsonLd data={faqLd(t.faq)} />

      <PageHero
        eyebrow={{ index: String(navIndex + 1).padStart(2, "0"), text: navLabel }}
        title={t.title}
        intro={t.subtitle}
        size="beat"
        actions={
          <Button href={ROUTES.diagnostico} size="lg" arrow>
            {t.cta}
          </Button>
        }
        aside={
          cover ? (
            <MediaFigure media={cover} sizes="(min-width: 901px) 38vw, 100vw" priority className="aspect-[4/3] shadow-[var(--shadow-card)]" />
          ) : (
            <div className="grid-bg relative hidden aspect-[4/3] place-items-center overflow-hidden rounded-md bg-white/[.03] hairline-dark desk:grid [mask-image:radial-gradient(70%_70%_at_50%_50%,#000,transparent)]" aria-hidden="true">
              <IconTile name={SERVICE_ICONS[slug] ?? "cube"} size={120} className="animate-float" />
            </div>
          )
        }
      />

      <Section id="problema">
        <Container className="grid gap-8 desk:grid-cols-[minmax(0,.7fr)_minmax(0,1.3fr)] desk:gap-20">
          <SectionHead title={t.problemTitle} size="h3" />
          <Reveal>
            <p className="max-w-[60ch] border-l-2 border-red pl-6 text-[19px] leading-[1.6] text-[var(--fg)] desk:text-[22px]">{t.problem}</p>
          </Reveal>
        </Container>
      </Section>

      <Section id="entregas" className="pt-0">
        <Container className="grid gap-10">
          <SectionHead title={t.deliverTitle} size="h2" />
          <CheckList items={t.deliverables} columns={2} />
        </Container>
      </Section>

      <ThemeZone theme="dark" className="relative isolate overflow-hidden bg-ink-900 py-[clamp(64px,10vw,140px)] text-white">
        <div aria-hidden="true" className="grid-bg pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(60%_70%_at_20%_50%,#000,transparent_75%)]" />
        <Container className={t.why ? "relative grid gap-5 desk:grid-cols-2" : "relative grid"}>
          <Reveal className="glass-panel is-on grid content-start gap-4 p-7 sm:p-9">
            <h2 className="text-h3">{t.typesTitle}</h2>
            <p className="max-w-[56ch] text-[17px] leading-[1.6] text-grey-300">{t.types}</p>
          </Reveal>
          {t.why && (
            <Reveal delay={0.12} className="glass-panel is-on grid content-start gap-4 p-7 sm:p-9">
              <h2 className="text-h3">{t.whyTitle}</h2>
              <p className="max-w-[56ch] text-[17px] leading-[1.6] text-grey-300">{t.why}</p>
            </Reveal>
          )}
        </Container>
      </ThemeZone>

      <Section id="faq">
        <Container className="grid gap-12 desk:grid-cols-[minmax(0,.7fr)_minmax(0,1.3fr)] desk:gap-20">
          <SectionHead title={t.faqTitle} size="h2" className="desk:sticky desk:top-[calc(var(--header-h)+32px)] desk:self-start" />
          <Reveal>
            <Faq items={t.faq} id={`faq-${slug}`} />
          </Reveal>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <Stagger as="ul" stagger={0.08} className="grid gap-3 sm:grid-cols-3">
            {others.map((o) => (
              <li key={o.href}>
                <TransitionLink
                  href={o.href}
                  className="group flex h-full items-center justify-between gap-4 rounded-xs bg-[var(--bg)]/70 px-5 py-4 text-[15px] font-medium hairline transition-colors hover:bg-[var(--fg)] hover:text-[var(--bg)]"
                >
                  <span>{o.label}</span>
                  <span className="mono text-red group-hover:text-red-300">→</span>
                </TransitionLink>
              </li>
            ))}
          </Stagger>
        </Container>
      </Section>

      <FinalCta cta={t.cta} eyebrow={navLabel} />
    </>
  );
}
