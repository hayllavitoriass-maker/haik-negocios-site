import { expect, test, type Page } from "@playwright/test";
import * as OTPAuth from "otpauth";

/**
 * Fluxo completo do painel contra o servidor de produção com banco isolado (./data/e2e):
 * setup do primeiro admin → login → ativação obrigatória de MFA → dashboard → leads
 * (o lead enviado pelo teste público aparece) → proteção de rotas e permissões.
 * Executa em série (banco compartilhado entre os testes deste arquivo).
 */
const ADMIN = { email: "admin.e2e@haik.local", name: "Admin E2E", password: "SenhaForteE2E-123456" };
let totpSecret = "";

test.describe.configure({ mode: "serial" });

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(ADMIN.email);
  await page.getByLabel("Senha", { exact: true }).fill(ADMIN.password);
  await page.getByRole("button", { name: /entrar/i }).click();
}

async function completeMfa(page: Page) {
  await expect(page).toHaveURL(/\/admin\/login\/mfa/);
  const code = new OTPAuth.TOTP({ secret: totpSecret, digits: 6, period: 30 }).generate();
  await page.getByLabel(/código/i).first().fill(code);
  await page.getByRole("button", { name: /confirmar|verificar|entrar/i }).click();
}

test.describe("painel administrativo", () => {
  test("setup do primeiro administrador exige o token e só funciona uma vez", async ({ page }) => {
    await page.goto("/admin/setup");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByLabel(/token/i).fill("token-errado");
    await page.getByLabel("Nome").fill(ADMIN.name);
    await page.getByLabel("E-mail").fill(ADMIN.email);
    await page.getByLabel("Senha", { exact: true }).fill(ADMIN.password);
    const confirm = page.getByLabel(/confirm/i);
    if (await confirm.count()) await confirm.fill(ADMIN.password);
    await page.getByRole("button", { name: /criar/i }).click();
    await expect(page).toHaveURL(/\/admin\/setup/);
    await expect(page.getByText(/token/i).first()).toBeVisible();

    await page.getByLabel(/token/i).fill("e2e-setup-token");
    await page.getByLabel("Nome").fill(ADMIN.name);
    await page.getByLabel("E-mail").fill(ADMIN.email);
    await page.getByLabel("Senha", { exact: true }).fill(ADMIN.password);
    if (await confirm.count()) await confirm.fill(ADMIN.password);
    await page.getByRole("button", { name: /criar/i }).click();
    await expect(page).toHaveURL(/\/admin\/login/);

    const again = await page.goto("/admin/setup");
    expect(again?.status()).toBe(404);
  });

  test("login errado é genérico; login certo exige ativar MFA", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("E-mail").fill(ADMIN.email);
    await page.getByLabel("Senha", { exact: true }).fill("senha-errada-123456");
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page.getByText(/incorret/i)).toBeVisible();

    await login(page);
    await expect(page).toHaveURL(/\/admin\/seguranca\/ativar-mfa/);
    // Chave manual exibida na tela de ativação (base32).
    const key = await page.locator("code, [data-secret]").filter({ hasText: /^[A-Z2-7 ]{16,}$/ }).first().innerText();
    totpSecret = key.replace(/\s+/g, "");
    const code = new OTPAuth.TOTP({ secret: totpSecret, digits: 6, period: 30 }).generate();
    await page.getByLabel(/código/i).first().fill(code);
    await page.getByRole("button", { name: /ativar|confirmar/i }).click();
    await expect(page.getByText(/recupera/i).first()).toBeVisible();
  });

  test("dashboard, leads e mensagens reais", async ({ page }) => {
    await login(page);
    await completeMfa(page);
    await expect(page).toHaveURL(/\/admin(\?.*)?$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto("/admin/leads");
    await expect(page.getByText("Maria E2E")).toBeVisible();
    await page.getByRole("link", { name: /Maria E2E/ }).first().click();
    await expect(page.getByText("Clínica E2E")).toBeVisible();
    await expect(page.getByText("Poucos clientes chegando")).toBeVisible();

    await page.goto("/admin/mensagens");
    await expect(page.getByText("João E2E")).toBeVisible();

    const csv = await page.request.get("/admin/leads/export");
    expect(csv.status()).toBe(200);
    expect(await csv.text()).toContain("Maria E2E");
  });

  test("conteúdo: rascunho não vaza, publicação aparece no site", async ({ page }) => {
    await login(page);
    await completeMfa(page);
    await page.goto("/admin/conteudo/contact");
    const title = page.getByLabel("Título").first();
    await title.fill("Vamos conversar sobre o seu negócio (E2E)");
    await page.getByRole("button", { name: /salvar rascunho/i }).click();
    await expect(page.getByText(/rascunho salvo|salvo/i).first()).toBeVisible();

    const anon = await page.context().browser()!.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto("/contato");
    await expect(anonPage.getByText("Vamos conversar sobre o seu negócio (E2E)")).toHaveCount(0);
    await anon.close();

    await page.getByRole("button", { name: /^publicar/i }).click();
    await expect(page.getByText(/publicad/i).first()).toBeVisible();
    await page.goto("/contato");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("(E2E)");
  });

  test("sem sessão nada do painel abre", async ({ request }) => {
    for (const path of ["/admin", "/admin/leads", "/admin/conteudo", "/admin/configuracoes"]) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect([302, 307], path).toContain(res.status());
    }
    const upload = await request.post("/api/admin/upload", { multipart: { file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("x") } } });
    expect([401, 403]).toContain(upload.status());
  });
});
