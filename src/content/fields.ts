import { z } from "zod";

/**
 * Deriva, a partir dos valores padrão de cada página, a árvore de campos usada pelo
 * editor de conteúdo do painel e o schema Zod que valida o que é salvo.
 * Assim, todo texto oficial é editável sem precisar descrever o formulário à mão.
 */
export type FieldNode =
  | { kind: "text" | "textarea" | "markdown" | "url"; label: string; readonly?: boolean }
  | { kind: "boolean"; label: string }
  | { kind: "number"; label: string }
  | { kind: "list"; label: string; item: FieldNode; template: unknown }
  | { kind: "group"; label: string; fields: Record<string, FieldNode> };

const LABELS: Record<string, string> = {
  title: "Título",
  subtitle: "Subtítulo",
  body: "Texto",
  extra: "Parágrafo adicional",
  cta: "Botão",
  primaryCta: "Botão principal",
  secondaryCta: "Botão secundário",
  primary: "Botão principal",
  secondary: "Botão secundário",
  button: "Botão",
  support: "Linha de apoio",
  supportCta: "Link de apoio",
  badge: "Selo",
  highlight: "Palavra em destaque (vermelho)",
  items: "Itens",
  closing: "Fechamento",
  keywords: "Palavras-chave destacadas",
  steps: "Etapas",
  letter: "Letra",
  name: "Nome",
  role: "Função",
  people: "Pessoas",
  deliverable: "O que você recebe",
  deliverableLabel: "Rótulo da entrega",
  tags: "Tags",
  href: "Link (rota)",
  slug: "Identificador",
  slot: "Slot de imagem",
  q: "Pergunta",
  a: "Resposta",
  faq: "Perguntas frequentes",
  faqTitle: "Título das perguntas",
  problem: "O problema",
  problemTitle: "Título do problema",
  deliverables: "Entregas",
  deliverTitle: "Título das entregas",
  types: "Tipos de projeto / abordagem",
  typesTitle: "Título da abordagem",
  why: "Por que importa",
  whyTitle: "Título do porquê",
  pains: "Dores",
  painsTitle: "Título das dores",
  solutions: "Soluções",
  solutionsTitle: "Título das soluções",
  care: "Bloco de cuidado",
  careTitle: "Título do cuidado",
  project: "Bloco Projeto HAIK",
  projectTitle: "Título do Projeto HAIK",
  projectCta: "Botão do Projeto HAIK",
  opening: "Abertura",
  founders: "Fundadores",
  achievement: "Conquista ou número real (opcional)",
  together: "Bloco Por que juntos",
  values: "Valores",
  valuesTitle: "Título dos valores",
  where: "Onde atendemos",
  whereTitle: "Título de onde atendemos",
  whereCity: "Frase sobre a cidade",
  hero: "Primeira dobra",
  about: "O que a HAIK é",
  services: "Serviços",
  method: "Método CLARO",
  flag: "Bandeira da marca",
  segments: "Para quem trabalhamos",
  proof: "Prova",
  finalCta: "Chamada final",
  photoCaption: "Legenda da foto",
  testimonialsTitle: "Título dos depoimentos",
  form: "Formulário",
  how: "Como funciona",
  howTitle: "Título do como funciona",
  not: "O que não é",
  notTitle: "Título do que não é",
  for: "Para quem é",
  forTitle: "Título do para quem é",
  summaries: "Resumos",
  whatsappCta: "Chamada do WhatsApp",
  cards: "Cartões",
  integrated: "Projetos integrados",
  categories: "Categorias",
  readCta: "Botão de leitura",
  emptyTitle: "Título quando vazio",
  emptyBody: "Texto quando vazio",
  emptyCta: "Botão quando vazio",
  articleBox: "Caixa no fim do artigo",
  capture: "Caixa de captura",
  placeholder: "Placeholder",
  success: "Mensagem de sucesso",
  successTitle: "Título de sucesso",
  successBody: "Texto de sucesso",
  error: "Mensagem de erro",
  errors: "Mensagens de erro",
  subjects: "Assuntos",
  message: "Mensagem",
  messagePlaceholder: "Ajuda do campo mensagem",
  consent: "Texto de consentimento",
  submit: "Botão de envio",
  afterSubmit: "Linha abaixo do botão",
  hoursTitle: "Título do horário",
  hoursTemplate: "Modelo do horário ({HORARIO})",
  hoursFallback: "Horário quando não informado",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  diagnostic: "Diagnóstico",
  email: "E-mail",
  company: "Empresa",
  segment: "Segmento",
  instagramOrSite: "Instagram ou site",
  companyAge: "Tempo de empresa",
  teamSize: "Tamanho da equipe",
  mainProblem: "Maior problema",
  problemDetails: "Campo aberto",
  monthlyInvestment: "Investimento mensal",
  timeline: "Prazo",
  bestPeriod: "Melhor período",
  demoBadge: "Selo de projeto demonstrativo",
  labels: "Rótulos",
  scenario: "O cenário",
  bottleneck: "O gargalo",
  solution: "A solução",
  result: "Resultado",
  follow: "Acompanhe",
  followBody: "Texto do acompanhe",
  viewCta: "Botão ver projeto",
  tagline: "Assinatura",
  description: "Descrição",
  navTitle: "Título da navegação",
  servicesTitle: "Título dos serviços",
  contactTitle: "Título do contato",
  diagnosticTitle: "Título do diagnóstico",
  diagnosticBody: "Texto do diagnóstico",
  diagnosticCta: "Botão do diagnóstico",
  privacy: "Política de Privacidade",
  terms: "Termos de Uso",
  home: "Início",
  updatedAt: "Data da última revisão (AAAA-MM-DD)",
  reviewNotice: "Aviso de revisão jurídica",
  checklistPending: "Texto quando o checklist não está disponível",
  footer: "Rodapé",
  footerCta: "Botão do rodapé",
  whatsappTooltip: "Tooltip do WhatsApp",
  mobileBar: "Barra fixa do celular",
  cookie: "Aviso de cookies",
  accept: "Aceitar",
  decline: "Recusar",
  more: "Saber mais",
  required: "Campo obrigatório",
  generic: "Erro genérico",
  rateLimited: "Limite de envios",
  duplicate: "Envio duplicado",
  sending: "Enviando",
  exitPopup: "Pop-up de saída",
};

