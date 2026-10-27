import type { Metadata } from "next";
import { getContent, getSettings } from "@/server/content";
import { pageMetadata, breadcrumbLd, faqLd, JsonLd } from "@/lib/seo";
import { ROUTES, WHATSAPP_CONTACT_MESSAGE } from "@/content/site";
import { Container, Section } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Faq } from "@/components/ui/Faq";
import { Label } from "@/components/ui/Label";
import { Icon } from "@/components/ui/icons";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/sections/Stagger";
import { DiagnosticForm } from "@/components/forms/DiagnosticForm";
import { PageSetup } from "@/components/sections/PageSetup";
import { ThemeZone } from "@/components/sections/ThemeZone";
import { NumberedSteps, SectionHead } from "@/components/sections/primitives";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getContent("seo");
  return pageMetadata({ ...seo.diagnostico, path: ROUTES.diagnostico });
}

const SUMMARY_LINKS = { services: ROUTES.servicos, method: ROUTES.metodo, about: ROUTES.sobre } as const;

/** Página mais importante do site: formulário no topo, visível sem rolar no desktop. */
export default async function DiagnosticoPage() {
  const [t, faq, copy, footer, settings] = await Promise.all([
    getContent("diagnostic"),
    getContent("faq"),
    getContent("microcopy"),
    getContent("footer"),
    getSettings(),
  ]);
  const whatsapp = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(WHATSAPP_CONTACT_MESSAGE)}`;
  const [whatsLead, whatsLabel] = splitCta(t.whatsappCta);

  return (
    <>
      <PageSetup formation="settle" intensity={0.3} />
      <JsonLd data={breadcrumbLd([{ name: "Início", path: "/" }, { name: footer.diagnosticTitle, path: ROUTES.diagnostico }])} />
      <JsonLd data={faqLd(faq.items)} />

      <section className="relative pb-[clamp(56px,8vw,96px)] pt-[calc(var(--header-h)+clamp(28px,4vw,56px))]" aria-labelledby="diag-title">
        <Container>
          <div className="grid gap-12 desk:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] desk:gap-16 lg:gap-24">
            <div className="grid content-start gap-8 desk:sticky desk:top-[calc(var(--header-h)+24px)] desk:self-start">
              <Reveal y={12}>
                <Label index="30 min" text={footer.diagnosticTitle} />
              </Reveal>
              <SplitHeading as="h1" id="diag-title" text={t.title} immediate delay={0.1} className="text-beat max-w-[12em]" />
              <Reveal y={20} delay={0.4}>
                <p className="max-w-[56ch] text-intro text-[var(--fg-muted)]">{t.subtitle}</p>
              </Reveal>
              <Reveal y={24} delay={0.5} className="grid gap-5 border-t border-[var(--hairline)] pt-8">
                <h2 className="text-card">{t.howTitle}</h2>
                <NumberedSteps items={t.how} />
              </Reveal>
              <Reveal y={16} delay={0.6}>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-grey-500">
                  {whatsLead && <span>{whatsLead}</span>}
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-[var(--fg)] underline-offset-4 hover:text-red hover:underline">
                    <Icon name="whatsapp" className="size-4 text-red" />
                    {whatsLabel}
                  </a>
                </p>
              </Reveal>
            </div>

            <div id="formulario" className="relative rounded-md bg-white p-5 text-ink shadow-[var(--shadow-card-light)] hairline-light sm:p-8 desk:p-10">
              <DiagnosticForm content={t.form} sending={copy.sending} source={ROUTES.diagnostico} />
            </div>
          </div>
        </Container>
      </section>

      <ThemeZone theme="dark" className="relative isolate overflow-hidden bg-ink-900 py-[clamp(64px,10vw,140px)] text-white">
        <div aria-hidden="true" className="grid-bg pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(60%_70%_at_80%_50%,#000,transparent_75%)]" />
        <Container className="relative grid gap-5 desk:grid-cols-2">
          <Reveal className="glass-panel is-on grid content-start gap-4 p-7 sm:p-9">
            <span className="grid size-10 place-items-center rounded-xs bg-white/10 text-white" aria-hidden="true">
              <Icon name="close" className="size-4" />
            </span>
            <h2 className="text-h3">{t.notTitle}</h2>
            <p className="max-w-[52ch] text-[17px] leading-[1.6] text-grey-300">{t.not}</p>
          </Reveal>
          <Reveal delay={0.12} className="glass-panel is-on grid content-start gap-4 p-7 sm:p-9">
            <span className="grid size-10 place-items-center rounded-xs bg-red text-white" aria-hidden="true">
              <Icon name="target" className="size-4" />
            </span>
            <h2 className="text-h3">{t.forTitle}</h2>
            <p className="max-w-[52ch] text-[17px] leading-[1.6] text-grey-300">{t.for}</p>
          </Reveal>
        </Container>
      </ThemeZone>

      <Section id="resumo">
        <Container>
          <Stagger as="ul" stagger={0.1} className="grid gap-5 md:grid-cols-3">
            {(Object.keys(t.summaries) as (keyof typeof t.summaries)[]).map((key, i) => {
              const s = t.summaries[key];
              return (
                <li key={key} className="group relative flex flex-col gap-4 rounded-md bg-white p-6 text-ink shadow-[var(--shadow-card-light)] hairline-light sm:p-8">
                  <span className="mono text-red">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="text-card">{s.title}</h2>
                  <p className="text-[15px] leading-[1.6] text-grey-600">{s.body}</p>
                  <div className="mt-auto pt-2">
                    <Button href={SUMMARY_LINKS[key]} variant="link" arrow className="text-[15px] font-medium">
                      {s.cta}
                    </Button>
                  </div>
                </li>
              );
            })}
          </Stagger>
        </Container>
      </Section>

      <Section id="faq" className="pt-0">
        <Container className="grid gap-12 desk:grid-cols-[minmax(0,.7fr)_minmax(0,1.3fr)] desk:gap-20">
          <SectionHead title={faq.title} size="h2" className="desk:sticky desk:top-[calc(var(--header-h)+32px)] desk:self-start" />
          <Reveal>
            <Faq items={faq.items} id="faq-diagnostico" />
          </Reveal>
        </Container>
      </Section>

      <ThemeZone theme="dark" untilEnd className="relative isolate overflow-hidden bg-ink-900 py-[clamp(64px,10vw,140px)] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -left-[10vw] bottom-[-20vw] size-[44vw] rounded-full bg-red/[.16] blur-[120px]" />
        <Container className="relative flex flex-col items-start justify-between gap-8 desk:flex-row desk:items-center">
          <SplitHeading as="h2" text={t.whatsappCta} mode="words" className="text-h3 max-w-[18em]" />
          <Reveal y={16}>
            <Button href={whatsapp} target="_blank" rel="noopener noreferrer" variant="white" size="lg" icon={<Icon name="whatsapp" className="size-5" />}>
              {whatsLabel}
            </Button>
          </Reveal>
        </Container>
      </ThemeZone>
    </>
  );
}

/** "Prefere falar agora? Chame no WhatsApp" → ["Prefere falar agora?", "Chame no WhatsApp"]. */
function splitCta(text: string): [string, string] {
  const idx = text.indexOf("? ");
  if (idx === -1) return ["", text];
  return [text.slice(0, idx + 1), text.slice(idx + 2)];
}
