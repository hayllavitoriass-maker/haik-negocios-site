/**
 * Constantes de marca e configurações editáveis pelo painel (valores padrão oficiais).
 * Campos entre colchetes no documento da HAIK ficam vazios aqui e são preenchidos no painel.
 */
export const BRAND = {
  name: "HAIK Negócios",
  shortName: "HAIK",
  tagline: "Marketing que pensa. Tecnologia que executa.",
  description:
    "Empresa de marketing e tecnologia para negócios que querem crescer com clareza. Atendimento 100% online para todo o Brasil.",
} as const;

export const WHATSAPP_NUMBER = "5586994258011";
export const WHATSAPP_DISPLAY = "(86) 99425-8011";
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;
export const WHATSAPP_CONTACT_MESSAGE = "Olá, vim pelo site da HAIK e quero conversar sobre meu negócio.";
export const WHATSAPP_CONTACT_LINK = `${WHATSAPP_LINK}?text=${encodeURIComponent(WHATSAPP_CONTACT_MESSAGE)}`;
export const INSTAGRAM_HANDLE = "@haiknegocios";
export const INSTAGRAM_LINK = "https://instagram.com/haiknegocios";

export const ROUTES = {
  home: "/",
  diagnostico: "/diagnostico",
  servicos: "/servicos",
  sites: "/servicos/sites",
  sistemas: "/servicos/sistemas",
  automacoes: "/servicos/automacoes-e-ia",
  marketing: "/servicos/marketing",
  metodo: "/metodo",
  sobre: "/sobre",
  saude: "/saude",
  arquitetura: "/arquitetura",
  projetos: "/projetos",
  conteudos: "/conteudos",
  contato: "/contato",
  obrigado: "/obrigado",
  privacidade: "/privacidade",
  termos: "/termos",
} as const;

export const MAIN_NAV = [
  { label: "Serviços", href: ROUTES.servicos },
  { label: "Método CLARO", href: ROUTES.metodo },
  { label: "Projetos", href: ROUTES.projetos },
  { label: "Sobre", href: ROUTES.sobre },
  { label: "Conteúdos", href: ROUTES.conteudos },
] as const;

export const FOOTER_NAV = [
  { label: "Serviços", href: ROUTES.servicos },
  { label: "Método CLARO", href: ROUTES.metodo },
  { label: "Projetos", href: ROUTES.projetos },
  { label: "Sobre", href: ROUTES.sobre },
  { label: "Conteúdos", href: ROUTES.conteudos },
  { label: "Contato", href: ROUTES.contato },
] as const;

export const SERVICE_NAV = [
  { label: "Sites", href: ROUTES.sites },
  { label: "Sistemas", href: ROUTES.sistemas },
  { label: "Automações e IA", href: ROUTES.automacoes },
  { label: "Marketing e conteúdo", href: ROUTES.marketing },
] as const;

/** Configurações editáveis no painel (/admin/configuracoes). */
export const settingsDefaults = {
  whatsappNumber: WHATSAPP_NUMBER,
  whatsappDisplay: WHATSAPP_DISPLAY,
  instagramHandle: INSTAGRAM_HANDLE,
  instagramUrl: INSTAGRAM_LINK,
  email: "", // [E-MAIL, se houver]
  businessHours: "", // [HORÁRIO] ex.: 9h às 18h
  cnpj: "", // [CNPJ]
  city: "Teresina, Piauí",
  mentionCity: false, // [CONFIRMAR SE QUEREM CITAR A CIDADE]
  responseTime: "até 2 horas no horário comercial",
  seoDefaultTitle: "HAIK Negócios | Marketing e Tecnologia",
  seoDefaultDescription:
    "Marketing que pensa. Tecnologia que executa. Sites, sistemas, automações e marketing sob medida. Peça seu diagnóstico gratuito.",
  cookieBannerEnabled: true,
  exitPopupEnabled: false,
};

export type SiteSettings = typeof settingsDefaults;

/** Slots de mídia nomeados que o painel pode preencher. */
export const MEDIA_SLOTS = {
  "founders.together": "Foto dos sócios juntos (hero e Sobre)",
  "founders.haylla": "Foto de Haylla Vitória",
  "founders.icaro": "Foto de Ícaro",
  "og.default": "Imagem Open Graph padrão (1200×630)",
  "checklist.pdf": "Checklist “10 sinais de que sua empresa tem um gargalo” (PDF)",
  "services.sites": "Capa do serviço Sites",
  "services.sistemas": "Capa do serviço Sistemas",
  "services.automacoes": "Capa do serviço Automações e IA",
  "services.marketing": "Capa do serviço Marketing e conteúdo",
  "institutional.1": "Imagem institucional 1",
  "institutional.2": "Imagem institucional 2",
} as const;
export type MediaSlotKey = keyof typeof MEDIA_SLOTS;

export const MEDIA_CATEGORIES = [
  "fundadores",
  "projetos",
  "servicos",
  "institucional",
  "blog",
  "og",
  "arquivos",
  "geral",
] as const;
