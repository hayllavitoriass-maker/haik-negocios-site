import type { Metadata } from "next";
import { getContent } from "@/server/content";
import { pageMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";
import { MAIN_NAV, ROUTES } from "@/content/site";
import { Container, Section } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { PageHero } from "@/components/sections/PageHero";
import { PageSetup } from "@/components/sections/PageSetup";
import { MethodRoute } from "@/components/sections/MethodRoute";
import { CtaBand } from "@/components/sections/CtaBand";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getContent("seo");
  return pageMetadata({ ...seo.metodo, path: ROUTES.metodo });
}

const NAV_LABEL = MAIN_NAV.find((i) => i.href === ROUTES.metodo)?.label ?? "Método CLARO";

export default async function MetodoPage() {
  const t = await getContent("method");

  return (
    <>
      <PageSetup formation="row" />
      <JsonLd data={breadcrumbLd([{ name: "Início", path: "/" }, { name: NAV_LABEL, path: ROUTES.metodo }])} />

      <PageHero eyebrow={{ text: NAV_LABEL }} title={t.title} intro={t.subtitle} size="beat">
        <Reveal y={16} delay={0.7} className="pt-2">
          <div className="flex flex-wrap gap-1.5" aria-hidden="true">
            {t.steps.map((s) => (
              <span key={s.letter} className="grid h-12 w-12 place-items-center rounded-xs bg-white/[.06] font-display text-[20px] font-bold text-white hairline-dark">
                {s.letter}
              </span>
            ))}
          </div>
        </Reveal>
      </PageHero>

      <Section id="etapas">
        <Container className="max-w-[1180px]">
          <MethodRoute steps={t.steps} deliverableLabel={t.deliverableLabel} />
        </Container>
      </Section>

      <CtaBand id="cta" eyebrow={NAV_LABEL} title={t.closing} titleSize="h3" cta={t.cta} href={ROUTES.diagnostico} />
    </>
  );
}
