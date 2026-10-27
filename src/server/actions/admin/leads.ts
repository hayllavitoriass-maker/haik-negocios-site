"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { LEAD_STATUSES, MESSAGE_STATUSES, leadEvents, leadNotes, leads, messages } from "@/server/db/schema";
import { audit } from "@/server/auth/audit";
import { AuthError, requireUserForAction } from "@/server/auth/guard";
import { AUTH_MESSAGES, uuidSchema, withFlash } from "./_shared";

async function admin() {
  try {
    return await requireUserForAction({ role: "admin" });
  } catch (err) {
    if (err instanceof AuthError) redirect(withFlash("/admin", "erro", AUTH_MESSAGES[err.code]));
    throw err;
  }
}

const statusSchema = z.object({ id: uuidSchema, status: z.enum(LEAD_STATUSES) });

export async function updateLeadStatus(formData: FormData): Promise<void> {
  const user = await admin();
  const parsed = statusSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) redirect(withFlash("/admin/leads", "erro", "Dados inválidos."));
  const { id, status } = parsed.data;
  const db = await getDb();
  const [lead] = await db.select({ id: leads.id, status: leads.status }).from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) redirect(withFlash("/admin/leads", "erro", "Lead não encontrado."));
  if (lead.status !== status) {
    await db.update(leads).set({ status, updatedAt: new Date() }).where(eq(leads.id, id));
    await db.insert(leadEvents).values({ leadId: id, actorId: user.id, actorName: user.name, type: "status_change", fromStatus: lead.status, toStatus: status });
    await audit({ actorId: user.id, actorEmail: user.email, action: "lead.status", entity: "lead", entityId: id, meta: { from: lead.status, to: status } });
  }
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin/leads");
  redirect(withFlash(`/admin/leads/${id}`, "ok", "Status atualizado."));
}

const noteSchema = z.object({ id: uuidSchema, body: z.string().trim().min(1, "Escreva a nota.").max(4000) });

export async function addLeadNote(formData: FormData): Promise<void> {
  const user = await admin();
  const parsed = noteSchema.safeParse({ id: formData.get("id"), body: formData.get("body") });
  if (!parsed.success) redirect(withFlash("/admin/leads", "erro", "Escreva a nota antes de salvar."));
  const { id, body } = parsed.data;
  const db = await getDb();
  const [lead] = await db.select({ id: leads.id }).from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) redirect(withFlash("/admin/leads", "erro", "Lead não encontrado."));
  await db.insert(leadNotes).values({ leadId: id, authorId: user.id, authorName: user.name, body });
  await db.insert(leadEvents).values({ leadId: id, actorId: user.id, actorName: user.name, type: "note" });
  await audit({ actorId: user.id, actorEmail: user.email, action: "lead.note", entity: "lead", entityId: id });
  revalidatePath(`/admin/leads/${id}`);
  redirect(withFlash(`/admin/leads/${id}`, "ok", "Nota adicionada."));
}

export async function deleteLead(formData: FormData): Promise<void> {
  const user = await admin();
  const parsed = uuidSchema.safeParse(formData.get("id"));
  if (!parsed.success) redirect(withFlash("/admin/leads", "erro", "Identificador inválido."));
  const db = await getDb();
  const deleted = await db.delete(leads).where(eq(leads.id, parsed.data)).returning({ id: leads.id });
  if (deleted.length) {
    await audit({ actorId: user.id, actorEmail: user.email, action: "lead.delete", entity: "lead", entityId: parsed.data });
  }
  revalidatePath("/admin/leads");
  redirect(withFlash("/admin/leads", "ok", "Lead e dados associados excluídos."));
}

const msgStatusSchema = z.object({ id: uuidSchema, status: z.enum(MESSAGE_STATUSES) });

export async function updateMessageStatus(formData: FormData): Promise<void> {
  const user = await admin();
  const parsed = msgStatusSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) redirect(withFlash("/admin/mensagens", "erro", "Dados inválidos."));
  const { id, status } = parsed.data;
  const db = await getDb();
  const updated = await db.update(messages).set({ status, updatedAt: new Date() }).where(eq(messages.id, id)).returning({ id: messages.id });
  if (!updated.length) redirect(withFlash("/admin/mensagens", "erro", "Mensagem não encontrada."));
  await audit({ actorId: user.id, actorEmail: user.email, action: "message.status", entity: "message", entityId: id, meta: { to: status } });
  revalidatePath(`/admin/mensagens/${id}`);
  revalidatePath("/admin/mensagens");
  redirect(withFlash(`/admin/mensagens/${id}`, "ok", "Status atualizado."));
}

export async function deleteMessage(formData: FormData): Promise<void> {
  const user = await admin();
  const parsed = uuidSchema.safeParse(formData.get("id"));
  if (!parsed.success) redirect(withFlash("/admin/mensagens", "erro", "Identificador inválido."));
  const db = await getDb();
  const deleted = await db.delete(messages).where(eq(messages.id, parsed.data)).returning({ id: messages.id });
  if (deleted.length) {
    await audit({ actorId: user.id, actorEmail: user.email, action: "message.delete", entity: "message", entityId: parsed.data });
  }
  revalidatePath("/admin/mensagens");
  redirect(withFlash("/admin/mensagens", "ok", "Mensagem excluída."));
}
