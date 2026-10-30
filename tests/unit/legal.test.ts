import { describe, expect, it } from "vitest";
import { fillLegalTokens, hasPendingLegalFields, retentionLabel } from "@/lib/legal";
import { legalContent } from "@/content/pages/legal";

describe("textos legais", () => {
  it("preenche os campos informados e marca os pendentes", () => {
    const out = fillLegalTokens("CNPJ {{CNPJ}}, e-mail {{EMAIL}}, prazo {{RETENCAO}}, foro {{FORO}}.", {
      cnpj: "00.000.000/0001-00",
      email: "",
      retentionDays: 730,
      foro: "",
    });
    expect(out).toBe("CNPJ 00.000.000/0001-00, e-mail [E-MAIL DE CONTATO], prazo 2 anos, foro [CIDADE/UF DO FORO].");
    expect(hasPendingLegalFields(out)).toBe(true);
    expect(hasPendingLegalFields(fillLegalTokens("{{CNPJ}}", { cnpj: "x" }))).toBe(false);
  });

  it("converte dias de retenção em meses ou anos", () => {
    expect(retentionLabel(0)).toBeUndefined();
    expect(retentionLabel(180)).toBe("6 meses");
    expect(retentionLabel(365)).toBe("1 ano");
    expect(retentionLabel(730)).toBe("2 anos");
  });

  it("as minutas oficiais só usam tokens conhecidos", () => {
    for (const doc of [legalContent.privacy, legalContent.terms]) {
      const unknown = doc.body.match(/\{\{(?!CNPJ|EMAIL|RETENCAO|FORO)[^}]*\}\}/g);
      expect(unknown).toBeNull();
      expect(doc.body).not.toMatch(/\[(CNPJ|E-MAIL|PRAZO|CIDADE)/);
    }
  });
});
