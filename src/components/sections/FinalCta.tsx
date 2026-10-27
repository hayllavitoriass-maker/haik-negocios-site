import { Icon } from "@/components/ui/icons";
import { ROUTES, WHATSAPP_CONTACT_MESSAGE } from "@/content/site";
import { getContent, getSettings } from "@/server/content";
import { CtaBand } from "./CtaBand";

/**
 * Bloco de CTA do diagnóstico reutilizado em todas as páginas internas (textos da Home).
 * `cta` permite trocar só o rótulo do botão (ex.: CTA específico de nicho ou serviço).
 */
export async function FinalCta({ cta, eyebrow = "Diagnóstico gratuito", id = "cta" }: { cta?: string; eyebrow?: string; id?: string }) {
  const [home, settings] = await Promise.all([getContent("home"), getSettings()]);
  const t = home.finalCta;
  const whatsapp = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(WHATSAPP_CONTACT_MESSAGE)}`;

  return (
    <CtaBand
      id={id}
      eyebrow={eyebrow}
      title={t.title}
      body={t.body}
      cta={cta ?? t.cta}
      href={ROUTES.diagnostico}
      support={
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{t.support}</span>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-white underline-offset-4 hover:text-red-300 hover:underline">
            <Icon name="whatsapp" className="size-4 text-red-300" />
            {t.supportCta}
          </a>
        </p>
      }
    />
  );
}
