"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { siteSettings } from "@/server/db/schema";
import { audit } from "@/server/auth/audit";
import type { ActionResult } from "@/server/auth/guard";
import { settingsDefaults } from "@/content/site";
import { mergeContent, schemaOf } from "@/content/fields";
import { fieldErrorsOf, formToObject, withUser } from "./_shared";

/** Regras extras além da forma (schemaOf): formatos de WhatsApp, URLs e tamanhos. */
const rules = z.object({
  whatsappNumber: z.string().trim().regex(/^55\d{10,11}$/, "Use só dígitos com DDI 55, ex.: 5586994258011."),
  whatsappDisplay: z.string().trim().min(8, "Informe o número para exibição.").max(30),
  instagramHandle: z.string().trim().regex(/^@[A-Za-z0-9._]{1,30}$/, "Use o formato @usuario."),
  instagramUrl: z.string().trim().url("URL inválida.").refine((v) => v.startsWith("https://"), "Use https."),
  email: z.string().trim().max(200).refine((v) => v === "" || z.string().email().safeParse(v).success, "E-mail inválido."),
  businessHours: z.string().trim().max(80),
  cnpj: z.string().trim().max(30).refine((v) => v === "" || /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(v), "CNPJ inválido."),
  city: z.string().trim().max(80),
  mentionCity: z.boolean(),
  responseTime: z.string().trim().max(80),
  seoDefaultTitle: z.string().trim().min(5, "Informe o título padrão.").max(120),
  seoDefaultDescription: z.string().trim().min(20, "Descrição curta demais.").max(300),
  cookieBannerEnabled: z.boolean(),
  exitPopupEnabled: z.boolean(),
});

export async function saveSettings(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  return withUser({ role: "admin" }, async (user) => {
    const raw = formToObject(formData);
    const candidate = {
      ...raw,
      mentionCity: raw.mentionCity === "on",
      cookieBannerEnabled: raw.cookieBannerEnabled === "on",
      exitPopupEnabled: raw.exitPopupEnabled === "on",
    };
    const shaped = schemaOf(settingsDefaults).safeParse(mergeContent(settingsDefaults, candidate));
    if (!shaped.success) return { ok: false, error: "Dados inválidos.", fieldErrors: fieldErrorsOf(shaped.error) };
    const checked = rules.safeParse(shaped.data);
    if (!checked.success) return { ok: false, error: "Verifique os campos destacados.", fieldErrors: fieldErrorsOf(checked.error) };

    const db = await getDb();
    await db
      .insert(siteSettings)
      .values({ id: 1, data: checked.data, updatedBy: user.id, updatedAt: new Date() })
      .onConflictDoUpdate({ target: siteSettings.id, set: { data: checked.data, updatedBy: user.id, updatedAt: new Date() } });
    await audit({ actorId: user.id, actorEmail: user.email, action: "settings.update", entity: "settings", entityId: "1", meta: { keys: Object.keys(checked.data) } });
    revalidatePath("/", "layout");
    revalidatePath("/admin/configuracoes");
    return { ok: true, message: "Configurações salvas." };
  });
}
