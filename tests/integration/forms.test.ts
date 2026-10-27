import { beforeAll, describe, expect, it } from "vitest";
import { count, eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { leads, messages, projects, subscribers } from "@/server/db/schema";
import { submitContact, submitDiagnostic, subscribeChecklist } from "@/server/actions/public-forms";
import { checkRateLimit } from "@/server/auth/rate-limit";
import { testHeaders } from "../setup";

function fd(obj: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.append(k, v);
  return f;
}

const lead = {
  name: "Maria Silva",
  company: "Clínica Exemplo",
  segment: "Clínica ou consultório",
  instagramOrSite: "@clinicaexemplo",
  whatsapp: "(86) 99425-8011",
  email: "Maria@Exemplo.com.br",
  companyAge: "1 a 3 anos",
  teamSize: "2 a 5",
  mainProblem: "Poucos clientes chegando",
  problemDetails: "Agenda com buracos",
  monthlyInvestment: "Até R$ 500",
  timeline: "O quanto antes",
  bestPeriod: "Manhã",
  consent: "on",
  _t: String(Date.now() - 10000),
  _source: "/diagnostico",
};

describe("banco embutido (PGlite em memória)", () => {
  beforeAll(async () => {
    await getDb();
  });

  it("aplica migrations e o seed do projeto demonstrativo", async () => {
    const db = await getDb();
    const rows = await db.select().from(projects);
    expect(rows).toHaveLength(1);
    expect(rows[0].isDemo).toBe(true);
    expect(rows[0].status).toBe("published");
  });

  it("grava o diagnóstico e redireciona para /obrigado", async () => {
    await expect(submitDiagnostic({ status: "idle" }, fd(lead))).rejects.toThrow("NEXT_REDIRECT:/obrigado");
    const db = await getDb();
    const rows = await db.select().from(leads);
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("maria@exemplo.com.br");
    expect(rows[0].whatsapp).toBe("5586994258011");
    expect(rows[0].status).toBe("novo");
    expect(rows[0].consent).toBe(true);
    expect(rows[0].consentAt).toBeInstanceOf(Date);
  });

  it("não duplica o mesmo lead enviado de novo em seguida", async () => {
    await expect(submitDiagnostic({ status: "idle" }, fd(lead))).rejects.toThrow("NEXT_REDIRECT:/obrigado");
    const db = await getDb();
    const [{ n }] = await db.select({ n: count() }).from(leads);
    expect(Number(n)).toBe(1);
  });

  it("devolve erros de campo sem gravar nada", async () => {
    const result = await submitDiagnostic({ status: "idle" }, fd({ ...lead, email: "errado", whatsapp: "1" }));
    expect(result.status).toBe("error");
    expect(result.fieldErrors?.email).toBeTruthy();
    expect(result.fieldErrors?.whatsapp).toBeTruthy();
    expect(result.values?.name).toBe("Maria Silva");
  });

  it("trata honeypot preenchido como bot (sem gravar)", async () => {
    await expect(
      submitDiagnostic({ status: "idle" }, fd({ ...lead, email: "bot@exemplo.com", whatsapp: "(11) 98888-7777", website: "http://spam" })),
    ).rejects.toThrow("NEXT_REDIRECT:/obrigado");
    const db = await getDb();
    const bots = await db.select().from(leads).where(eq(leads.email, "bot@exemplo.com"));
    expect(bots).toHaveLength(0);
  });

  it("grava mensagens de contato e inscrições do checklist", async () => {
    const r = await submitContact(
      { status: "idle" },
      fd({ name: "João", whatsapp: "86994258011", email: "joao@exemplo.com", subject: "Quero um orçamento", message: "Olá, preciso de um site.", consent: "on", _t: String(Date.now() - 5000) }),
    );
    expect(r.status).toBe("success");
    const db = await getDb();
    expect(await db.select().from(messages)).toHaveLength(1);

    const s = await subscribeChecklist({ status: "idle" }, fd({ email: "lista@exemplo.com", source: "conteudos", _t: String(Date.now() - 5000) }));
    expect(s.status).toBe("success");
    const again = await subscribeChecklist({ status: "idle" }, fd({ email: "lista@exemplo.com", _t: String(Date.now() - 5000) }));
    expect(again.status).toBe("success");
    expect(await db.select().from(subscribers)).toHaveLength(1);
  });

  it("limita envios por IP", async () => {
    testHeaders.set("x-forwarded-for", "10.0.0.9");
    for (let i = 0; i < 5; i++) expect((await checkRateLimit("test:10.0.0.9", 5, 60_000)).ok).toBe(true);
    const blocked = await checkRateLimit("test:10.0.0.9", 5, 60_000);
    expect(blocked.ok).toBe(false);
  });
});
