/**
 * Checklist "10 sinais de que sua empresa tem um gargalo" (isca do diagnóstico).
 * Todas as frases vêm dos textos oficiais do site (dores da Home, Saúde e Arquitetura);
 * nenhuma foi inventada. O PDF em /public é gerado a partir daqui por `npm run checklist:build`.
 */
export const CHECKLIST = {
  title: "10 sinais de que sua empresa tem um gargalo",
  intro:
    "Marque os sinais que você reconhece. Nenhum deles se resolve com mais uma ferramenta. Eles se resolvem quando alguém olha para o negócio inteiro e encontra o gargalo certo.",
  items: [
    { sign: "Meu WhatsApp não para, mas a agenda continua com buracos.", area: "Automações e IA" },
    { sign: "Gasto mais tempo montando orçamento do que atendendo cliente.", area: "Sistemas" },
    { sign: "Tenho Instagram, mas ele não traz ninguém.", area: "Marketing e conteúdo" },
    { sign: "Meu site existe, só que ninguém chega por ele.", area: "Sites" },
    { sign: "Testei IA, ficou tudo com cara de genérico.", area: "Marketing e conteúdo" },
    { sign: "Cresci, e os processos ficaram para trás.", area: "Sistemas" },
    { sign: "As faltas deixam buracos na agenda que ninguém consegue preencher a tempo.", area: "Automações e IA" },
    { sign: "Briefings que chegam incompletos e viram retrabalho.", area: "Sistemas" },
    { sign: "Acompanhamento de obras e etapas espalhado em mensagens e planilhas.", area: "Sistemas" },
    { sign: "Clientes que chegam comparando só preço.", area: "Marketing e conteúdo" },
  ],
  closing:
    "Em 30 minutos de conversa online, analisamos sua rotina, seu digital e seus números e apontamos o principal ponto que está travando o seu crescimento. Você sai da reunião com clareza, mesmo que decida não seguir com a gente.",
  cta: "Quero meu diagnóstico gratuito",
} as const;

/** Arquivo padrão servido quando nenhum PDF foi enviado pelo painel (slot checklist.pdf). */
export const DEFAULT_CHECKLIST_FILE = {
  url: "/checklist-10-sinais-de-gargalo.pdf",
  filename: "checklist-10-sinais-de-gargalo-haik.pdf",
} as const;
