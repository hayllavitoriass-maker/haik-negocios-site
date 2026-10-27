import "server-only";
import { and, count, desc, eq, gte, ilike, or, type SQL } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { LEAD_STATUSES, MESSAGE_STATUSES, leadEvents, leadNotes, leads, messages, type LeadStatus, type MessageStatus } from "@/server/db/schema";

export const PAGE_SIZE = 25;

export type LeadFilters = {
  status?: string;
  segment?: string;
  period?: string; // 7 | 30 | 90 | all
  q?: string;
  page?: number;
};

function periodSince(period?: string): Date | null {
  const days = Number(period);
  if (!Number.isFinite(days) || days <= 0) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/** Escapa curingas do LIKE para que a busca seja literal. */
function likePattern(q: string) {
  return `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
}

export async function listLeads(filters: LeadFilters) {
  const db = await getDb();
  const conds: SQL[] = [];
  if (filters.status && (LEAD_STATUSES as readonly string[]).includes(filters.status)) conds.push(eq(leads.status, filters.status as LeadStatus));
  if (filters.segment) conds.push(eq(leads.segment, filters.segment));
  const since = periodSince(filters.period);
  if (since) conds.push(gte(leads.createdAt, since));
  const q = filters.q?.trim();
  if (q) {
    const p = likePattern(q.slice(0, 100));
    const digits = q.replace(/\D+/g, "");
    const parts = [ilike(leads.name, p), ilike(leads.company, p), ilike(leads.email, p)];
    if (digits.length >= 4) parts.push(ilike(leads.whatsapp, `%${digits}%`));
    conds.push(or(...parts)!);
  }
  const where = conds.length ? and(...conds) : undefined;
  const page = Math.max(1, filters.page ?? 1);
  const [rows, [{ n }]] = await Promise.all([
    db
      .select()
      .from(leads)
      .where(where)
      .orderBy(desc(leads.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(leads).where(where),
  ]);
  const total = Number(n);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getLeadDetail(id: string) {
  const db = await getDb();
  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) return null;
  const [notes, events] = await Promise.all([
    db.select().from(leadNotes).where(eq(leadNotes.leadId, id)).orderBy(desc(leadNotes.createdAt)),
    db.select().from(leadEvents).where(eq(leadEvents.leadId, id)).orderBy(desc(leadEvents.createdAt)),
  ]);
  return { lead, notes, events };
}

export async function listLeadSegments(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.selectDistinct({ segment: leads.segment }).from(leads).orderBy(leads.segment);
  return rows.map((r) => r.segment);
}

export async function listAllLeadsForExport() {
  const db = await getDb();
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

export type MessageFilters = { status?: string; q?: string; page?: number };

export async function listMessages(filters: MessageFilters) {
  const db = await getDb();
  const conds: SQL[] = [];
  if (filters.status && (MESSAGE_STATUSES as readonly string[]).includes(filters.status)) conds.push(eq(messages.status, filters.status as MessageStatus));
  const q = filters.q?.trim();
  if (q) {
    const p = likePattern(q.slice(0, 100));
    conds.push(or(ilike(messages.name, p), ilike(messages.subject, p), ilike(messages.email, p), ilike(messages.company, p), ilike(messages.message, p))!);
  }
  const where = conds.length ? and(...conds) : undefined;
  const page = Math.max(1, filters.page ?? 1);
  const [rows, [{ n }]] = await Promise.all([
    db
      .select()
      .from(messages)
      .where(where)
      .orderBy(desc(messages.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(messages).where(where),
  ]);
  const total = Number(n);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getMessage(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  return row ?? null;
}

/** CSV com escape correto (aspas duplas) e proteção contra injeção de fórmula em planilhas. */
export function toCsv(headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>): string {
  const cell = (v: string | number | boolean | null | undefined) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [headers.map(cell).join(";"), ...rows.map((r) => r.map(cell).join(";"))];
  return "﻿" + lines.join("\r\n");
}
