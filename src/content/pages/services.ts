/** Páginas de serviço: visão geral + 4 páginas com a mesma estrutura. */
export const servicesOverviewContent = {
  title: "Marketing e tecnologia, pensados juntos desde o primeiro dia",
  subtitle:
    "Você pode contratar um serviço isolado ou uma solução completa. Em qualquer caso, começamos entendendo o problema antes de propor a ferramenta.",
  cards: [
    {
      slug: "sites",
      title: "Sites",
      body:
        "Para quem tem um site que não traz cliente, ou ainda não tem nenhum. Criamos sites institucionais e páginas de venda rápidas, seguras e escritas para converter.",
      extra:
        "Estrutura e textos nascem do que o seu cliente procura, com versão para celular tratada como prioridade, SEO básico configurado e medição de cada contato que chega.",
      cta: "Ver sites",
    },
    {
      slug: "sistemas",
      title: "Sistemas",
      body:
        "Para quem controla agenda, pacientes, projetos ou orçamentos em planilha e papel. Desenvolvemos sistemas sob medida que organizam a operação e liberam o seu tempo.",
      extra:
        "Antes de programar, mapeamos a rotina real da equipe. O sistema elimina passos em vez de criar novos, com controle de acesso e proteção de dados desde o início.",
      cta: "Ver sistemas",
    },
    {
      slug: "automacoes-e-ia",
      title: "Automações e IA",
      body:
        "Para quem responde as mesmas mensagens o dia inteiro. Automatizamos confirmações, respostas, lembretes e rotinas no WhatsApp, no Instagram e nas suas ferramentas.",
      extra:
        "Definimos com você o que a máquina responde e o que continua humano. A automação é escrita no tom do seu negócio e sempre deixa um caminho para falar com uma pessoa.",
      cta: "Ver automações",
    },
    {
      slug: "marketing",
      title: "Marketing e conteúdo",
      body:
        "Para quem posta, mas não vende. Planejamos estratégia, identidade, conteúdo e anúncios com um objetivo claro: transformar atenção em cliente.",
      extra:
        "Cada post tem uma função no caminho que transforma seguidor em cliente, e cada relatório fala de vendas, não só de curtidas.",
      cta: "Ver marketing",
    },
  ],
  integrated: {
    title: "Projetos integrados",
    body:
      "Muitos negócios precisam de mais de uma frente ao mesmo tempo. Uma clínica, por exemplo, pode precisar de um site que agenda, de uma automação que confirma consultas e de um Instagram que atrai o paciente certo. Quando o projeto é integrado, cada parte foi pensada para conversar com a outra, e você fala com uma única equipe.",
  },
  cta: {
    body: "Não sabe por onde começar? É exatamente para isso que existe o diagnóstico.",
    button: "Quero meu diagnóstico gratuito",
  },
};

export type ServicePageContent = {
  slug: string;
  title: string;
  subtitle: string;
  problemTitle: string;
  problem: string;
  deliverTitle: string;
  deliverables: string[];
  typesTitle: string;
  types: string;
  whyTitle: string;
  why: string;
  cta: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
};

export const serviceSitesContent: ServicePageContent = {
  slug: "sites",
  title: "Um site que trabalha enquanto você atende",
  subtitle: "Sites institucionais e páginas de venda rápidas, seguras e escritas para transformar visita em contato.",
  problemTitle: "O problema",
  problem:
    "Muitos sites existem só para constar. Demoram para abrir, não aparecem no Google, não explicam o que a empresa faz e escondem o botão de contato. O visitante sai sem deixar rastro, e o dono do negócio conclui que site não funciona.",
  deliverTitle: "O que entregamos",
  deliverables: [
    "Estrutura e textos pensados a partir do que o seu cliente procura",
    "Design próprio, alinhado à sua identidade visual",
    "Versão para celular tratada como prioridade, não como adaptação",
    "Formulários, botão de WhatsApp e integração com agenda ou sistema",
    "Configuração básica de SEO para aparecer nas buscas da sua região",
    "Código revisado, hospedagem configurada e certificado de segurança",
    "Medição de acessos e cliques, para saber de onde vem cada contato",
  ],
  typesTitle: "Tipos de projeto",
  types:
    "Site institucional, página de captura ou de venda, site com agendamento online, portfólio para arquitetos e profissionais criativos.",
  whyTitle: "Por que isso importa",
  why:
    "Um site feito só com IA ou com modelo pronto pode até parecer bonito, mas costuma falhar onde ninguém vê: segurança, velocidade e texto que convence. Nós revisamos cada linha.",
  cta: "Quero um site que venda",
  faqTitle: "Perguntas frequentes",
  faq: [
    {
      q: "Quanto tempo leva?",
      a: "Depende do tamanho do projeto. O prazo exato fica definido na etapa de Arquitetura, antes de qualquer pagamento.",
    },
    {
      q: "Eu consigo editar depois?",
      a: "Sim. Entregamos o site com orientação de uso e, se você preferir, cuidamos das atualizações.",
    },
    { q: "Vocês escrevem os textos?", a: "Sim. Texto faz parte do projeto, porque é ele que convence o visitante." },
    {
      q: "Já tenho domínio e hospedagem.",
      a: "Sem problema, aproveitamos o que você já tem quando fizer sentido.",
    },
  ],
};

