# HAIK Negócios — site e painel administrativo

Site institucional com experiência 3D e scroll storytelling (Next.js 16, React 19, GSAP, Lenis, React Three Fiber) e um CMS privado em `/admin` para leads, textos, mídia, projetos, depoimentos, blog e configurações.

**Marketing que pensa. Tecnologia que executa.**

## Sumário

1. [Rodar localmente](#rodar-localmente)
2. [Primeiro administrador](#primeiro-administrador)
3. [Variáveis de ambiente](#variáveis-de-ambiente)
4. [Arquitetura](#arquitetura)
5. [Conteúdo editável](#conteúdo-editável)
6. [Testes e qualidade](#testes-e-qualidade)
7. [Publicar em produção](#publicar-em-produção)
8. [Segurança e LGPD](#segurança-e-lgpd)
9. [Pendências de conteúdo e revisão](#pendências-de-conteúdo-e-revisão)
10. [Limitações e riscos conhecidos](#limitações-e-riscos-conhecidos)

## Rodar localmente

Requisitos: Node.js 20.9+ (testado com 24) e npm.

```bash
npm install --ignore-scripts
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Abra http://localhost:3000. **Nenhuma credencial é necessária para rodar**: sem `DATABASE_URL`, o projeto usa um Postgres embutido (PGlite) gravado em `./data/pglite`, com migrations aplicadas automaticamente e o Projeto HAIK demonstrativo (Derme Viva) já cadastrado. Uploads do painel vão para `./data/uploads`.

> `--ignore-scripts` evita que scripts de pós-instalação de dependências (ex.: binário do esbuild usado pelo drizzle-kit) sejam executados; tudo funciona sem eles. Se preferir, `npm install` normal também serve na maioria das máquinas.

## Primeiro administrador

O painel não tem cadastro público. Há dois caminhos seguros:

**1. Pelo navegador (recomendado no primeiro deploy)**

Defina `ADMIN_SETUP_TOKEN` com um valor aleatório longo e `APP_SECRET` no `.env.local` (ou no provedor), reinicie o servidor e acesse `/admin/setup`. A página só existe enquanto **não houver nenhum usuário** e exige o token. Depois de criar o primeiro admin, remova `ADMIN_SETUP_TOKEN`.

**2. Pela linha de comando**

```bash
npm run admin:create -- --email voce@exemplo.com --name "Seu nome"
```

Em seguida entre em `/admin/login`. Administradores são obrigados a ativar o segundo fator (aplicativo autenticador, TOTP) no primeiro acesso; guarde os códigos de recuperação. Se perder o acesso ao autenticador:

```bash
npm run admin:reset-mfa -- --email voce@exemplo.com
```

## Variáveis de ambiente

Veja `.env.example` (comentado). Resumo:

| Variável | Obrigatória | Para quê |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | produção | canonical, sitemap, Open Graph, links em e-mails |
| `APP_SECRET` | produção | criptografia do segredo de MFA e anonimização de IPs (≥ 32 caracteres) |
| `DATABASE_URL` | produção | Postgres (Supabase, Neon, RDS...). Vazio = PGlite local |
| `DB_AUTO_MIGRATE` | opcional | `true` aplica migrations ao iniciar (alternativa a `npm run db:migrate`) |
| `ADMIN_SETUP_TOKEN` | só no 1º acesso | habilita `/admin/setup` |
| `STORAGE_DRIVER` | produção | `local` (VPS/Docker) ou `s3` (obrigatório em Vercel/serverless) |
| `S3_*` | se `s3` | S3, Cloudflare R2 ou Supabase Storage (protocolo S3) |
| `SMTP_*`, `NOTIFY_EMAIL` | opcional | aviso de novos leads e recuperação de senha |
| `DATA_RETENTION_DAYS` | opcional | retenção para `npm run data:prune` |

Nenhum segredo é lido no cliente e nenhum é editável pelo painel.

## Arquitetura

```
src/
  app/
    (site)/            páginas públicas (render dinâmico: conteúdo vem do CMS a cada request)
    admin/             painel privado (layout próprio, sem motion/3D)
    api/admin/upload   upload de mídia (multipart, validação real do tipo com sharp)
    media/[...key]     entrega de arquivos enviados (só os registrados no banco)
    sitemap.ts, robots.ts, manifest.ts, opengraph-image.tsx
  proxy.ts             CSP com nonce por request + redirecionamento otimista de /admin
  content/             textos oficiais (padrões), registro de páginas, SEO, capítulos da Home
  components/
    motion/            GSAP + Lenis: cenas sticky, SplitText, Scramble, FocusText, TypeLines,
                       Statement, transição em pixels, capítulos
    three/             cena WebGL (React Three Fiber): tiles 3D, ícones, formações, câmera,
                       fallback CSS sem WebGL
    home/              os 10 capítulos da Home
    sections/, forms/  páginas internas e formulários públicos
    layout/            header, menu mobile, rodapé, UI fixa, consentimento de cookies
    ui/                primitivos (botão, campos, rótulos, ícones, FAQ, logo)
    admin/             componentes do painel
  server/
    db/                schema Drizzle, cliente (Postgres ou PGlite), migrations, seed
    auth/              senhas (scrypt), sessões, TOTP, rate limit, auditoria, guardas
    actions/           server actions (formulários públicos e painel)
    repos/             consultas
    media/             storage (local ou S3) e URLs
    content.ts         leitura do conteúdo (padrões + overrides publicados, preview de rascunhos)
drizzle/               migrations SQL versionadas
scripts/               migrate, create-admin, reset-mfa, prune-data, export-leads
tests/                 unit, integration (PGlite em memória) e e2e (Playwright)
```

Decisões relevantes:

- **Render dinâmico** (`cacheComponents: false`, `force-dynamic`): a Content-Security-Policy usa nonce por request e o conteúdo publicado no painel aparece sem rebuild.
- **Banco**: Drizzle ORM com SQL parametrizado. O mesmo schema roda em PGlite (dev/testes) e Postgres (produção).
- **Autenticação própria** com sessões opacas (token só no cookie `httpOnly`, hash no banco), MFA TOTP obrigatória para administradores, códigos de recuperação, rate limit persistido no banco e log de auditoria.
- **Cena 3D persistente** entre páginas, lendo um store mínimo (`stage-store.ts`). Formação, tema e progresso são definidos pelos capítulos da Home e por `PageStage` nas páginas internas. Sem WebGL, reduced motion ou erro: fallback em CSS.
- **Modo sem animações**: `prefers-reduced-motion` ou o botão "Versão sem animações" transformam as cenas sticky em fluxo normal (todo o conteúdo acessível e focável).

## Conteúdo editável

Os textos oficiais vivem em `src/content/pages/*.ts`. O painel (`/admin/conteudo`) gera o formulário automaticamente a partir dessa estrutura e grava **rascunho** e **publicado** em `content_entries`, com histórico em `content_versions`. O site mescla padrões + publicado; se o banco falhar, usa os padrões (o site nunca fica sem texto).

Fotos dos fundadores, imagem Open Graph, checklist em PDF e capas ficam em **slots de mídia** (`/admin/midia/slots`). Projetos, depoimentos e artigos têm cadastro próprio. Depoimentos só aparecem no site quando publicados **e** com autorização marcada; resultados de projetos só devem ser preenchidos com dados reais.

## Testes e qualidade

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm run test
```

```bash
npm run build
```

```bash
npm run test:e2e
```

- `test`: Vitest (validação, conteúdo, criptografia/TOTP e integração com banco PGlite em memória: gravação de leads, duplicidade, honeypot, rate limit).
- `test:e2e`: Playwright contra `next start` com banco isolado em `./data/e2e` (rode `npm run build` antes).

## Publicar em produção

### Vercel + Postgres + S3 (recomendado)

1. Crie um Postgres (Supabase, Neon...) e copie a `DATABASE_URL`.
2. Crie um bucket S3-compatível (Supabase Storage com credenciais S3, Cloudflare R2 ou AWS S3) e preencha `STORAGE_DRIVER=s3` e as variáveis `S3_*`. Em serverless o disco não persiste, por isso o driver `local` não serve.
3. Configure `NEXT_PUBLIC_SITE_URL`, `APP_SECRET`, `ADMIN_SETUP_TOKEN` (temporário) e, se quiser avisos por e-mail, `SMTP_*`/`NOTIFY_EMAIL`.
4. Rode as migrations: `DB_AUTO_MIGRATE=true` na primeira subida ou `npm run db:migrate` com a `DATABASE_URL` do ambiente.
5. Faça o deploy, acesse `/admin/setup`, crie o administrador, ative a MFA e remova `ADMIN_SETUP_TOKEN`.

### VPS / Docker

`npm run build && npm run start` com `DATABASE_URL` (Postgres) e `STORAGE_DRIVER=local` (uploads em `./data/uploads`, faça backup). Coloque um proxy reverso com HTTPS (Caddy/Nginx) na frente.

## Segurança e LGPD

Implementado: CSP estrita com nonce (`script-src 'self' 'nonce-…' 'strict-dynamic'`), cabeçalhos de segurança, validação Zod no servidor em todos os formulários e ações, SQL parametrizado, autorização no servidor em cada página e ação do painel (perfis **administrador** e **editor**), senhas com scrypt, sessões opacas com expiração, MFA TOTP obrigatória para administradores, rate limiting (login, formulários), honeypot + tempo mínimo de preenchimento, uploads validados pelo conteúdo real (nunca servidos como executáveis, nunca em `/public`), Markdown renderizado sem HTML bruto, IPs anonimizados por HMAC, auditoria de ações, `noindex` no painel.

LGPD: consentimento explícito com data registrada, minimização (só os campos do formulário oficial), exclusão e exportação de dados do lead pelo painel, retenção configurável (`npm run data:prune`), scripts não essenciais bloqueados antes do consentimento de cookies (hoje o site não carrega nenhum script de terceiros). **A Política de Privacidade e os Termos são minutas e precisam de revisão jurídica antes da publicação** (ver aviso visível nas páginas).

Não declaramos a aplicação "100% segura". Riscos residuais e recomendações estão na última seção.

## Pendências de conteúdo e revisão

Itens entre colchetes no documento oficial, preenchíveis pelo painel sem tocar no código:

- [ ] Fotos profissionais dos sócios (juntos e individuais) → `/admin/midia/slots`
- [ ] Sobrenome e formação de Ícaro; conquista/número real de cada sócio (opcional) → `/admin/conteudo/about`
- [ ] E-mail de contato, horário de atendimento, CNPJ, citar ou não Teresina → `/admin/configuracoes`
- [ ] Prazo médio de entrega de site e modelo de suporte → `/admin/conteudo/service.sites` e `service.sistemas`
- [ ] Prints e vídeo do Projeto HAIK Derme Viva → `/admin/projetos`
- [ ] Checklist "10 sinais de que sua empresa tem um gargalo" (PDF) → slot `checklist.pdf`
- [ ] Depoimentos e cases reais, com autorização → `/admin/depoimentos` e `/admin/projetos`
- [ ] Revisão jurídica da Política de Privacidade e dos Termos (CNPJ, e-mail, prazo de retenção, foro)
- [ ] Analytics: nenhum script de terceiros está instalado; se adicionar GA4/Meta Pixel, carregue apenas após o consentimento (`haik:consent`) e inclua os domínios na CSP (`src/proxy.ts`).

## Limitações e riscos conhecidos

- **Hospedagem serverless exige S3 e Postgres externos**; o modo embutido (PGlite + disco) é para desenvolvimento e servidores com disco persistente.
- **E-mail**: sem SMTP, a recuperação de senha imprime o link no log do servidor (apenas em desenvolvimento) e os avisos de novos leads não são enviados. Os leads continuam sempre gravados e visíveis no painel.
- **Senhas vazadas**: a política mínima é de 12 caracteres; não há consulta a bases de senhas comprometidas.
- **Rate limit por IP** depende do cabeçalho `x-forwarded-for` confiável do provedor.
- **Desempenho 3D** varia por GPU; o DPR é reduzido automaticamente e há fallback sem WebGL, mas dispositivos muito antigos podem preferir a "Versão sem animações".
- **Medições de Lighthouse** devem ser refeitas no ambiente de produção real (CDN, Postgres e S3), pois os números locais não representam o deploy.
