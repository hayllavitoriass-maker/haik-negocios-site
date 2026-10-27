import { TransitionLink } from "@/components/motion/TransitionLink";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { FOOTER_NAV, ROUTES, SERVICE_NAV } from "@/content/site";
import type { footerContent } from "@/content/pages/misc";
import type { SiteSettings } from "@/content/site";

type Props = { content: typeof footerContent; settings: SiteSettings };

/** Rodapé escuro com a marca gigante cortada na base (assinatura visual do capítulo final). */
export function Footer({ content, settings }: Props) {
  const whatsappLink = `https://wa.me/${settings.whatsappNumber}`;
  return (
    <footer className="chapter--dark relative isolate overflow-hidden bg-ink-900 text-white" aria-labelledby="footer-title">
      <div className="container-haik relative z-[1] grid gap-12 pb-10 pt-[clamp(56px,8vw,96px)]">
        <div className="grid gap-10 desk:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="grid content-start gap-4">
            <p id="footer-title" className="font-display text-[22px] font-bold leading-none tracking-[-.02em]">
              HAIK Negócios
            </p>
            <p className="text-[15px] text-grey-300">{content.tagline}</p>
            <p className="max-w-[36ch] text-[14px] leading-[1.6] text-grey-400">{content.description}</p>
          </div>
          <nav aria-label="Navegação do rodapé" className="grid content-start gap-2 text-[14px]">
            <p className="mono mb-2 text-grey-400">{content.navTitle}</p>
            {FOOTER_NAV.map((i) => (
              <TransitionLink key={i.href} href={i.href} className="w-fit text-grey-200 underline-offset-4 hover:text-white hover:underline">
                {i.label}
              </TransitionLink>
            ))}
          </nav>
          <nav aria-label="Serviços" className="grid content-start gap-2 text-[14px]">
            <p className="mono mb-2 text-grey-400">{content.servicesTitle}</p>
            {SERVICE_NAV.map((i) => (
              <TransitionLink key={i.href} href={i.href} className="w-fit text-grey-200 underline-offset-4 hover:text-white hover:underline">
                {i.label}
              </TransitionLink>
            ))}
          </nav>
          <div className="grid content-start gap-3 text-[14px]">
            <p className="mono mb-1 text-grey-400">{content.contactTitle}</p>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-2 text-grey-200 hover:text-white">
              <Icon name="whatsapp" className="size-4 text-red-300" /> WhatsApp {settings.whatsappDisplay}
            </a>
            <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-2 text-grey-200 hover:text-white">
              <Icon name="instagram" className="size-4 text-red-300" /> Instagram {settings.instagramHandle}
            </a>
            {settings.email && (
              <a href={`mailto:${settings.email}`} className="inline-flex w-fit items-center gap-2 text-grey-200 hover:text-white">
                <Icon name="mail" className="size-4 text-red-300" /> {settings.email}
              </a>
            )}
            <div className="mt-3 grid gap-2 rounded-xs p-4 hairline-dark">
              <p className="mono text-grey-400">{content.diagnosticTitle}</p>
              <p className="text-[14px] text-grey-200">{content.diagnosticBody}</p>
              <Button href={ROUTES.diagnostico} size="sm" arrow className="mt-1 w-fit">
                {content.diagnosticCta}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-[12px] text-grey-400 desk:flex-row desk:items-center desk:justify-between">
          <p>
            © {new Date().getFullYear()} HAIK Negócios{settings.cnpj ? ` · CNPJ ${settings.cnpj}` : ""}
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <TransitionLink href={ROUTES.privacidade} className="underline-offset-4 hover:text-white hover:underline">
              {content.privacy}
            </TransitionLink>
            <TransitionLink href={ROUTES.termos} className="underline-offset-4 hover:text-white hover:underline">
              {content.terms}
            </TransitionLink>
          </div>
        </div>
      </div>
      <div className="brand-mark container-haik text-[22vw] text-white/[0.07]" aria-hidden="true">
        <span className="-ml-[.04em] inline-block">HAIK</span>
      </div>
    </footer>
  );
}