export const serviceSystemsContent: ServicePageContent = {
  slug: "sistemas",
  title: "Sua operação fora da planilha",
  subtitle:
    "Sistemas sob medida para organizar agenda, clientes, projetos e orçamentos, do jeito que o seu negócio funciona.",
  problemTitle: "O problema",
  problem:
    "Quando a empresa cresce, a planilha que funcionava vira um risco. Informação espalhada em vários lugares, retrabalho, dados de clientes sem proteção e uma equipe que perde horas procurando o que deveria estar a um clique.",
  deliverTitle: "O que desenvolvemos",
  deliverables: [
    "Sistemas de agendamento com confirmação e lembrete",
    "Cadastro de clientes e pacientes com histórico organizado",
    "Painéis internos para acompanhar projetos, etapas e prazos",
    "Geradores de orçamento e proposta",
    "CRM simples para acompanhar leads e vendas",
    "Integrações entre as ferramentas que você já usa",
  ],
  typesTitle: "Como pensamos um sistema",
  types:
    "Antes de programar, mapeamos a rotina real da sua equipe. Um sistema bom não obriga ninguém a mudar o jeito de trabalhar para caber na ferramenta. Ele elimina passos, não cria novos.",
  whyTitle: "Segurança e LGPD",
  why:
    "Dados de clientes e pacientes exigem cuidado. Todo sistema é desenvolvido com controle de acesso, cópias de segurança e boas práticas de proteção de dados.",
  cta: "Quero organizar minha operação",
  faqTitle: "Perguntas frequentes",
  faq: [
    { q: "Preciso trocar tudo o que já uso?", a: "Não. Muitas vezes o melhor caminho é integrar o que já existe." },
    {
      q: "Minha equipe vai saber usar?",
      a: "Entregamos em reunião, com treinamento e acompanhamento depois da entrega.",
    },
    {
      q: "E se eu precisar de ajustes depois?",
      a: "Ajustes e novas funções podem ser contratados por demanda ou em plano de acompanhamento.",
    },
  ],
};

export const serviceAutomationContent: ServicePageContent = {
  slug: "automacoes-e-ia",
  title: "Pare de fazer à mão o que pode acontecer sozinho",
  subtitle:
    "Automações para WhatsApp, Instagram e rotinas internas, com inteligência artificial usada onde ela realmente ajuda.",
  problemTitle: "O problema",
  problem:
    "Confirmar consulta, responder a mesma dúvida pela décima vez, copiar dados de um lugar para outro, mandar lembrete. São tarefas pequenas que, somadas, ocupam horas do dia e ainda dependem de alguém lembrar de fazer.",
  deliverTitle: "O que automatizamos",
  deliverables: [
    "Confirmação e lembrete de consultas e reuniões",
    "Respostas automáticas no Instagram por palavra-chave",
    "Atendimento inicial no WhatsApp, com triagem e encaminhamento",
    "Envio automático de materiais, propostas e documentos",
    "Integração entre formulários, planilhas, CRM e agenda",
    "Assistentes com IA treinados com as informações do seu negócio",
  ],
  typesTitle: "Nossa posição sobre IA",
  types:
    "Inteligência artificial não substitui o seu atendimento, ela libera a sua equipe para o atendimento que importa. Por isso, definimos com você o que a máquina responde e o que continua sendo humano.",
  whyTitle: "",
  why: "",
  cta: "Quero automatizar",
  faqTitle: "Perguntas frequentes",
  faq: [
    {
      q: "O cliente vai perceber que é robô?",
      a: "A automação é escrita no tom do seu negócio e sempre deixa um caminho para falar com uma pessoa.",
    },
    { q: "Funciona no WhatsApp que eu já uso?", a: "Na maioria dos casos, sim. Avaliamos isso no diagnóstico." },
    {
      q: "É seguro?",
      a: "Usamos integrações oficiais sempre que possível e configuramos tudo para proteger os dados dos seus clientes.",
    },
  ],
};

export const serviceMarketingContent: ServicePageContent = {
  slug: "marketing",
  title: "Marketing que não termina no like",
  subtitle:
    "Estratégia, identidade visual, conteúdo e anúncios com um objetivo claro: transformar atenção em cliente.",
  problemTitle: "O problema",
  problem:
    "Postar todo dia não é estratégia. Sem posicionamento, sem funil e sem saber quem você quer atrair, o perfil cresce em seguidores que nunca compram, e o conteúdo vira obrigação em vez de canal de venda.",
  deliverTitle: "O que fazemos",
  deliverables: [
    "Estratégia de posicionamento e de conteúdo",
    "Identidade visual e verbal da marca",
    "Planejamento, roteiros e criação de posts, carrosséis e Reels",
    "Gestão de redes sociais",
    "Gestão de anúncios no Meta Ads",
    "Pesquisa de mercado e de concorrência",
    "Relatórios quinzenais com o que trouxe resultado e o que ajustar",
  ],
  typesTitle: "Nosso jeito",
  types:
    "Conteúdo bom ensina, gera confiança e leva a uma ação. Cada post tem uma função no caminho que transforma seguidor em cliente, e cada relatório fala de vendas, não só de curtidas.",
  whyTitle: "",
  why: "",
  cta: "Quero uma estratégia",
  faqTitle: "Perguntas frequentes",
  faq: [
    {
      q: "Vocês usam IA para criar conteúdo?",
      a: "Usamos IA como apoio, nunca como autora. Estratégia, texto final e direção visual passam sempre por nós.",
    },
    {
      q: "Preciso aparecer nos vídeos?",
      a: "Não é obrigatório, mas rosto gera confiança. Encontramos juntos o formato em que você se sente confortável.",
    },
    {
      q: "Em quanto tempo vejo resultado?",
      a: "Depende do ponto de partida e do investimento. Combinamos metas realistas na etapa de Arquitetura, sem promessas que não podemos garantir.",
    },
  ],
};

export const SERVICE_PAGES = {
  sites: serviceSitesContent,
  sistemas: serviceSystemsContent,
  "automacoes-e-ia": serviceAutomationContent,
  marketing: serviceMarketingContent,
} as const;
export type ServiceSlug = keyof typeof SERVICE_PAGES;
