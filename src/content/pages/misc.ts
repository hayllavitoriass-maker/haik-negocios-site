export const projectsContent = {
  title: "Projetos que mostram o processo, não só o resultado",
  subtitle: "Cada projeto aqui conta qual era o gargalo, o que decidimos e o que foi entregue.",
  demoBadge: "Projeto demonstrativo",
  labels: {
    scenario: "O cenário",
    bottleneck: "O gargalo",
    solution: "A solução",
    result: "Resultado",
    follow: "Acompanhe",
    services: "Serviços",
  },
  followBody: "cada etapa é publicada em episódios no @haiknegocios.",
  emptyBody: "Nossos primeiros projetos com clientes estão em produção. Quer que o seu seja um deles?",
  emptyCta: "Quero meu diagnóstico gratuito",
  viewCta: "Ver projeto",
};

/** Projeto demonstrativo oficial (Derme Viva). Inserido no banco na primeira execução. */
export const demoProjectSeed = {
  slug: "projeto-haik-derme-viva",
  title: "Projeto HAIK: Clínica Derme Viva",
  client: "Derme Viva (clínica fictícia)",
  segment: "Saúde",
  summary:
    "O digital completo de uma clínica de dermatologia fictícia, construído em público, do diagnóstico à entrega.",
  scenario: "Uma clínica de dermatologia fictícia, com agenda dependente do WhatsApp e presença digital fraca.",
  bottleneck: "Pacientes perdidos entre a primeira mensagem e o agendamento.",
  solution: "Site com agendamento online, confirmação automática e estratégia de Instagram.",
  result: "",
  services: ["Sites", "Sistemas", "Automações e IA", "Marketing e conteúdo"],
  isDemo: true,
};

export const contentsContent = {
  title: "Conteúdos para quem quer crescer com clareza",
  subtitle:
    "Artigos curtos sobre gargalos de negócio, tecnologia na prática e IA com estratégia, no mesmo tom do nosso Instagram.",
  categories: ["Gargalos do negócio", "IA com estratégia", "Tecnologia na prática", "Saúde", "Arquitetura"],
  readCta: "Ler artigo",
  emptyTitle: "Os primeiros artigos estão sendo escritos",
  emptyBody:
    "Em breve: site feito só com IA, sinais de que seus processos ficaram para trás, automações que confirmam consultas e o que vale delegar para a IA.",
  articleBox: {
    body: "Identificou um gargalo no seu negócio enquanto lia? A gente te ajuda a resolver.",
    cta: "Quero meu diagnóstico gratuito",
  },
  capture: {
    title: "Receba grátis o checklist",
    body: "“10 sinais de que sua empresa tem um gargalo”",
    placeholder: "Seu melhor e-mail",
    cta: "Quero o checklist",
    success: "Pronto! Você receberá o checklist assim que ele estiver disponível.",
  },
};

export const contactContent = {
  title: "Vamos conversar sobre o seu negócio",
  subtitle:
    "Escolha o caminho mais confortável para você. Quem responde somos nós, os sócios, e não um robô sem contexto.",
  cards: {
    whatsapp: { title: "WhatsApp", cta: "Chamar no WhatsApp" },
    instagram: {
      title: "Instagram",
      cta: "Seguir no Instagram",
      support: "Bastidores, Projeto HAIK e a série Qual é o gargalo?",
    },
    diagnostic: {
      title: "Diagnóstico gratuito",
      body: "Já sabe que quer resolver? Vá direto ao diagnóstico.",
      cta: "Quero meu diagnóstico",
    },
  },
  form: {
    title: "Prefere escrever? Mande sua mensagem.",
    name: "Nome",
    whatsapp: "WhatsApp",
    email: "E-mail",
    company: "Empresa ou profissão",
    subject: "Assunto",
    subjects: ["Quero um orçamento", "Tenho uma dúvida", "Parceria", "Outro assunto"],
    message: "Mensagem",
    messagePlaceholder: "Conte um pouco sobre o seu negócio e como podemos ajudar.",
    consent: "Li e concordo com a Política de Privacidade.",
    submit: "Enviar mensagem",
    successTitle: "Mensagem enviada!",
    successBody: "Respondemos em até 2 horas no horário comercial, pelo WhatsApp ou e-mail que você informou.",
    error: "Não conseguimos enviar agora. Tente de novo ou fale direto com a gente pelo WhatsApp.",
  },
  hoursTitle: "Horário de atendimento",
  hoursTemplate: "Segunda a sexta, das {HORARIO}. Atendimento 100% online para todo o Brasil.",
  hoursFallback: "Segunda a sexta, em horário comercial. Atendimento 100% online para todo o Brasil.",
};

export const microcopy = {
  whatsappTooltip: "Fale com a gente",
  mobileBar: "Diagnóstico gratuito",
  cookie: {
    body: "Usamos cookies para entender como o site é usado e melhorar sua experiência.",
    accept: "Aceitar",
    decline: "Só o essencial",
    more: "Saber mais",
  },
  errors: {
    required: "Esse campo é importante para a gente te atender bem.",
    whatsapp: "Confere o número? Use DDD + número, só com dígitos.",
    email: "Parece que faltou algo nesse e-mail.",
    consent: "Precisamos do seu consentimento para entrar em contato.",
    generic: "Não conseguimos enviar agora. Tente de novo ou fale direto com a gente pelo WhatsApp.",
    rateLimited: "Recebemos muitos envios seguidos. Aguarde alguns minutos e tente de novo.",
    duplicate: "Já recebemos o seu pedido. Em breve entramos em contato pelo WhatsApp.",
  },
  sending: "Enviando...",
  exitPopup: {
    body: "Antes de ir: quer o checklist gratuito “10 sinais de que sua empresa tem um gargalo”?",
    accept: "Quero o checklist",
    decline: "Agora não",
  },
};

export const notFoundContent = {
  title: "Encontramos um gargalo. Desta vez, foi no nosso site.",
  body: "A página que você procurou não existe ou mudou de endereço. Mas o caminho para destravar o seu negócio continua aberto.",
  home: "Voltar para o início",
  cta: "Quero meu diagnóstico gratuito",
};

export const footerContent = {
  tagline: "Marketing que pensa. Tecnologia que executa.",
  description:
    "Empresa de marketing e tecnologia para negócios que querem crescer com clareza. Atendimento 100% online para todo o Brasil.",
  navTitle: "Navegação",
  servicesTitle: "Serviços",
  contactTitle: "Fale com a gente",
  diagnosticTitle: "Diagnóstico gratuito",
  diagnosticBody: "Descubra o que está travando o seu negócio.",
  diagnosticCta: "Quero meu diagnóstico",
  privacy: "Política de Privacidade",
  terms: "Termos de Uso",
};
