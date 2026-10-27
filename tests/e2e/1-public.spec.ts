import { expect, test, type Page } from "@playwright/test";

const ROUTES = [
  "/",
  "/diagnostico",
  "/servicos",
  "/servicos/sites",
  "/servicos/sistemas",
  "/servicos/automacoes-e-ia",
  "/servicos/marketing",
  "/metodo",
  "/sobre",
  "/saude",
  "/arquitetura",
  "/projetos",
  "/projetos/projeto-haik-derme-viva",
  "/conteudos",
  "/contato",
  "/obrigado",
  "/privacidade",
  "/termos",
];

/** Marca uma opção (rádio/checkbox customizado) clicando no rótulo, centralizado na tela. */
async function pick(scope: import("@playwright/test").Locator, text: string | RegExp) {
  const label = scope.locator("label").filter({ hasText: text }).first();
  await label.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const checkbox = label.locator('input[type="checkbox"]');
  if (await checkbox.count()) {
    // O rótulo do consentimento contém um link: marca o checkbox em si.
    await checkbox.check({ force: true });
    return;
  }
  await label.click();
}

async function dismissCookies(page: Page) {
  const accept = page.getByRole("button", { name: "Só o essencial" });
  if (await accept.isVisible().catch(() => false)) await accept.click();
}

test.describe("páginas públicas", () => {
  for (const route of ROUTES) {
    test(`renderiza ${route}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
      // Sem overflow horizontal involuntário.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `overflow horizontal em ${route}`).toBeLessThanOrEqual(1);
      expect(errors, `erros de JS em ${route}`).toEqual([]);
    });
  }

  test("404 personalizada", async ({ page }) => {
    const res = await page.goto("/pagina-que-nao-existe");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("Encontramos um gargalo")).toBeVisible();
    await expect(page.getByRole("link", { name: /diagnóstico gratuito/i })).toBeVisible();
  });

  test("cabeçalhos de segurança e CSP com nonce", async ({ page }) => {
    const res = await page.goto("/");
    const headers = res?.headers() ?? {};
    expect(headers["content-security-policy"]).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
  });

  test("home tem os 10 capítulos e textos oficiais", async ({ page }) => {
    await page.goto("/");
    await dismissCookies(page);
    for (const id of ["inicio", "dores", "haik", "servicos", "metodo", "ia", "segmentos", "fundadores", "projetos", "contato"]) {
      await expect(page.locator(`section#${id}`)).toHaveCount(1);
    }
    await expect(page.getByRole("heading", { level: 1 })).toHaveAttribute("aria-label", /Precisa de clareza/);
    await expect(page.getByRole("heading", { name: "Qual é o gargalo do seu negócio?" })).toHaveCount(1);
    await expect(page.getByText("Projeto demonstrativo").first()).toBeAttached();
  });

  test("navegação principal leva às páginas internas", async ({ page }) => {
    await page.goto("/");
    await dismissCookies(page);
    const isMobile = (page.viewportSize()?.width ?? 1440) <= 900;
    if (isMobile) {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await page.locator("#mobile-menu").getByRole("link", { name: "Método CLARO" }).click();
    } else {
      await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Método CLARO" }).click();
    }
    await expect(page).toHaveURL(/\/metodo$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/nunca ficar no escuro/i);
  });

  test("sitemap e robots", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("/diagnostico");
    const robots = await request.get("/robots.txt");
    expect(await robots.text()).toMatch(/Disallow: \/admin/);
  });

  test("painel não é indexável e redireciona sem sessão", async ({ request }) => {
    const res = await request.get("/admin", { maxRedirects: 0 });
    expect([302, 307]).toContain(res.status());
    expect(res.headers()["location"]).toContain("/admin/login");
  });
});

test.describe("formulário de diagnóstico", () => {
  test.use({ reducedMotion: "reduce" });
  test("valida campos e envia para /obrigado", async ({ page }) => {
    await page.goto("/diagnostico");
    await dismissCookies(page);
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Quero meu diagnóstico" }) });
    await expect(form).toBeVisible();

    await form.getByRole("button", { name: "Quero meu diagnóstico" }).click();
    await expect(form.getByText("Esse campo é importante para a gente te atender bem.").first()).toBeVisible();

    await form.getByLabel("Seu nome").fill("Maria E2E");
    await form.getByLabel("Nome da empresa").fill("Clínica E2E");
    await form.getByLabel("Segmento").selectOption("Clínica ou consultório");
    await form.getByLabel("@ do Instagram ou site da empresa").fill("@clinicae2e");
    await form.getByLabel("WhatsApp").fill("86994258011");
    await form.getByLabel("E-mail").fill(`maria.${Date.now()}@exemplo.com`);
    await pick(form, "1 a 3 anos");
    await pick(form, "2 a 5");
    await pick(form, "Poucos clientes chegando");
    await form.getByLabel("Conte em poucas palavras").fill("Agenda com buracos.");
    await pick(form, "Até R$ 500");
    await pick(form, "O quanto antes");
    await pick(form, "Manhã");
    await pick(form, /Concordo em receber contato/);
    // Proteção anti-bot exige alguns segundos com o formulário aberto.
    await page.waitForTimeout(3000);
    await form.getByRole("button", { name: "Quero meu diagnóstico" }).click();
    await expect(page).toHaveURL(/\/obrigado$/, { timeout: 20000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Recebemos");
  });
});

test.describe("formulário de contato", () => {
  test.use({ reducedMotion: "reduce" });
  test("envia mensagem com sucesso", async ({ page }) => {
    await page.goto("/contato");
    await dismissCookies(page);
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Enviar mensagem" }) });
    await form.getByLabel("Nome", { exact: true }).fill("João E2E");
    await form.getByLabel("WhatsApp").fill("86994258011");
    await form.getByLabel("Assunto").selectOption("Tenho uma dúvida");
    await form.getByLabel("Mensagem").fill("Olá, quero saber mais.");
    await pick(form, /Li e concordo/);
    await page.waitForTimeout(3000);
    await form.getByRole("button", { name: "Enviar mensagem" }).click();
    await expect(page.getByText("Mensagem enviada!")).toBeVisible({ timeout: 20000 });
  });
});

test.describe("acessibilidade e reduced motion", () => {
  test("com reduced motion as cenas viram fluxo normal e o conteúdo fica visível", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/scenes-static/);
    const title = page.getByRole("heading", { name: "Qual é o gargalo do seu negócio?" });
    await title.scrollIntoViewIfNeeded();
    await expect(title).toBeVisible();
    await context.close();
  });
});
