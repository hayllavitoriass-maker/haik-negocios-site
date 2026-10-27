export type NicheContent = {
  title: string;
  subtitle: string;
  painsTitle: string;
  pains: string[];
  solutionsTitle: string;
  solutions: { title: string; body: string }[];
  careTitle: string;
  care: string;
  projectTitle: string;
  project: string;
  projectCta: string;
  cta: string;
};

export const healthContent: NicheContent = {
  title: "Agenda cheia sem viver no WhatsApp",
  subtitle:
    "Sites, automações e marketing para médicos, dermatologistas e dentistas que querem atender mais e responder menos.",
  painsTitle: "Você reconhece alguma dessas situações?",
  pains: [
    "O paciente manda mensagem, espera horas e marca com outro profissional.",
    "A secretária passa o dia confirmando consulta em vez de cuidar de quem está na recepção.",
    "As faltas deixam buracos na agenda que ninguém consegue preencher a tempo.",
    "O Instagram tem seguidores, mas poucos viram pacientes.",
    "O site não aparece quando alguém procura um especialista na sua cidade.",
  ],
  solutionsTitle: "O que resolvemos",
  solutions: [
    { title: "Agendamento online", body: "integrado ao site e ao Instagram." },
    { title: "Confirmação e lembrete automáticos", body: "pelo WhatsApp, para reduzir faltas." },
    {
      title: "Atendimento inicial automatizado",
      body: "com respostas para dúvidas frequentes e encaminhamento para a equipe.",
    },
    { title: "Site de clínica", body: "pensado para busca local e para transmitir confiança." },
    {
      title: "Conteúdo educativo",
      body: "que gera autoridade dentro das regras de publicidade dos conselhos profissionais.",
    },
  ],
  careTitle: "Comunicação na saúde tem regras",
  care:
    "Todo conteúdo e todo site são pensados para respeitar as normas do seu conselho e a LGPD, com atenção especial aos dados de pacientes.",
  projectTitle: "Quer ver isso na prática?",
  project:
    "Estamos construindo, em público, o digital completo de uma clínica de dermatologia fictícia, a Derme Viva.",
  projectCta: "Acompanhar o projeto",
  cta: "Diagnóstico gratuito para minha clínica",
};

export const architectureContent: NicheContent = {
  title: "Seu portfólio merece mais que um feed",
  subtitle:
    "Sites, sistemas e marketing para escritórios de arquitetura que querem atrair o cliente certo e perder menos tempo com burocracia.",
  painsTitle: "Você reconhece alguma dessas situações?",
  pains: [
    "Horas montando orçamento para clientes que nem respondem.",
    "Projetos lindos escondidos em um Instagram que não mostra o processo nem o valor.",
    "Briefings que chegam incompletos e viram retrabalho.",
    "Acompanhamento de obras e etapas espalhado em mensagens e planilhas.",
    "Clientes que chegam comparando só preço.",
  ],
  solutionsTitle: "O que resolvemos",
  solutions: [
    { title: "Site portfólio", body: "que apresenta os projetos com o peso que eles têm e filtra o tipo de cliente." },
    { title: "Formulário de briefing inteligente", body: "que qualifica antes da primeira reunião." },
    { title: "Gerador de orçamento e proposta", body: "padronizado, em minutos." },
    { title: "Painel de acompanhamento de projetos", body: "para o escritório e para o cliente." },
    { title: "Conteúdo que vende processo", body: "não só foto bonita." },
  ],
  careTitle: "",
  care: "",
  projectTitle: "",
  project: "",
  projectCta: "",
  cta: "Diagnóstico gratuito para meu escritório",
};
