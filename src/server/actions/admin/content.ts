"use server";

import { and, desc, eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { contentEntries, contentVersions } from "@/server/db/schema";
import { audit } from "@/server/auth/audit";
import { AuthError, requireUserForAction, type ActionResult } from "@/server/auth/guard";
import { contentRegistry, isContentKey } from "@/content/registry";
import { mergeContent, schemaOf } from "@/content/fields";
import { PREVIEW_COOKIE } from "@/server/content";
import { isProd } from "@/lib/env";
import { AUTH_MESSAGES, parseJsonField, uuidSchema, withFlash, withUser } from "./_shared";

const MAX_VERSIONS_PER_KEY = 50;

function revalidateContent(path: string) {
  revalidatePath(path);
  // Rodapé, microtextos e SEO afetam todas as páginas.
  revalidatePath("/", "layout");
}

const submitSchema = z.object({
  key: z.string().min(1),
  intent: z.enum(["draft", "publish"]),
});

/** Salva rascunho ou publica o conteúdo de uma página (campo `data` em JSON). */
export async function submitContent(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  return withUser({}, async (user) => {
    const parsed = submitSchema.safeParse({ key: formData.get("key"), intent: formData.get("intent") });
    if (!parsed.success) return { ok: false, error: "Requisição inválida." };
    const { key, intent } = parsed.data;
    if (!isContentKey(key)) return { ok: false, error: "Conteúdo desconhecido." };
    const entry = contentRegistry[key];

    const raw = parseJsonField(formData.get("data"));
    if (raw === undefined || typeof raw !== "object" || raw === null) return { ok: false, error: "Dados do formulário inválidos." };
    const validated = schemaOf(entry.defaults).safeParse(mergeContent(entry.defaults, raw));
    if (!validated.success) {
      const first = validated.error.issues[0];
      return { ok: false, error: `Campo inválido: ${first?.path.join(".") ?? "?"} — ${first?.message ?? ""}` };
    }
    const data = validated.data as Record<string, unknown>;
    const db = await getDb();
    const now = new Date();

    if (intent === "draft") {
      await db
        .insert(contentEntries)
        .values({ key, draft: data, updatedBy: user.id, updatedAt: now })
        .onConflictDoUpdate({ target: contentEntries.key, set: { draft: data, updatedBy: user.id, updatedAt: now } });
      await audit({ actorId: user.id, actorEmail: user.email, action: "content.draft", entity: "content", entityId: key });
      revalidatePath(`/admin/conteudo/${key}`);
      revalidatePath("/admin/conteudo");
      // Redireciona com flash: o formulário é remontado com o rascunho salvo.
      redirect(withFlash(`/admin/conteudo/${key}`, "ok", "Rascunho salvo."));
    }

    await db
      .insert(contentEntries)
      .values({ key, draft: null, published: data, updatedBy: user.id, updatedAt: now, publishedAt: now })
      .onConflictDoUpdate({ target: contentEntries.key, set: { draft: null, published: data, updatedBy: user.id, updatedAt: now, publishedAt: now } });
    await db.insert(contentVersions).values({ key, data, createdBy: user.id });
    // Mantém o histórico enxuto.
    const old = await db
      .select({ id: contentVersions.id })
      .from(contentVersions)
      .where(eq(contentVersions.key, key))
      .orderBy(desc(contentVersions.createdAt))
      .offset(MAX_VERSIONS_PER_KEY);
    for (const v of old) await db.delete(contentVersions).where(eq(contentVersions.id, v.id));

    await audit({ actorId: user.id, actorEmail: user.email, action: "content.publish", entity: "content", entityId: key });
    revalidateContent(entry.path);
    revalidatePath(`/admin/conteudo/${key}`);
    revalidatePath("/admin/conteudo");
    redirect(withFlash(`/admin/conteudo/${key}`, "ok", "Publicado. O site já mostra o novo conteúdo."));
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

export async function discardContentDraft(formData: FormData): Promise<void> {
  const key = String(formData.get("key") ?? "");
  if (!isContentKey(key)) redirect(withFlash("/admin/conteudo", "erro", "Conteúdo desconhecido."));
  const user = await userOrRedirect(`/admin/conteudo/${key}`);
  const db = await getDb();
  await db.update(contentEntries).set({ draft: null, updatedBy: user.id, updatedAt: new Date() }).where(eq(contentEntries.key, key));
  await audit({ actorId: user.id, actorEmail: user.email, action: "content.discard", entity: "content", entityId: key });
  revalidatePath(`/admin/conteudo/${key}`);
  revalidatePath("/admin/conteudo");
  redirect(withFlash(`/admin/conteudo/${key}`, "ok", "Rascunho descartado."));
}

export async function restoreContentVersion(formData: FormData): Promise<void> {
  const key = String(formData.get("key") ?? "");
  if (!isContentKey(key)) redirect(withFlash("/admin/conteudo", "erro", "Conteúdo desconhecido."));
  const user = await userOrRedirect(`/admin/conteudo/${key}`);
  const id = uuidSchema.safeParse(formData.get("versionId"));
  if (!id.success) redirect(withFlash(`/admin/conteudo/${key}`, "erro", "Versão inválida."));
  const db = await getDb();
  const [version] = await db
    .select()
    .from(contentVersions)
    .where(and(eq(contentVersions.id, id.data), eq(contentVersions.key, key)))
    .limit(1);
  if (!version) redirect(withFlash(`/admin/conteudo/${key}`, "erro", "Versão não encontrada."));
  const now = new Date();
  await db
    .insert(contentEntries)
    .values({ key, draft: version.data, updatedBy: user.id, updatedAt: now })
    .onConflictDoUpdate({ target: contentEntries.key, set: { draft: version.data, updatedBy: user.id, updatedAt: now } });
  await audit({ actorId: user.id, actorEmail: user.email, action: "content.restore", entity: "content", entityId: key, meta: { versionId: version.id } });
  revalidatePath(`/admin/conteudo/${key}`);
  redirect(withFlash(`/admin/conteudo/${key}`, "ok", "Versão restaurada como rascunho. Publique para aplicar no site."));
}

/** Carrega os textos oficiais (padrões do código) como rascunho, para revisar e publicar. */
export async function loadContentDefaults(formData: FormData): Promise<void> {
  const key = String(formData.get("key") ?? "");
  if (!isContentKey(key)) redirect(withFlash("/admin/conteudo", "erro", "Conteúdo desconhecido."));
  const user = await userOrRedirect(`/admin/conteudo/${key}`);
  const data = JSON.parse(JSON.stringify(contentRegistry[key].defaults)) as Record<string, unknown>;
  const now = new Date();
  const db = await getDb();
  await db
    .insert(contentEntries)
    .values({ key, draft: data, updatedBy: user.id, updatedAt: now })
    .onConflictDoUpdate({ target: contentEntries.key, set: { draft: data, updatedBy: user.id, updatedAt: now } });
  await audit({ actorId: user.id, actorEmail: user.email, action: "content.restore", entity: "content", entityId: key, meta: { defaults: true } });
  revalidatePath(`/admin/conteudo/${key}`);
  redirect(withFlash(`/admin/conteudo/${key}`, "ok", "Textos padrão carregados como rascunho. Publique para aplicar no site."));
}

function previewCookieOptions(maxAge: number) {
  return { httpOnly: true, sameSite: "lax" as const, secure: isProd, path: "/", maxAge };
}

/** Liga a pré-visualização de rascunhos (cookie só vale junto com a sessão) e abre a página. */
export async function enablePreview(formData: FormData): Promise<void> {
  await userOrRedirect("/admin/conteudo");
  const path = String(formData.get("path") ?? "/");
  const safe = path.startsWith("/") && !path.startsWith("//") ? path : "/";
  (await cookies()).set(PREVIEW_COOKIE, "1", previewCookieOptions(60 * 60 * 2));
  redirect(safe);
}

export async function disablePreview(): Promise<void> {
  await userOrRedirect("/admin/conteudo");
  (await cookies()).delete(PREVIEW_COOKIE);
  const referer = (await headers()).get("referer") ?? "";
  let back = "/admin/conteudo";
  try {
    const u = new URL(referer);
    if (u.pathname.startsWith("/admin")) back = u.pathname + u.search;
  } catch {
    /* sem referer válido */
  }
  redirect(withFlash(back, "ok", "Pré-visualização desligada."));
}
