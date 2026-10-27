"use server";

import { and, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { media, posts } from "@/server/db/schema";
import { audit } from "@/server/auth/audit";
import { AuthError, requireUserForAction, type ActionResult } from "@/server/auth/guard";
import { contentsContent } from "@/content/pages/misc";
import { slugify } from "@/components/admin/labels";
import { AUTH_MESSAGES, fieldErrorsOf, formToObject, uuidSchema, withFlash, withUser } from "./_shared";

const CATEGORIES = contentsContent.categories as readonly string[];

const schema = z.object({
  id: z.union([uuidSchema, z.literal("")]).optional().default(""),
  title: z.string().trim().min(2, "Informe o título.").max(160),
  slug: z.string().trim().max(120).optional().default(""),
  excerpt: z.string().trim().max(400, "Máximo de 400 caracteres.").optional().default(""),
  category: z.string().trim().refine((v) => CATEGORIES.includes(v), "Escolha uma categoria."),
  coverMediaId: z.union([uuidSchema, z.literal("")]).optional().default(""),
  body: z.string().max(100_000, "Texto longo demais.").optional().default(""),
  seoTitle: z.string().trim().max(120).optional().default(""),
  seoDescription: z.string().trim().max(300).optional().default(""),
});

function revalidate(slug?: string) {
  revalidatePath("/conteudos");
  if (slug) revalidatePath(`/conteudos/${slug}`);
  revalidatePath("/admin/blog");
}

export async function savePost(_prev: ActionResult<{ id: string }> | undefined, formData: FormData): Promise<ActionResult<{ id: string }>> {
  return withUser({}, async (user) => {
    const parsed = schema.safeParse(formToObject(formData));
    if (!parsed.success) return { ok: false, error: "Verifique os campos destacados.", fieldErrors: fieldErrorsOf(parsed.error) };
    const d = parsed.data;
    const slug = slugify(d.slug || d.title);
    if (!slug) return { ok: false, error: "Slug inválido.", fieldErrors: { slug: "Informe um slug válido." } };
    const db = await getDb();
    if (d.coverMediaId) {
      const [m] = await db.select({ id: media.id }).from(media).where(eq(media.id, d.coverMediaId)).limit(1);
      if (!m) return { ok: false, error: "A capa selecionada não existe mais." };
    }
    const conflict = await db
      .select({ id: posts.id })
      .from(posts)
      .where(d.id ? and(eq(posts.slug, slug), ne(posts.id, d.id)) : eq(posts.slug, slug))
      .limit(1);
    if (conflict.length) return { ok: false, error: "Já existe um artigo com este slug.", fieldErrors: { slug: "Slug em uso." } };

    const values = {
      title: d.title,
      slug,
      excerpt: d.excerpt,
      category: d.category,
      coverMediaId: d.coverMediaId || null,
      body: d.body.replace(/\r\n/g, "\n"),
      seoTitle: d.seoTitle || null,
      seoDescription: d.seoDescription || null,
      updatedAt: new Date(),
    };
    if (d.id) {
      const [row] = await db.update(posts).set(values).where(eq(posts.id, d.id)).returning({ id: posts.id, slug: posts.slug, status: posts.status });
      if (!row) return { ok: false, error: "Artigo não encontrado." };
      await audit({ actorId: user.id, actorEmail: user.email, action: "post.save", entity: "post", entityId: row.id });
      revalidate(row.slug);
      revalidatePath(`/admin/blog/${row.id}`);
      return { ok: true, data: { id: row.id }, message: row.status === "published" ? "Artigo salvo e atualizado no site." : "Rascunho salvo." };
    }
    const [row] = await db.insert(posts).values({ ...values, status: "draft", authorId: user.id }).returning({ id: posts.id });
    await audit({ actorId: user.id, actorEmail: user.email, action: "post.save", entity: "post", entityId: row.id, meta: { created: true } });
    revalidate();
    redirect(withFlash(`/admin/blog/${row.id}`, "ok", "Artigo criado como rascunho."));
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

export async function setPostStatus(formData: FormData): Promise<void> {
  const user = await userOrRedirect("/admin/blog");
  const parsed = z.object({ id: uuidSchema, status: z.enum(["draft", "published"]) }).safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) redirect(withFlash("/admin/blog", "erro", "Dados inválidos."));
  const { id, status } = parsed.data;
  const db = await getDb();
  const [row] = await db.select({ slug: posts.slug, body: posts.body, publishedAt: posts.publishedAt }).from(posts).where(eq(posts.id, id)).limit(1);
  if (!row) redirect(withFlash("/admin/blog", "erro", "Artigo não encontrado."));
  if (status === "published" && row.body.trim().length < 20) redirect(withFlash(`/admin/blog/${id}`, "erro", "Escreva o texto do artigo antes de publicar."));
  await db
    .update(posts)
    .set({ status, publishedAt: status === "published" ? (row.publishedAt ?? new Date()) : row.publishedAt, updatedAt: new Date() })
    .where(eq(posts.id, id));
  await audit({ actorId: user.id, actorEmail: user.email, action: status === "published" ? "post.publish" : "post.unpublish", entity: "post", entityId: id });
  revalidate(row.slug);
  revalidatePath(`/admin/blog/${id}`);
  redirect(withFlash(`/admin/blog/${id}`, "ok", status === "published" ? "Artigo publicado." : "Artigo despublicado."));
}

export async function deletePost(formData: FormData): Promise<void> {
  const user = await userOrRedirect("/admin/blog");
  const parsed = uuidSchema.safeParse(formData.get("id"));
  if (!parsed.success) redirect(withFlash("/admin/blog", "erro", "Identificador inválido."));
  const db = await getDb();
  const deleted = await db.delete(posts).where(eq(posts.id, parsed.data)).returning({ slug: posts.slug });
  if (deleted.length) {
    await audit({ actorId: user.id, actorEmail: user.email, action: "post.delete", entity: "post", entityId: parsed.data });
    revalidate(deleted[0].slug);
  }
  redirect(withFlash("/admin/blog", "ok", "Artigo excluído."));
}
