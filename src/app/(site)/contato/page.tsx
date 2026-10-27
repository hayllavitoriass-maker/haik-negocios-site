import type { Metadata } from "next";
import { getContent, getSettings } from "@/server/content";
import { pageMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";
import { FOOTER_NAV, ROUTES, WHATSAPP_CONTACT_MESSAGE } from "@/content/site";
import { Container, Section } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/sections/Stagger";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHero } from "@/components/sections/PageHero";
import { PageSetup } from "@/components/sections/PageSetup";
import { SectionHead } from "@/components/sections/primitives";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getContent("seo");
  return pageMetadata({ ...seo.contato, path: ROUTES.contato });
}

const NAV_LABEL = FOOTER_NAV.find((i) => i.href === ROUTES.contato)?.label ?? "Contato";

export default async function ContatoPage() {
  const [t, copy, settings] = await Promise.all([getContent("contact"), getContent("microcopy"), getSettings()]);
  const whatsapp = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(WHATSAPP_CONTACT_MESSAGE)}`;
  const hours = settings.businessHours ? t.hoursTemplate.replace("{HORARIO}", settings.businessHours) : t.hoursFallback;

  const card = "group relative flex flex-col gap-5 rounded-md bg-white p-6 text-ink shadow-[var(--shadow-card-light)] hairline-light sm:p-8";

  return (
    <>
      <PageSetup formation="ring" />
      <JsonLd data={breadcrumbLd([{ name: "Início", path: "/" }, { name: NAV_LABEL, path: ROUTES.contato }])} />

      <PageHero eyebrow={{ text: NAV_LABEL }} title={t.title} intro={t.subtitle} size="beat" />

      <Section id="canais">
        <Container>
          <Stagger as="ul" stagger={0.12} className="grid gap-5 md:grid-cols-3">
            <li className={card}>
              <span className="grid size-12 place-items-center rounded-xs bg-red text-white shadow-[var(--shadow-tile)]" aria-hidden="true">
                <Icon name="whatsapp" className="size-6" />
              </span>
              <div className="grid gap-2">
                <h2 className="text-card">{t.cards.whatsapp.title}</h2>
                <p className="font-display text-[18px] font-medium tracking-[-.01em]">{settings.whatsappDisplay}</p>
                {settings.responseTime && <p className="text-[14px] leading-[1.5] text-grey-500">{settings.responseTime}</p>}
              </div>
              <div className="mt-auto pt-2">
                <Button href={whatsapp} target="_blank" rel="noopener noreferrer" arrow className="w-full sm:w-fit">
                  {t.cards.whatsapp.cta}
                </Button>
              </div>
            </li>
            <li className={card}>
              <span className="grid size-12 place-items-center rounded-xs bg-ink text-white" aria-hidden="true">
                <Icon name="instagram" className="size-6" />
              </span>
              <div className="grid gap-2">
                <h2 className="text-card">{t.cards.instagram.title}</h2>
                <p className="font-display text-[18px] font-medium tracking-[-.01em]">{settings.instagramHandle}</p>
                <p className="text-[14px] leading-[1.5] text-grey-500">{t.cards.instagram.support}</p>
              </div>
              <div className="mt-auto pt-2">
                <Button href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" variant="dark" arrow className="w-full sm:w-fit">
                  {t.cards.instagram.cta}
                </Button>
              </div>
            </li>
            <li className={card}>
              <span className="grid size-12 place-items-center rounded-xs bg-grey-100 text-red" aria-hidden="true">
                <Icon name="target" className="size-6" />
              </span>
              <div className="grid gap-2">
                <h2 className="text-card">{t.cards.diagnostic.title}</h2>
                <p className="text-[15px] leading-[1.6] text-grey-600">{t.cards.diagnostic.body}</p>
              </div>
              <div className="mt-auto pt-2">
                <Button href={ROUTES.diagnostico} variant="outline" arrow className="w-full sm:w-fit">
                  {t.cards.diagnostic.cta}
                </Button>
              </div>
            </li>
          </Stagger>
        </Container>
      </Section>

      <Section id="mensagem" className="pt-0">
        <Container className="grid gap-10 desk:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] desk:gap-20">
          <div className="grid content-start gap-10 desk:sticky desk:top-[calc(var(--header-h)+32px)] desk:self-start">
            <SectionHead title={t.form.title} size="h2" />
            <Reveal className="grid gap-3 border-t border-[var(--hairline)] pt-6">
              <h3 className="mono flex items-center gap-2 text-red">
                <Icon name="clock" className="size-4" />
                {t.hoursTitle}
              </h3>
              <p className="max-w-[40ch] text-[16px] leading-[1.6] text-[var(--fg-muted)]">{hours}</p>
            </Reveal>
          </div>
          <Reveal className="rounded-md bg-white p-5 text-ink shadow-[var(--shadow-card-light)] hairline-light sm:p-8 desk:p-10">
            <ContactForm content={t.form} sending={copy.sending} />
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
