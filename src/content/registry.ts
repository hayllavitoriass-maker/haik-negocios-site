import { homeContent } from "./pages/home";
import {
  serviceAutomationContent,
  serviceMarketingContent,
  serviceSitesContent,
  serviceSystemsContent,
  servicesOverviewContent,
} from "./pages/services";
import { methodContent } from "./pages/method";
import { aboutContent } from "./pages/about";
import { diagnosticContent, faqContent, thanksContent } from "./pages/diagnostic";
import { architectureContent, healthContent } from "./pages/niches";
import { contactContent, contentsContent, footerContent, microcopy, notFoundContent, projectsContent } from "./pages/misc";
import { legalContent } from "./pages/legal";
import { seoContent } from "./seo";

/**
 * Registro central do conteúdo editável. A chave é usada no banco (content_entries.key)
 * e no painel. Os valores padrão são os textos oficiais aprovados.
 */
export const contentRegistry = {
  home: { label: "Home", defaults: homeContent, path: "/" },
  services: { label: "Serviços (visão geral)", defaults: servicesOverviewContent, path: "/servicos" },
  "service.sites": { label: "Serviço: Sites", defaults: serviceSitesContent, path: "/servicos/sites" },
  "service.sistemas": { label: "Serviço: Sistemas", defaults: serviceSystemsContent, path: "/servicos/sistemas" },
  "service.automacoes-e-ia": {
    label: "Serviço: Automações e IA",
    defaults: serviceAutomationContent,
    path: "/servicos/automacoes-e-ia",
  },
  "service.marketing": { label: "Serviço: Marketing e conteúdo", defaults: serviceMarketingContent, path: "/servicos/marketing" },
  method: { label: "Método CLARO", defaults: methodContent, path: "/metodo" },
  about: { label: "Sobre a HAIK", defaults: aboutContent, path: "/sobre" },
  diagnostic: { label: "Diagnóstico gratuito", defaults: diagnosticContent, path: "/diagnostico" },
  thanks: { label: "Página de obrigado", defaults: thanksContent, path: "/obrigado" },
  faq: { label: "Perguntas frequentes", defaults: faqContent, path: "/diagnostico" },
  health: { label: "Nicho: Saúde", defaults: healthContent, path: "/saude" },
  architecture: { label: "Nicho: Arquitetura", defaults: architectureContent, path: "/arquitetura" },
  projects: { label: "Projetos (textos da página)", defaults: projectsContent, path: "/projetos" },
  contents: { label: "Conteúdos (textos da página)", defaults: contentsContent, path: "/conteudos" },
  contact: { label: "Contato", defaults: contactContent, path: "/contato" },
  footer: { label: "Rodapé", defaults: footerContent, path: "/" },
  microcopy: { label: "Microtextos e mensagens", defaults: microcopy, path: "/" },
  notFound: { label: "Página 404", defaults: notFoundContent, path: "/404" },
  legal: { label: "Páginas legais", defaults: legalContent, path: "/privacidade" },
  seo: { label: "SEO por página", defaults: seoContent, path: "/" },
} as const;

export type ContentKey = keyof typeof contentRegistry;
export type ContentOf<K extends ContentKey> = (typeof contentRegistry)[K]["defaults"];
export const CONTENT_KEYS = Object.keys(contentRegistry) as ContentKey[];

export function isContentKey(key: string): key is ContentKey {
  return key in contentRegistry;
}
