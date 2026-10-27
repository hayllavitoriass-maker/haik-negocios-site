"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { media, testimonials } from "@/server/db/schema";
import { audit } from "@/server/auth/audit";
import { AuthError, requireUserForAction, type ActionResult } from "@/server/auth/guard";
import { AUTH_MESSAGES, checkboxSchema, fieldErrorsOf, formToObject, uuidSchema, withFlash, withUser } from "./_shared";

const schema = z.object({
  id: z.union([uuidSchema, z.literal("")]).optional().default(""),
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  company: z.string().trim().max(160).optional().default(""),
  role: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().max(120).optional().default(""),
  photoMediaId: z.union([uuidSchema, z.literal("")]).optional().default(""),
  quote: z.string().trim().min(10, "O depoimento precisa ter pelo menos 10 caracteres.").max(1500),
  authorized: checkboxSchema,
  sortOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
});

function revalidate() {
  revalidatePath("/");
  revalidatePath("/sobre");
  revalidatePath("/admin/depoimentos");
}

export async function saveTestimonial(_prev: ActionResult<{ id: string }> | undefined, formData: FormData): Promise<ActionResult<{ id: string }>> {
  return withUser({}, async (user) => {
    const parsed = schema.safeParse(formToObject(formData));
    if (!parsed.success) return { ok: false, error: "Verifique os campos destacados.", fieldErrors: fieldErrorsOf(parsed.error) };
    const d = parsed.data;
    const db = await getDb();
    if (d.photoMediaId) {
      const [m] = await db.select({ id: media.id }).from(media).where(eq(media.id, d.photoMediaId)).limit(1);
      if (!m) return { ok: false, error: "A foto selecionada não existe mais." };
    }
    const values = {
      name: d.name,
      company: d.company || null,
      role: d.role || null,
      city: d.city || null,
      photoMediaId: d.photoMediaId || null,
      quote: d.quote,
      authorized: d.authorized,
      sortOrder: d.sortOrder,
      updatedAt: new Date(),
    };
    if (d.id) {
      const [row] = await db.select({ status: testimonials.status }).from(testimonials).where(eq(testimonials.id, d.id)).limit(1);
      if (!row) return { ok: false, error: "Depoimento não encontrado." };
      // Retirar a autorização de um depoimento publicado o despublica (regra do site).
      const status = row.status === "published" && !d.authorized ? "draft" : row.status;
      await db.update(testimonials).set({ ...values, status }).where(eq(testimonials.id, d.id));
      await audit({ actorId: user.id, actorEmail: user.email, action: "testimonial.save", entity: "testimonial", entityId: d.id });
      revalidate();
      revalidatePath(`/admin/depoimentos/${d.id}`);
      return { ok: true, data: { id: d.id }, message: status !== row.status ? "Salvo. Sem autorização, o depoimento voltou a rascunho." : "Depoimento salvo." };
    }
    const [row] = await db.insert(testimonials).values({ ...values, status: "draft" }).returning({ id: testimonials.id });
    await audit({ actorId: user.id, actorEmail: user.email, action: "testimonial.save", entity: "testimonial", entityId: row.id, meta: { created: true } });
    revalidate();
    redirect(withFlash(`/admin/depoimentos/${row.id}`, "ok", "Depoimento criado como rascunho."));
  });
}

async function userOrRedirect(back: string) {
  try {
    return await requireUserForAction();
  } catch (err) {
    if (err instanceof AuthError) redirect(withFlash(back, "erro", AUTH_MESSAGES[err.code]));
    throw err;
  }
}

export async function setTestimonialStatus(formData: FormData): Promise<void> {
  const user = await userOrRedirect("/admin/depoimentos");
  const parsed = z.object({ id: uuidSchema, status: z.enum(["draft", "published"]) }).safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) redirect(withFlash("/admin/depoimentos", "erro", "Dados inválidos."));
  const { id, status } = parsed.data;
  const db = await getDb();
  const [row] = await db.select({ authorized: testimonials.authorized }).from(testimonials).where(eq(testimonials.id, id)).limit(1);
  if (!row) redirect(withFlash("/admin/depoimentos", "erro", "Depoimento não encontrado."));
  if (status === "published" && !row.authorized) {
    redirect(withFlash(`/admin/depoimentos/${id}`, "erro", "Só é possível publicar depoimentos com autorização registrada."));
  }
  await db.update(testimonials).set({ status, updatedAt: new Date() }).where(eq(testimonials.id, id));
  await audit({ actorId: user.id, actorEmail: user.email, action: status === "published" ? "testimonial.publish" : "testimonial.unpublish", entity: "testimonial", entityId: id });
  revalidate();
  revalidatePath(`/admin/depoimentos/${id}`);
  redirect(withFlash(`/admin/depoimentos/${id}`, "ok", status === "published" ? "Depoimento publicado." : "Depoimento despublicado."));
}

export async function deleteTestimonial(formData: FormData): Promise<void> {
  const user = await userOrRedirect("/admin/depoimentos");
  const parsed = uuidSchema.safeParse(formData.get("id"));
  if (!parsed.success) redirect(withFlash("/admin/depoimentos", "erro", "Identificador inválido."));
  const db = await getDb();
  const deleted = await db.delete(testimonials).where(eq(testimonials.id, parsed.data)).returning({ id: testimonials.id });
  if (deleted.length) {
    await audit({ actorId: user.id, actorEmail: user.email, action: "testimonial.delete", entity: "testimonial", entityId: parsed.data });
    revalidate();
  }
  redirect(withFlash("/admin/depoimentos", "ok", "Depoimento excluído."));
}
