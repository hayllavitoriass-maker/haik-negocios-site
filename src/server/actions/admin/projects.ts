"use server";

import { and, asc, count, eq, inArray, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { media, projects } from "@/server/db/schema";
import { audit } from "@/server/auth/audit";
import { AuthError, requireUserForAction, type ActionResult } from "@/server/auth/guard";
import { PROJECT_SERVICES, slugify } from "@/components/admin/labels";
import { AUTH_MESSAGES, checkboxSchema, fieldErrorsOf, formToObjectWithArrays, parseJsonField, uuidSchema, withFlash, withUser } from "./_shared";

const optionalText = (max: number) => z.string().trim().max(max, `Máximo de ${max} caracteres.`).optional().default("");
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .default("")
  .refine((v) => v === "" || (/^https:\/\//.test(v) && z.string().url().safeParse(v).success), "Informe uma URL https válida (YouTube, Vimeo...).");

const linkSchema = z.object({ label: z.string().trim().min(1, "Rótulo do link.").max(80), url: z.string().trim().url("URL inválida.").max(500).refine((v) => /^https?:\/\//.test(v), "Use http(s).") });

const projectSchema = z.object({
  id: z.union([uuidSchema, z.literal("")]).optional().default(""),
  title: z.string().trim().min(2, "Informe o título.").max(160),
  slug: z.string().trim().max(120).optional().default(""),
  client: optionalText(160),
  segment: optionalText(80),
  summary: optionalText(600),
  scenario: optionalText(4000),
  bottleneck: optionalText(4000),
  solution: optionalText(4000),
  result: optionalText(4000),
  services: z.array(z.enum(PROJECT_SERVICES)).max(4).optional().default([]),
  coverMediaId: z.union([uuidSchema, z.literal("")]).optional().default(""),
  galleryMediaIds: z.array(uuidSchema).max(30).optional().default([]),
  videoUrl: optionalUrl,
  links: z.array(linkSchema).max(10).optional().default([]),
  isDemo: checkboxSchema,
  seoTitle: optionalText(120),
  seoDescription: optionalText(300),
});

function revalidateProjects(slug?: string) {
  revalidatePath("/projetos");
  if (slug) revalidatePath(`/projetos/${slug}`);
  revalidatePath("/");
  revalidatePath("/admin/projetos");
}

async function verifyMediaIds(ids: string[]) {
  const clean = Array.from(new Set(ids.filter(Boolean)));
  if (clean.length === 0) return true;
  const db = await getDb();
  const rows = await db.select({ id: media.id }).from(media).where(inArray(media.id, clean));
  return rows.length === clean.length;
}

export async function saveProject(_prev: ActionResult<{ id: string }> | undefined, formData: FormData): Promise<ActionResult<{ id: string }>> {
  return withUser({}, async (user) => {
    const raw = formToObjectWithArrays(formData);
    const parsed = projectSchema.safeParse({
      ...raw,
      services: Array.isArray(raw.services) ? raw.services : raw.services ? [raw.services] : [],
      galleryMediaIds: Array.isArray(raw.galleryMediaIds) ? raw.galleryMediaIds : raw.galleryMediaIds ? [raw.galleryMediaIds] : [],
      links: parseJsonField(raw.links) ?? [],
      isDemo: raw.isDemo,
    });
    if (!parsed.success) return { ok: false, error: "Verifique os campos destacados.", fieldErrors: fieldErrorsOf(parsed.error) };
    const d = parsed.data;
    const slug = slugify(d.slug || d.title);
    if (!slug) return { ok: false, error: "Slug inválido.", fieldErrors: { slug: "Informe um slug válido." } };
    if (!(await verifyMediaIds([d.coverMediaId, ...d.galleryMediaIds]))) return { ok: false, error: "Alguma mídia selecionada não existe mais." };

    const db = await getDb();
    const conflict = await db
      .select({ id: projects.id })
      .from(projects)
      .where(d.id ? and(eq(projects.slug, slug), ne(projects.id, d.id)) : eq(projects.slug, slug))
      .limit(1);
    if (conflict.length) return { ok: false, error: "Já existe um projeto com este slug.", fieldErrors: { slug: "Slug em uso." } };

    const values = {
      title: d.title,
      slug,
      client: d.client || null,
      segment: d.segment || null,
      summary: d.summary,
      scenario: d.scenario,
      bottleneck: d.bottleneck,
      solution: d.solution,
      result: d.result,
      services: d.services,
      coverMediaId: d.coverMediaId || null,
      galleryMediaIds: d.galleryMediaIds,
      videoUrl: d.videoUrl || null,
      links: d.links,
      isDemo: d.isDemo,
      seoTitle: d.seoTitle || null,
      seoDescription: d.seoDescription || null,
      updatedAt: new Date(),
    };

    if (d.id) {
      const [row] = await db.update(projects).set(values).where(eq(projects.id, d.id)).returning({ id: projects.id, slug: projects.slug, status: projects.status });
      if (!row) return { ok: false, error: "Projeto não encontrado." };
      await audit({ actorId: user.id, actorEmail: user.email, action: "project.save", entity: "project", entityId: row.id });
      revalidateProjects(row.slug);
      revalidatePath(`/admin/projetos/${row.id}`);
      return { ok: true, data: { id: row.id }, message: row.status === "published" ? "Projeto salvo e atualizado no site." : "Rascunho salvo." };
    }
    const [{ n }] = await db.select({ n: count() }).from(projects);
    const [row] = await db
      .insert(projects)
      .values({ ...values, status: "draft", sortOrder: Number(n) })
      .returning({ id: projects.id });
    await audit({ actorId: user.id, actorEmail: user.email, action: "project.save", entity: "project", entityId: row.id, meta: { created: true } });
    revalidateProjects();
    redirect(withFlash(`/admin/projetos/${row.id}`, "ok", "Projeto criado como rascunho."));
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

export async function setProjectStatus(formData: FormData): Promise<void> {
  const user = await userOrRedirect("/admin/projetos");
  const parsed = z.object({ id: uuidSchema, status: z.enum(["draft", "published"]) }).safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) redirect(withFlash("/admin/projetos", "erro", "Dados inválidos."));
  const { id, status } = parsed.data;
  const db = await getDb();
  const [row] = await db.select({ title: projects.title, slug: projects.slug, publishedAt: projects.publishedAt }).from(projects).where(eq(projects.id, id)).limit(1);
  if (!row) redirect(withFlash("/admin/projetos", "erro", "Projeto não encontrado."));
  if (status === "published" && row.title.trim().length < 2) redirect(withFlash(`/admin/projetos/${id}`, "erro", "Informe um título antes de publicar."));
  await db
    .update(projects)
    .set({ status, publishedAt: status === "published" ? new Date() : row.publishedAt, updatedAt: new Date() })
    .where(eq(projects.id, id));
  await audit({ actorId: user.id, actorEmail: user.email, action: status === "published" ? "project.publish" : "project.unpublish", entity: "project", entityId: id });
  revalidateProjects(row.slug);
  revalidatePath(`/admin/projetos/${id}`);
  redirect(withFlash(`/admin/projetos/${id}`, "ok", status === "published" ? "Projeto publicado." : "Projeto despublicado (volta a rascunho)."));
}

export async function deleteProject(formData: FormData): Promise<void> {
  const user = await userOrRedirect("/admin/projetos");
  const parsed = uuidSchema.safeParse(formData.get("id"));
  if (!parsed.success) redirect(withFlash("/admin/projetos", "erro", "Identificador inválido."));
  const db = await getDb();
  const deleted = await db.delete(projects).where(eq(projects.id, parsed.data)).returning({ slug: projects.slug });
  if (deleted.length) {
    await audit({ actorId: user.id, actorEmail: user.email, action: "project.delete", entity: "project", entityId: parsed.data });
    revalidateProjects(deleted[0].slug);
  }
  redirect(withFlash("/admin/projetos", "ok", "Projeto excluído."));
}

/** Move um projeto uma posição para cima ou para baixo e normaliza o sortOrder. */
export async function moveProject(formData: FormData): Promise<void> {
  const user = await userOrRedirect("/admin/projetos");
  const parsed = z.object({ id: uuidSchema, dir: z.enum(["up", "down"]) }).safeParse({ id: formData.get("id"), dir: formData.get("dir") });
  if (!parsed.success) redirect(withFlash("/admin/projetos", "erro", "Dados inválidos."));
  const db = await getDb();
  const rows = await db.select({ id: projects.id }).from(projects).orderBy(asc(projects.sortOrder), asc(projects.createdAt));
  const ids = rows.map((r) => r.id);
  const i = ids.indexOf(parsed.data.id);
  const j = parsed.data.dir === "up" ? i - 1 : i + 1;
  if (i >= 0 && j >= 0 && j < ids.length) {
    [ids[i], ids[j]] = [ids[j], ids[i]];
    for (let k = 0; k < ids.length; k++) await db.update(projects).set({ sortOrder: k }).where(eq(projects.id, ids[k]));
    await audit({ actorId: user.id, actorEmail: user.email, action: "project.reorder", entity: "project", entityId: parsed.data.id });
    revalidateProjects();
  }
  redirect("/admin/projetos");
}
