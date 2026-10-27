import { SiteShell } from "@/components/layout/SiteShell";
import { Footer } from "@/components/layout/Footer";
import { getContent, getSettings, isPreview } from "@/server/content";
import { BRAND } from "@/content/site";
import { JsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Layout do site público. Conteúdo do rodapé e configurações vêm do CMS a cada request
 * (renderização dinâmica também é exigida pela CSP com nonce).
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [footer, copy, settings, contents, preview] = await Promise.all([
    getContent("footer"),
    getContent("microcopy"),
    getSettings(),
    getContent("contents"),
    isPreview(),
  ]);
  const whatsappHref = `https://wa.me/${settings.whatsappNumber}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    url: siteUrl,
    slogan: BRAND.tagline,
    description: BRAND.description,
    sameAs: [settings.instagramUrl],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        telephone: `+${settings.whatsappNumber}`,
        availableLanguage: "pt-BR",
        areaServed: "BR",
      },
    ],
  };

  return (
    <>
      <noscript>
        <style>{`.scene{height:auto!important;margin-bottom:0}.scene__frame{position:relative;height:auto;overflow:visible}.scene__layer{position:relative;inset:auto;opacity:1!important;translate:0!important;pointer-events:auto;padding-block:10vh}[data-fade]{opacity:1!important;translate:0!important}[data-chars]{visibility:visible!important}`}</style>
      </noscript>
      <SiteShell
        whatsappHref={whatsappHref}
        copy={copy}
        cookieBanner={settings.cookieBannerEnabled}
        exitPopup={settings.exitPopupEnabled ? { placeholder: contents.capture.placeholder, success: contents.capture.success } : null}
        preview={preview}
      >
        {children}
        <Footer content={footer} settings={settings} />
      </SiteShell>
      <JsonLd data={organizationLd} />
    </>
  );
}
