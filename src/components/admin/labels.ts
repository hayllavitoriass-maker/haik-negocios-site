import type { LeadStatus, MessageStatus, PublishStatus, UserRole } from "@/server/db/schema";

/** Rótulos em português usados pelo painel (compartilhados entre servidor e cliente). */
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  novo: "Novo",
  contatado: "Contatado",
  agendado: "Diagnóstico agendado",
  realizado: "Diagnóstico realizado",
  proposta: "Proposta enviada",
  convertido: "Convertido",
  encerrado: "Encerrado",
};

export const LEAD_STATUS_TONES: Record<LeadStatus, "red" | "neutral" | "green" | "amber" | "blue"> = {
  novo: "red",
  contatado: "blue",
  agendado: "blue",
  realizado: "amber",
  proposta: "amber",
  convertido: "green",
  encerrado: "neutral",
};

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  novo: "Nova",
  respondido: "Respondida",
  arquivado: "Arquivada",
};

export const MESSAGE_STATUS_TONES: Record<MessageStatus, "red" | "neutral" | "green" | "amber" | "blue"> = {
  novo: "red",
  respondido: "green",
  arquivado: "neutral",
};

export const PUBLISH_STATUS_LABELS: Record<PublishStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  editor: "Editor",
};

export const PROJECT_SERVICES = ["Sites", "Sistemas", "Automações e IA", "Marketing e conteúdo"] as const;

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "auth.login": "Login",
  "auth.login_failed": "Falha de login",
  "auth.mfa_verified": "MFA confirmado",
  "auth.mfa_failed": "Falha no MFA",
  "auth.logout": "Logout",
  "auth.setup": "Primeiro administrador criado",
  "auth.reset_requested": "Recuperação de senha solicitada",
  "auth.reset_completed": "Senha redefinida",
  "auth.password_changed": "Senha alterada",
  "auth.mfa_enabled": "MFA ativado",
  "auth.mfa_disabled": "MFA desativado",
  "auth.recovery_regenerated": "Códigos de recuperação regenerados",
  "lead.status": "Status do lead alterado",
  "lead.note": "Nota adicionada ao lead",
  "lead.delete": "Lead excluído",
  "lead.export": "Leads exportados (CSV)",
  "lead.export_one": "Dados do lead exportados (JSON)",
  "message.status": "Status da mensagem alterado",
  "message.delete": "Mensagem excluída",
  "content.draft": "Rascunho de conteúdo salvo",
  "content.publish": "Conteúdo publicado",
  "content.discard": "Rascunho descartado",
  "content.restore": "Versão restaurada",
  "media.upload": "Mídia enviada",
  "media.replace": "Mídia substituída",
  "media.update": "Mídia atualizada",
  "media.delete": "Mídia excluída",
  "media.slot": "Slot de mídia atualizado",
  "project.save": "Projeto salvo",
  "project.publish": "Projeto publicado",
  "project.unpublish": "Projeto despublicado",
  "project.delete": "Projeto excluído",
  "project.reorder": "Projetos reordenados",
  "testimonial.save": "Depoimento salvo",
  "testimonial.publish": "Depoimento publicado",
  "testimonial.unpublish": "Depoimento despublicado",
  "testimonial.delete": "Depoimento excluído",
  "post.save": "Artigo salvo",
  "post.publish": "Artigo publicado",
  "post.unpublish": "Artigo despublicado",
  "post.delete": "Artigo excluído",
  "settings.update": "Configurações atualizadas",
  "user.create": "Usuário criado",
  "user.role": "Papel do usuário alterado",
  "user.deactivate": "Usuário desativado",
  "user.reactivate": "Usuário reativado",
  "user.reset_mfa": "MFA do usuário redefinido",
};

const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const dayFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return dateFmt.format(d);
}

export function formatDay(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return dayFmt.format(d);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Gera um slug URL-safe a partir de um título (sem acentos, minúsculo, hífens). */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
