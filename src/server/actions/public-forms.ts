"use server";

import { and, eq, gt, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getDb } from "@/server/db/client";
import { leads, leadEvents, messages, subscribers } from "@/server/db/schema";
import { getClientInfo } from "@/server/auth/session";
import { checkRateLimit } from "@/server/auth/rate-limit";
import { sendMail } from "@/server/email";
import { env } from "@/lib/env";
import {
  contactSchema,
  fieldErrorsOf,
  leadSchema,
  normalizeWhatsapp,
  subscribeSchema,
} from "@/lib/validation/forms";
import { microcopy } from "@/content/pages/misc";

export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Mantém o que o visitante digitou quando o envio falha. */
  values?: Record<string, string>;
};

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

function formToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

/**
 * Defesas anti-spam que não atrapalham pessoas:
 * - honeypot (`website`) precisa estar vazio;
 * - o formulário precisa ter ficado aberto por alguns segundos (`_t`, preenchido pelo cliente).
 */
function looksLikeBot(values: Record<string, string>): boolean {
  if (values.website && values.website.trim() !== "") return true;
  const opened = Number(values._t);
  if (Number.isFinite(opened) && opened > 0 && Date.now() - opened < 2500) return true;
  return false;
}

export async function submitDiagnostic(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formToObject(formData);
  const parsed = leadSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: microcopy.errors.required, fieldErrors: fieldErrorsOf(parsed.error), values };
  }
  if (looksLikeBot(values)) {
    // Resposta indistinguível de sucesso para não dar pistas a bots.
    redirect("/obrigado");
  }

  const client = await getClientInfo();
  const limit = await checkRateLimit(`lead:${client.ipHash}`, 5, 10 * 60 * 1000);
  if (!limit.ok) return { status: "error", message: microcopy.errors.rateLimited, values };

  const data = parsed.data;
  const whatsapp = normalizeWhatsapp(data.whatsapp)!;
  const email = data.email.toLowerCase();

  try {
    const db = await getDb();
    const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);
    const dup = await db
      .select({ id: leads.id })
      .from(leads)
      .where(and(gt(leads.createdAt, since), or(eq(leads.email, email), eq(leads.whatsapp, whatsapp))))
      .limit(1);
    if (dup.length === 0) {
      const [row] = await db
        .insert(leads)
        .values({
          name: data.name,
          company: data.company,
          segment: data.segment,
          instagramOrSite: data.instagramOrSite || null,
          whatsapp,
          email,
          companyAge: data.companyAge,
          teamSize: data.teamSize,
          mainProblem: data.mainProblem,
          problemDetails: data.problemDetails || null,
          monthlyInvestment: data.monthlyInvestment,
          timeline: data.timeline,
          bestPeriod: data.bestPeriod,
          consent: true,
          consentAt: new Date(),
          source: values._source?.slice(0, 80) || "/diagnostico",
          ipHash: client.ipHash,
          userAgent: client.userAgent || null,
        })
        .returning({ id: leads.id });
      await db.insert(leadEvents).values({ leadId: row.id, type: "created", toStatus: "novo", actorName: "site" });

      if (env.NOTIFY_EMAIL) {
        const to = env.NOTIFY_EMAIL;
        after(async () => {
          await sendMail({
            to,
            subject: `Novo diagnóstico: ${data.company}`,
            text: `${data.name} (${data.company}, ${data.segment}) pediu um diagnóstico.\nProblema: ${data.mainProblem}\nPrazo: ${data.timeline}\nPeríodo: ${data.bestPeriod}\n\nVeja os detalhes no painel: ${env.NEXT_PUBLIC_SITE_URL}/admin/leads/${row.id}`,
          });
        });
      }
    }
  } catch (err) {
    console.error("[lead] falha ao gravar", err);
    return { status: "error", message: microcopy.errors.generic, values };
  }

  redirect("/obrigado");
}

export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formToObject(formData);
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: microcopy.errors.required, fieldErrors: fieldErrorsOf(parsed.error), values };
  }
  if (looksLikeBot(values)) return { status: "success" };

  const client = await getClientInfo();
  const limit = await checkRateLimit(`contact:${client.ipHash}`, 5, 10 * 60 * 1000);
  if (!limit.ok) return { status: "error", message: microcopy.errors.rateLimited, values };

  const data = parsed.data;
  try {
    const db = await getDb();
    const [row] = await db
      .insert(messages)
      .values({
        name: data.name,
        whatsapp: normalizeWhatsapp(data.whatsapp)!,
        email: data.email ? data.email.toLowerCase() : null,
        company: data.company || null,
        subject: data.subject,
        message: data.message,
        consent: true,
        ipHash: client.ipHash,
      })
      .returning({ id: messages.id });
    if (env.NOTIFY_EMAIL) {
      const to = env.NOTIFY_EMAIL;
      after(async () => {
        await sendMail({
          to,
          subject: `Nova mensagem do site: ${data.subject}`,
          text: `${data.name} enviou uma mensagem pelo site.\n\n${data.message}\n\nPainel: ${env.NEXT_PUBLIC_SITE_URL}/admin/mensagens/${row.id}`,
        });
      });
    }
    return { status: "success" };
  } catch (err) {
    console.error("[contact] falha ao gravar", err);
    return { status: "error", message: microcopy.errors.generic, values };
  }
}

export async function subscribeChecklist(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formToObject(formData);
  const parsed = subscribeSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsOf(parsed.error), values };
  }
  if (looksLikeBot(values)) return { status: "success" };
  const client = await getClientInfo();
  const limit = await checkRateLimit(`subscribe:${client.ipHash}`, 5, 10 * 60 * 1000);
  if (!limit.ok) return { status: "error", message: microcopy.errors.rateLimited, values };
  try {
    const db = await getDb();
    await db
      .insert(subscribers)
      .values({ email: parsed.data.email.toLowerCase(), source: parsed.data.source || "site" })
      .onConflictDoNothing();
    return { status: "success" };
  } catch (err) {
    console.error("[subscribe] falha", err);
    return { status: "error", message: microcopy.errors.generic, values };
  }
}
