"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { media, mediaSlots, projects } from "@/server/db/schema";
import { audit } from "@/server/auth/audit";
import { AuthError, requireUserForAction } from "@/server/auth/guard";
import { MEDIA_CATEGORIES } from "@/content/site";
import { getMedia, getMediaUsage, isMediaSlot, removeStoredFile } from "@/server/repos/admin/media";
import { AUTH_MESSAGES, uuidSchema, withFlash } from "./_shared";

async function userOrRedirect(back: string, role?: "admin") {
  try {
    return await requireUserForAction(role ? { role } : {});
  } catch (err) {
    if (err instanceof AuthError) redirect(withFlash(back, "erro", AUTH_MESSAGES[err.code]));
    throw err;
  }
}

const metaSchema = z.object({
  id: uuidSchema,
  alt: z.string().trim().max(300),
  category: z.enum(MEDIA_CATEGORIES),
  focalX: z.coerce.number().min(0).max(1),
  focalY: z.coerce.number().min(0).max(1),
});

export async function updateMediaMeta(formData: FormData): Promise<void> {
  const user = await userOrRedirect("/admin/midia");
  const parsed = metaSchema.safeParse({
    id: formData.get("id"),
    alt: formData.get("alt") ?? "",
    category: formData.get("category") ?? "geral",
    focalX: formData.get("focalX") ?? 0.5,
    focalY: formData.get("focalY") ?? 0.5,
  });
  if (!parsed.success) redirect(withFlash("/admin/midia", "erro", "Dados inválidos."));
  const d = parsed.data;
  const db = await getDb();
  const updated = await db
    .update(media)
    .set({ alt: d.alt, category: d.category, focalX: d.focalX, focalY: d.focalY, updatedAt: new Date() })
    .where(eq(media.id, d.id))
    .returning({ id: media.id });
  if (!updated.length) redirect(withFlash("/admin/midia", "erro", "Mídia não encontrada."));
  await audit({ actorId: user.id, actorEmail: user.email, action: "media.update", entity: "media", entityId: d.id });
  revalidatePath("/", "layout");
  revalidatePath(`/admin/midia/${d.id}`);
  redirect(withFlash(`/admin/midia/${d.id}`, "ok", "Mídia atualizada."));
}

export async function deleteMedia(formData: FormData): Promise<void> {
  const user = await userOrRedirect("/admin/midia");
  const parsed = uuidSchema.safeParse(formData.get("id"));
  if (!parsed.success) redirect(withFlash("/admin/midia", "erro", "Identificador inválido."));
  const id = parsed.data;
  const row = await getMedia(id);
  if (!row) redirect(withFlash("/admin/midia", "erro", "Mídia não encontrada."));
  const usage = await getMediaUsage(id);
  const db = await getDb();
  // Referências diretas caem por FK (set null); galerias em JSON precisam de limpeza.
  for (const p of usage.projects) {
    const [proj] = await db.select({ galleryMediaIds: projects.galleryMediaIds }).from(projects).where(eq(projects.id, p.id)).limit(1);
    if (proj && proj.galleryMediaIds.includes(id)) {
      await db
        .update(projects)
        .set({ galleryMediaIds: proj.galleryMediaIds.filter((g) => g !== id) })
        .where(eq(projects.id, p.id));
    }
  }
  await db.delete(media).where(eq(media.id, id));
  await removeStoredFile(row.storageKey);
  await audit({ actorId: user.id, actorEmail: user.email, action: "media.delete", entity: "media", entityId: id, meta: { key: row.storageKey, usages: usage } });
  revalidatePath("/", "layout");
  revalidatePath("/admin/midia");
  redirect(withFlash("/admin/midia", "ok", "Mídia excluída."));
}

const slotSchema = z.object({ slot: z.string().min(1), mediaId: z.union([uuidSchema, z.literal("")]) });

export async function assignMediaSlot(formData: FormData): Promise<void> {
  const user = await userOrRedirect("/admin/midia/slots");
  const parsed = slotSchema.safeParse({ slot: formData.get("slot"), mediaId: formData.get("mediaId") ?? "" });
  if (!parsed.success || !isMediaSlot(parsed.data.slot)) redirect(withFlash("/admin/midia/slots", "erro", "Slot inválido."));
  const { slot, mediaId } = parsed.data;
  const db = await getDb();
  if (mediaId) {
    const m = await getMedia(mediaId);
    if (!m) redirect(withFlash("/admin/midia/slots", "erro", "Mídia não encontrada."));
    if (slot === "checklist.pdf" && m.mime !== "application/pdf") redirect(withFlash("/admin/midia/slots", "erro", "Este slot aceita apenas PDF."));
    if (slot !== "checklist.pdf" && !m.mime.startsWith("image/")) redirect(withFlash("/admin/midia/slots", "erro", "Este slot aceita apenas imagens."));
  }
  await db
    .insert(mediaSlots)
    .values({ slot, mediaId: mediaId || null, updatedAt: new Date() })
    .onConflictDoUpdate({ target: mediaSlots.slot, set: { mediaId: mediaId || null, updatedAt: sql`now()` } });
  await audit({ actorId: user.id, actorEmail: user.email, action: "media.slot", entity: "media_slot", entityId: slot, meta: { mediaId: mediaId || null } });
  revalidatePath("/", "layout");
  revalidatePath("/admin/midia/slots");
  redirect(withFlash("/admin/midia/slots", "ok", mediaId ? "Slot atualizado." : "Slot limpo."));
}
