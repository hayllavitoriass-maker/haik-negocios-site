/**
 * Auditoria Lighthouse (performance, acessibilidade, SEO, boas práticas) usando o Chromium
 * do Playwright. Uso: node scripts/lighthouse.mjs [baseUrl] [rotas...]
 * Ex.: node scripts/lighthouse.mjs http://localhost:3101 / /diagnostico /servicos
 * Gera relatórios HTML em ./lighthouse e imprime as notas.
 */
import { mkdir, writeFile } from "node:fs/promises";
import lighthouse from "lighthouse";
import { chromium } from "@playwright/test";

const [baseUrl = "http://localhost:3101", ...routes] = process.argv.slice(2);
const pages = routes.length ? routes : ["/", "/diagnostico", "/servicos/sites", "/metodo", "/sobre", "/contato"];

// Lança o Chromium do Playwright com porta de depuração (chrome-launcher não funciona em todo ambiente).
const PORT = 9333;
const browser = await chromium.launch({
  headless: true,
  args: [`--remote-debugging-port=${PORT}`, "--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const chrome = { port: PORT, kill: () => browser.close() };

await mkdir("lighthouse", { recursive: true });
const rows = [];
try {
  for (const route of pages) {
    for (const formFactor of ["mobile", "desktop"]) {
      const result = await lighthouse(`${baseUrl}${route}`, {
        port: chrome.port,
        output: "html",
        logLevel: "error",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        formFactor,
        screenEmulation: formFactor === "desktop" ? { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false } : undefined,
        throttlingMethod: "simulate",
      });
      const lhr = result.lhr;
      const score = (c) => Math.round((lhr.categories[c]?.score ?? 0) * 100);
      const audits = lhr.audits;
      rows.push({
        route,
        formFactor,
        performance: score("performance"),
        accessibility: score("accessibility"),
        bestPractices: score("best-practices"),
        seo: score("seo"),
        lcp: audits["largest-contentful-paint"]?.displayValue,
        cls: audits["cumulative-layout-shift"]?.displayValue,
        tbt: audits["total-blocking-time"]?.displayValue,
      });
      const name = `${route === "/" ? "home" : route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}-${formFactor}.html`;
      await writeFile(`lighthouse/${name}`, result.report);
    }
  }
} finally {
  await chrome.kill();
}
console.table(rows);
await writeFile("lighthouse/summary.json", JSON.stringify(rows, null, 2));
