export const SEGMENT_OPTIONS = [
  "Clínica ou consultório",
  "Odontologia",
  "Arquitetura",
  "Contabilidade",
  "Imobiliária",
  "Outro",
] as const;
export const COMPANY_AGE_OPTIONS = ["Menos de 1 ano", "1 a 3 anos", "3 a 5 anos", "Mais de 5 anos"] as const;
export const TEAM_SIZE_OPTIONS = ["Só eu", "2 a 5", "6 a 15", "Mais de 15"] as const;
export const MAIN_PROBLEM_OPTIONS = [
  "Poucos clientes chegando",
  "Muito tempo perdido com tarefas manuais",
  "Atendimento desorganizado",
  "Site ou Instagram que não vendem",
  "Outro",
] as const;
export const INVESTMENT_OPTIONS = ["Ainda nada", "Até R$ 500", "R$ 500 a R$ 2.000", "Acima de R$ 2.000"] as const;
export const TIMELINE_OPTIONS = ["O quanto antes", "Nos próximos 3 meses", "Ainda estou pesquisando"] as const;
export const PERIOD_OPTIONS = ["Manhã", "Tarde", "Noite"] as const;

export const diagnosticContent = {
  title: "Descubra o que está travando o seu negócio",
  subtitle:
    "Diagnóstico gratuito de 30 minutos, online. Analisamos sua rotina, seu digital e suas metas e apontamos o gargalo principal, com uma direção clara para resolver.",
  form: {
    name: "Seu nome",
    company: "Nome da empresa",
    segment: "Segmento",
    instagramOrSite: "@ do Instagram ou site da empresa",
    whatsapp: "WhatsApp",
    email: "E-mail",
    companyAge: "Há quanto tempo a empresa existe?",
    teamSize: "Quantas pessoas trabalham com você?",
    mainProblem: "Qual é hoje o maior problema do negócio?",
    problemDetails: "Conte em poucas palavras",
    monthlyInvestment: "Quanto você investe hoje em marketing ou tecnologia por mês?",
    timeline: "Para quando você precisa de uma solução?",
    bestPeriod: "Melhor período para a conversa",
    consent: "Concordo em receber contato da HAIK e com a Política de Privacidade.",
    submit: "Quero meu diagnóstico",
    afterSubmit: "Respondemos em até 2 horas no horário comercial.",
  },
  howTitle: "Como funciona",
  how: [
    "Você preenche o formulário em 2 minutos.",
    "Entramos em contato pelo WhatsApp para marcar o melhor horário.",
    "Conversamos por 30 minutos, online, sobre o seu negócio.",
    "Você recebe o gargalo identificado e a nossa recomendação.",
  ],
  notTitle: "O que o diagnóstico não é",
  not: "Não é uma reunião de venda disfarçada. Se a melhor solução para o seu caso não for com a gente, você vai ouvir isso de nós.",
  forTitle: "Para quem é",
  for: "Donos de negócio que já entenderam que precisam do digital, mas estão travados por falta de tempo, de organização ou de um marketing que traga cliente.",
  summaries: {
    services: {
      title: "O que fazemos",
      body: "Sites, sistemas, automações com IA e marketing estratégico, pensados juntos para o seu negócio crescer com clareza.",
      cta: "Ver serviços",
    },
    method: {
      title: "Método CLARO",
      body: "Clareza, Leitura, Arquitetura, Realização e Operação. Um método que começa pelo problema, não pela ferramenta.",
      cta: "Conhecer o método",
    },
    about: {
      title: "Quem está por trás",
      body: "Uma publicitária e um engenheiro de software unindo marketing e tecnologia para destravar negócios em todo o Brasil.",
      cta: "Sobre a HAIK",
    },
  },
  whatsappCta: "Prefere falar agora? Chame no WhatsApp",
};
export type DiagnosticContent = typeof diagnosticContent;

export const thanksContent = {
  title: "Recebemos! Agora é com a gente.",
  body:
    "Em até 2 horas no horário comercial, você recebe uma mensagem nossa no WhatsApp para marcar o diagnóstico. Enquanto isso, preparamos um presente: o checklist com 10 sinais de que a sua empresa tem um gargalo.",
  cta: "Baixar o checklist",
  checklistPending: "O checklist está em preparação e será disponibilizado aqui em breve.",
  footer: "Quer adiantar a conversa?",
  footerCta: "Chame no WhatsApp",
  follow: "Siga @haiknegocios para ver o Projeto HAIK ao vivo.",
};

export const faqContent = {
  title: "Dúvidas que a gente sempre ouve",
  items: [
    {
      q: "O diagnóstico é gratuito mesmo?",
      a: "Sim. São 30 minutos online, sem custo e sem compromisso. Você sai com o gargalo identificado, mesmo que não feche com a gente.",
    },
    {
      q: "Quanto custa um projeto?",
      a: "Cada projeto é desenhado para o seu negócio, então o valor depende do escopo. Você recebe a proposta com preço, prazo e metas em até 48 horas depois da reunião de diagnóstico.",
    },
    {
      q: "Vocês atendem fora de Teresina?",
      a: "Sim. Todo o nosso atendimento é online, para negócios de qualquer cidade do Brasil.",
    },
    {
      q: "Preciso contratar tudo de uma vez?",
      a: "Não. Você pode começar por um serviço e expandir depois. O diagnóstico ajuda a definir por onde começar.",
    },
    {
      q: "Por que não faço isso sozinho com IA?",
      a: "Você pode usar IA, e nós também usamos. A diferença está em saber o que pedir, revisar o que ela entrega e conectar tudo a uma estratégia. É aí que entra a HAIK.",
    },
    {
      q: "Como acompanho o andamento do projeto?",
      a: "Pelo Método CLARO, você aprova cada etapa da Realização e recebe atualizações combinadas desde o início.",
    },
    {
      q: "E depois da entrega?",
      a: "Entregamos em reunião, explicamos o funcionamento e acompanhamos os primeiros resultados. Suporte contínuo pode ser contratado à parte.",
    },
    {
      q: "Vocês trabalham com qualquer segmento?",
      a: "Temos foco em saúde e arquitetura, mas o diagnóstico funciona para qualquer negócio que já entendeu que precisa do digital.",
    },
  ],
};