const READONLY_KEYS = new Set(["slug", "slot", "href"]);
const MARKDOWN_PATHS = [/^legal\.(privacy|terms)\.body$/];

export function labelFor(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const spaced = key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function deriveFields(value: unknown, path = "", key = ""): FieldNode {
  const label = labelFor(key);
  if (typeof value === "string") {
    if (MARKDOWN_PATHS.some((re) => re.test(path))) return { kind: "markdown", label };
    if (key === "href" || /^https?:\/\//.test(value)) return { kind: "url", label, readonly: READONLY_KEYS.has(key) };
    const kind = value.length > 90 || value.includes("\n") ? "textarea" : "text";
    return { kind, label, readonly: READONLY_KEYS.has(key) };
  }
  if (typeof value === "boolean") return { kind: "boolean", label };
  if (typeof value === "number") return { kind: "number", label };
  if (Array.isArray(value)) {
    const first = value[0] ?? "";
    return { kind: "list", label, item: deriveFields(first, `${path}[]`, key), template: blankOf(first) };
  }
  if (value && typeof value === "object") {
    const fields: Record<string, FieldNode> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      fields[k] = deriveFields(v, path ? `${path}.${k}` : k, k);
    }
    return { kind: "group", label, fields };
  }
  return { kind: "text", label };
}

/** Item em branco com a mesma forma do primeiro elemento (para "adicionar item"). */
export function blankOf(sample: unknown): unknown {
  if (typeof sample === "string") return "";
  if (typeof sample === "number") return 0;
  if (typeof sample === "boolean") return false;
  if (Array.isArray(sample)) return [];
  if (sample && typeof sample === "object") {
    return Object.fromEntries(Object.entries(sample as Record<string, unknown>).map(([k, v]) => [k, blankOf(v)]));
  }
  return "";
}

/** Schema Zod com a mesma forma dos valores padrão (listas podem variar de tamanho). */
export function schemaOf(value: unknown): z.ZodTypeAny {
  if (typeof value === "string") return z.string().max(20000);
  if (typeof value === "boolean") return z.boolean();
  if (typeof value === "number") return z.number();
  if (Array.isArray(value)) return z.array(schemaOf(value[0] ?? "")).max(200);
  if (value && typeof value === "object") {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) shape[k] = schemaOf(v);
    return z.object(shape);
  }
  return z.unknown();
}

/** Mescla overrides parciais sobre os padrões, respeitando a forma dos padrões. */
export function mergeContent<T>(defaults: T, override: unknown): T {
  if (override === undefined || override === null) return defaults;
  if (Array.isArray(defaults)) {
    return (Array.isArray(override) ? override : defaults) as T;
  }
  if (defaults && typeof defaults === "object") {
    if (!override || typeof override !== "object" || Array.isArray(override)) return defaults;
    const out: Record<string, unknown> = {};
    const o = override as Record<string, unknown>;
    for (const [k, v] of Object.entries(defaults as Record<string, unknown>)) {
      out[k] = k in o ? mergeContent(v, o[k]) : v;
    }
    return out as T;
  }
  return typeof override === typeof defaults ? (override as T) : defaults;
}
