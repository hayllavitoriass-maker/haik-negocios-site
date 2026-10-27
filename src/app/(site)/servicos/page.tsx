import type { Metadata } from "next";
import { getContent } from "@/server/content";
import { pageMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";
import { MAIN_NAV, ROUTES } from "@/content/site";
import { Container, Section } from "@/components/ui/Container";
import { Icon } from "@/components/ui/icons";
import { Reveal } from "@/components/motion/Reveal";
import { PageHero } from "@/components/sections/PageHero";
import { PageSetup } from "@/components/sections/PageSetup";
import { ServiceCards } from "@/components/sections/ServiceCards";
import { CtaBand } from "@/components/sections/CtaBand";
import { SectionHead } from "@/components/sections/primitives";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getContent("seo");
  return pageMetadata({ ...seo.servicos, path: ROUTES.servicos });
}

const NAV_LABEL = MAIN_NAV.find((i) => i.href === ROUTES.servicos)?.label ?? "Serviços";

export default async function ServicosPage() {
  const [t, home] = await Promise.all([getContent("services"), getContent("home")]);
  const tags = Object.fromEntries(home.services.items.map((s) => [s.slug, s.tags]));

  return (
    <>
      <PageSetup formation="board" />
      <JsonLd data={breadcrumbLd([{ name: "Início", path: "/" }, { name: NAV_LABEL, path: ROUTES.servicos }])} />

      <PageHero eyebrow={{ text: NAV_LABEL }} title={t.title} intro={t.subtitle} size="beat" />

      <Section id="servicos">
        <Container>
          <ServiceCards cards={t.cards} tags={tags} />
        </Container>
      </Section>

      <Section id="integrados" className="pt-0">
        <Container className="grid gap-10 desk:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] desk:gap-20">
          <SectionHead title={t.integrated.title} size="h2" />
          <Reveal className="relative grid gap-6 rounded-md bg-white p-6 text-ink shadow-[var(--shadow-card-light)] hairline-light sm:p-10">
            <span className="grid size-11 place-items-center rounded-xs bg-red text-white shadow-[var(--shadow-tile)]" aria-hidden="true">
              <Icon name="network" className="size-5" />
            </span>
            <p className="max-w-[60ch] text-[18px] leading-[1.65] text-ink desk:text-[20px]">{t.integrated.body}</p>
          </Reveal>
        </Container>
      </Section>

      <CtaBand id="cta" eyebrow={NAV_LABEL} title={t.cta.body} titleSize="h3" cta={t.cta.button} href={ROUTES.diagnostico} />
    </>
  );
}
