/**
 * Preenche os campos variáveis dos textos legais ({{CNPJ}}, {{EMAIL}}, {{RETENCAO}}, {{FORO}})
 * com os valores das configurações. O que ainda não foi informado fica marcado entre
 * colchetes, visível para quem revisa, sem publicar dado fictício.
 */
export type LegalVars = { cnpj?: string; email?: string; retentionDays?: number; foro?: string };

const LABELS: Record<string, string> = {
  CNPJ: "CNPJ",
  EMAIL: "E-MAIL DE CONTATO",
  RETENCAO: "PRAZO DE RETENÇÃO",
  FORO: "CIDADE/UF DO FORO",
};

export function retentionLabel(days?: number): string | undefined {
  if (!days || days <= 0) return undefined;
  const months = Math.round(days / 30);
  if (months >= 12 && months % 12 === 0) {
    const years = months / 12;
    return `${years} ${years === 1 ? "ano" : "anos"}`;
  }
  return `${months} ${months === 1 ? "mês" : "meses"}`;
}

export function fillLegalTokens(body: string, vars: LegalVars): string {
  const values: Record<string, string | undefined> = {
    CNPJ: vars.cnpj?.trim() || undefined,
    EMAIL: vars.email?.trim() || undefined,
    RETENCAO: retentionLabel(vars.retentionDays),
    FORO: vars.foro?.trim() || undefined,
  };
  return body.replace(/\{\{(CNPJ|EMAIL|RETENCAO|FORO)\}\}/g, (_, key: string) => values[key] ?? `[${LABELS[key]}]`);
}

/** true quando ainda há campo pendente no texto (para destacar o aviso de revisão). */
export function hasPendingLegalFields(body: string): boolean {
  return /\[(CNPJ|E-MAIL DE CONTATO|PRAZO DE RETENÇÃO|CIDADE\/UF DO FORO)\]/.test(body);
}
