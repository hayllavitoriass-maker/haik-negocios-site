import { describe, expect, it } from "vitest";
import { contactSchema, fieldErrorsOf, formatWhatsapp, leadSchema, normalizeWhatsapp } from "@/lib/validation/forms";

const validLead = {
  name: "Maria Silva",
  company: "Clínica Exemplo",
  segment: "Clínica ou consultório",
  instagramOrSite: "@clinicaexemplo",
  whatsapp: "(86) 99425-8011",
  email: "maria@exemplo.com.br",
  companyAge: "1 a 3 anos",
  teamSize: "2 a 5",
  mainProblem: "Poucos clientes chegando",
  problemDetails: "Agenda com buracos",
  monthlyInvestment: "Até R$ 500",
  timeline: "O quanto antes",
  bestPeriod: "Manhã",
  consent: "on",
};

describe("normalizeWhatsapp", () => {
  it("aceita formatos brasileiros comuns e normaliza com DDI", () => {
    expect(normalizeWhatsapp("(86) 99425-8011")).toBe("5586994258011");
    expect(normalizeWhatsapp("86994258011")).toBe("5586994258011");
    expect(normalizeWhatsapp("+55 86 99425 8011")).toBe("5586994258011");
    expect(normalizeWhatsapp("086 99425-8011")).toBe("5586994258011");
    expect(normalizeWhatsapp("(86) 3222-1234")).toBe("558632221234");
  });
  it("rejeita números incompletos ou DDD inválido", () => {
    expect(normalizeWhatsapp("994258011")).toBeNull();
    expect(normalizeWhatsapp("(00) 99425-8011")).toBeNull();
    expect(normalizeWhatsapp("(10) 99425-8011")).toBeNull();
    expect(normalizeWhatsapp("abc")).toBeNull();
  });
});

describe("formatWhatsapp", () => {
  it("aplica a máscara progressivamente", () => {
    expect(formatWhatsapp("8")).toBe("(8");
    expect(formatWhatsapp("8699")).toBe("(86) 99");
    expect(formatWhatsapp("8632221234")).toBe("(86) 3222-1234");
    expect(formatWhatsapp("86994258011")).toBe("(86) 99425-8011");
    expect(formatWhatsapp("869942580119999")).toBe("(86) 99425-8011");
  });
});

describe("leadSchema", () => {
  it("aceita um lead completo", () => {
    const r = leadSchema.safeParse(validLead);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.consent).toBe(true);
  });
  it("exige consentimento", () => {
    const r = leadSchema.safeParse({ ...validLead, consent: undefined });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrorsOf(r.error).consent).toMatch(/consentimento/);
  });
  it("reporta e-mail e WhatsApp inválidos com as mensagens oficiais", () => {
    const r = leadSchema.safeParse({ ...validLead, email: "maria@", whatsapp: "123" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const errors = fieldErrorsOf(r.error);
      expect(errors.email).toBe("Parece que faltou algo nesse e-mail.");
      expect(errors.whatsapp).toBe("Confere o número? Use DDD + número, só com dígitos.");
    }
  });
  it("só aceita opções oficiais", () => {
    const r = leadSchema.safeParse({ ...validLead, segment: "Outro segmento" });
    expect(r.success).toBe(false);
  });
});

describe("contactSchema", () => {
  it("aceita mensagem sem e-mail", () => {
    const r = contactSchema.safeParse({ name: "João", whatsapp: "86994258011", subject: "Tenho uma dúvida", message: "Olá", consent: "on" });
    expect(r.success).toBe(true);
  });
  it("valida e-mail quando informado", () => {
    const r = contactSchema.safeParse({ name: "João", whatsapp: "86994258011", email: "x", subject: "Tenho uma dúvida", message: "Olá", consent: "on" });
    expect(r.success).toBe(false);
  });
});
