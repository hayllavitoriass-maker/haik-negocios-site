import type { Metadata } from "next";
import { getContent, getMediaSlots, getSettings } from "@/server/content";
import { pageMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";
import { MAIN_NAV, ROUTES, WHATSAPP_CONTACT_MESSAGE, type MediaSlotKey } from "@/content/site";
import { Container, Section } from "@/components/ui/Container";
import { Icon } from "@/components/ui/icons";
import { FocusText } from "@/components/motion/FocusText";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/sections/Stagger";
import { PageHero } from "@/components/sections/PageHero";
import { PageSetup } from "@/components/sections/PageSetup";
import { CtaBand } from "@/components/sections/CtaBand";
import { ThemeZone } from "@/components/sections/ThemeZone";
import { BrandPlaceholder, MediaFigure, SectionHead } from "@/components/sections/primitives";
import { initialsOf } from "@/components/sections/format";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getContent("seo");
  return pageMetadata({ ...seo.sobre, path: ROUTES.sobre });
}

const NAV_LABEL = MAIN_NAV.find((i) => i.href === ROUTES.sobre)?.label ?? "Sobre";

export default async function SobrePage() {
  const [t, slots, settings, home] = await Promise.all([getContent("about"), getMediaSlots(), getSettings(), getContent("home")]);
  const together = slots["founders.together"];
  const whatsapp = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(WHATSAPP_CONTACT_MESSAGE)}`;

  return (
    <>
      <PageSetup formation="orbit" />
      <JsonLd data={breadcrumbLd([{ name: "Início", path: "/" }, { name: NAV_LABEL, path: ROUTES.sobre }])} />

      <PageHero eyebrow={{ text: NAV_LABEL }} title={t.title} size="beat" />

      <Section id="historia">
        <Container className="grid gap-12 desk:grid-cols-[minmax(0,1.3fr)_minmax(0,.7fr)] desk:items-center desk:gap-20">
          <FocusText text={t.opening} keys={["a ponte"]} className="text-manifesto max-w-[26em] font-display font-medium" />
          {together ? (
            <MediaFigure media={together} sizes="(min-width: 901px) 32vw, 100vw" className="aspect-[4/5]" caption={home.hero.photoCaption} />
          ) : (
            <BrandPlaceholder label={home.hero.photoCaption} initials="H+Í" icon="network" className="aspect-[4/5] hidden desk:block" />
          )}
        </Container>
      </Section>

      <ThemeZone theme="dark" className="relative isolate overflow-hidden bg-ink-900 py-[clamp(64px,10vw,140px)] text-white" id="socios">
        <div aria-hidden="true" className="grid-bg pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000,transparent_75%)]" />
        <Container className="relative grid gap-12">
          <SectionHead title={home.founders.title} intro={home.founders.body} size="h2" />
          <Stagger as="ul" stagger={0.15} className="grid gap-5 md:grid-cols-2">
            {t.founders.map((f, i) => {
              const photo = slots[f.slot as MediaSlotKey];
              return (
                <li key={f.name} className="glass-panel is-on grid gap-6 p-5 sm:p-6">
                  {photo ? (
                    <MediaFigure media={photo} sizes="(min-width: 768px) 45vw, 100vw" className="aspect-[4/3]" />
                  ) : (
                    <BrandPlaceholder label={f.name} initials={initialsOf(f.name)} icon={i === 0 ? "megaphone" : "code"} className="aspect-[4/3]" />
                  )}
                  <div className="grid gap-3 px-1 pb-2">
                    <p className="mono text-red-300">{f.role}</p>
                    <h3 className="text-card">{f.name}</h3>
                    <p className="max-w-[56ch] text-[16px] leading-[1.65] text-grey-300">{f.body}</p>
                    {f.achievement && <p className="mt-1 w-fit rounded-xs bg-red px-3 py-2 font-display text-[15px] font-semibold text-white">{f.achievement}</p>}
                  </div>
                </li>
              );
            })}
          </Stagger>
        </Container>
      </ThemeZone>

      <Section id="juntos">
        <Container className="grid gap-10 desk:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] desk:gap-20">
          <SectionHead title={t.together.title} size="h2" />
          <Reveal>
            <p className="max-w-[60ch] border-l-2 border-red pl-6 text-[19px] leading-[1.6] desk:text-[22px]">{t.together.body}</p>
          </Reveal>
        </Container>
      </Section>

      <Section id="valores" className="pt-0">
        <Container className="grid gap-10">
          <SectionHead title={t.valuesTitle} size="h2" />
          <Stagger as="ol" stagger={0.08} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {t.values.map((v, i) => (
              <li key={v.title} className="grid content-start gap-3 rounded-md bg-white p-6 text-ink shadow-[var(--shadow-card-light)] hairline-light">
                <span className="mono text-red">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-display text-[20px] font-semibold tracking-[-.02em]">{v.title}</h3>
                <p className="text-[15px] leading-[1.6] text-grey-600">{v.body}</p>
              </li>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section id="onde" className="pt-0">
        <Container>
          <Reveal className="flex flex-col gap-6 rounded-md bg-white p-6 text-ink shadow-[var(--shadow-card-light)] hairline-light sm:p-8 desk:flex-row desk:items-center desk:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xs bg-red text-white" aria-hidden="true">
                <Icon name="network" className="size-5" />
              </span>
              <div className="grid gap-1">
                <h2 className="text-card">{t.whereTitle}</h2>
                <p className="text-[16px] leading-[1.6] text-grey-600">
                  {t.where}
                  {settings.mentionCity && t.whereCity ? ` ${t.whereCity}` : ""}
                </p>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      <CtaBand
        id="cta"
        eyebrow={NAV_LABEL}
        title={t.cta.title}
        cta={t.cta.primary}
        href={ROUTES.diagnostico}
        secondary={{ label: t.cta.secondary, href: whatsapp, external: true }}
      />
    </>
  );
}
