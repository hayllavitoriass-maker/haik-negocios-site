/**
 * Gera o PDF do checklist (isca do diagnóstico) em /public a partir de src/content/checklist.ts,
 * usando o Chromium do Playwright. Uso: npm run checklist:build
 */
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const source = await readFile(new URL("../src/content/checklist.ts", import.meta.url), "utf8");
// Extrai o objeto literal sem precisar compilar TypeScript (o arquivo é só dados).
const match = source.match(/export const CHECKLIST = (\{[\s\S]*?\}) as const;/);
if (!match) throw new Error("CHECKLIST não encontrado em src/content/checklist.ts");
const CHECKLIST = new Function(`return (${match[1]});`)();
const fileMatch = source.match(/url: "([^"]+\.pdf)"/);
const outFile = new URL(`../public${fileMatch?.[1] ?? "/checklist.pdf"}`, import.meta.url);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Segoe UI", Arial, Helvetica, sans-serif; color: #171717; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; height: 297mm; overflow: hidden; padding: 16mm 18mm 14mm; position: relative; background: #fefefe; }
  .top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10mm; }
  .brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 20px; letter-spacing: -0.02em; }
  .brand i { display: inline-block; width: 22px; height: 22px; background: #ea1923; border-radius: 2px; }
  .chip { font: 600 9px/1 "Consolas", "Courier New", monospace; letter-spacing: .12em; text-transform: uppercase; background: #171717; color: #fff; padding: 6px 8px; border-radius: 2px; }
  h1 { font-size: 30px; line-height: 1.02; letter-spacing: -0.035em; margin: 0 0 4mm; max-width: 150mm; }
  h1 em { font-style: normal; color: #ea1923; }
  .intro { font-size: 12px; line-height: 1.5; color: #4a4a4a; max-width: 150mm; margin: 0 0 7mm; }
  ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 2.2mm; }
  li { display: grid; grid-template-columns: 14px 24px 1fr auto; gap: 10px; align-items: center; padding: 2.6mm 4mm; border: 1px solid rgba(23,23,23,.14); border-radius: 4px; }
  .box { width: 14px; height: 14px; border: 1.5px solid #171717; border-radius: 2px; }
  .n { font: 600 10px/1 "Consolas", "Courier New", monospace; color: #ea1923; }
  .sign { font-size: 12.5px; line-height: 1.3; }
  .area { font: 600 8.5px/1 "Consolas", "Courier New", monospace; letter-spacing: .1em; text-transform: uppercase; color: #9e0f16; background: rgba(234,25,35,.1); padding: 5px 7px; border-radius: 2px; white-space: nowrap; }
  .close { margin-top: 7mm; background: #171717; color: #fff; border-radius: 4px; padding: 5mm 7mm; display: grid; grid-template-columns: 1fr auto; gap: 8mm; align-items: center; }
  .close p { margin: 0; font-size: 12px; line-height: 1.5; color: #dadada; }
  .close strong { display: block; font-size: 16px; color: #fff; margin-bottom: 2mm; letter-spacing: -0.02em; }
  .cta { background: #ea1923; color: #fff; font-weight: 600; font-size: 12px; padding: 10px 14px; border-radius: 2px; white-space: nowrap; }
  .foot { position: absolute; left: 18mm; right: 18mm; bottom: 10mm; display: flex; justify-content: space-between; font: 500 9px/1 "Consolas", "Courier New", monospace; letter-spacing: .08em; text-transform: uppercase; color: #6e6e6e; }
</style></head>
<body><div class="page">
  <div class="top"><div class="brand"><i></i>HAIK Negócios</div><span class="chip">Diagnóstico gratuito</span></div>
  <h1>10 sinais de que sua empresa tem um <em>gargalo</em></h1>
  <p class="intro">${esc(CHECKLIST.intro)}</p>
  <ol>
    ${CHECKLIST.items.map((it, i) => `<li><span class="box"></span><span class="n">${String(i + 1).padStart(2, "0")}</span><span class="sign">${esc(it.sign)}</span><span class="area">${esc(it.area)}</span></li>`).join("\n    ")}
  </ol>
  <div class="close"><p><strong>Qual é o gargalo do seu negócio?</strong>${esc(CHECKLIST.closing)}</p><span class="cta">${esc(CHECKLIST.cta)}</span></div>
  <div class="foot"><span>WhatsApp (86) 99425-8011</span><span>Instagram @haiknegocios</span><span>Marketing que pensa. Tecnologia que executa.</span></div>
</div></body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
  await writeFile(outFile, pdf);
  console.log(`Checklist gerado em ${outFile.pathname} (${Math.round(pdf.length / 1024)} KB)`);
} finally {
  await browser.close();
}
