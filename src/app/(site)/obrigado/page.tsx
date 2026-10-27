import type { Metadata } from "next";
import { getContent, getMediaSlots, getSettings } from "@/server/content";
import { pageMetadata } from "@/lib/seo";
import { ROUTES, WHATSAPP_CONTACT_MESSAGE } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Icon } from "@/components/ui/icons";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import { PageSetup } from "@/components/sections/PageSetup";
import { Notice } from "@/components/sections/primitives";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getContent("seo");
  return pageMetadata({ ...seo.obrigado, path: ROUTES.obrigado, noindex: true });
}

export default async function ObrigadoPage() {
  const [t, footer, slots, settings] = await Promise.all([getContent("thanks"), getContent("footer"), getMediaSlots(), getSettings()]);
  const checklist = slots["checklist.pdf"];
  const whatsapp = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(WHATSAPP_CONTACT_MESSAGE)}`;

  return (
    <>
      <PageSetup formation="settle" />
      <section className="relative pb-[clamp(64px,10vw,140px)] pt-[calc(var(--header-h)+clamp(48px,9vw,128px))]" aria-labelledby="thanks-title">
        <Container className="grid gap-12 desk:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] desk:items-start desk:gap-20">
          <div className="grid content-start gap-7">
            <Reveal y={12}>
              <Label index="✓" text={footer.diagnosticTitle} />
            </Reveal>
            <SplitHeading as="h1" id="thanks-title" text={t.title} immediate delay={0.1} className="text-beat max-w-[12em]" />
            <Reveal y={20} delay={0.4}>
              <p className="max-w-[56ch] text-intro text-[var(--fg-muted)]">{t.body}</p>
            </Reveal>
            <Reveal y={20} delay={0.5}>
              {checklist ? (
                <a
                  href={checklist.url}
                  download={checklist.filename}
                  className="group inline-flex h-13 w-full items-center justify-between gap-4 rounded-xs bg-red px-6 text-[16px] font-medium leading-none text-white shadow-[0_10px_30px_-12px_rgba(234,25,35,.6)] transition-colors duration-300 hover:bg-ink sm:w-fit"
                >
                  <span>{t.cta}</span>
                  <Icon name="download" className="size-4 transition-transform duration-500 group-hover:translate-y-0.5" />
                </a>
              ) : (
                <Notice className="max-w-[60ch]">{t.checklistPending}</Notice>
              )}
            </Reveal>
          </div>

          <Reveal y={32} delay={0.3} className="chapter--dark relative isolate grid gap-6 overflow-hidden rounded-md bg-ink-900 p-6 text-white sm:p-8 desk:p-10">
            <div aria-hidden="true" className="grid-bg absolute inset-0 opacity-40 [mask-image:linear-gradient(transparent,#000)]" />
            <div className="relative grid gap-4">
              <span className="grid size-11 place-items-center rounded-xs bg-red text-white shadow-[var(--shadow-tile)]" aria-hidden="true">
                <Icon name="whatsapp" className="size-5" />
              </span>
              <h2 className="text-h3">{t.footer}</h2>
              <Button href={whatsapp} target="_blank" rel="noopener noreferrer" variant="white" size="lg" arrow className="w-full sm:w-fit">
                {t.footerCta}
              </Button>
            </div>
            <p className="relative flex items-start gap-2 border-t border-white/10 pt-5 text-[15px] leading-[1.5] text-grey-300">
              <Icon name="instagram" className="mt-[2px] size-4 shrink-0 text-red-300" />
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-white hover:underline">
                {t.follow}
              </a>
            </p>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
