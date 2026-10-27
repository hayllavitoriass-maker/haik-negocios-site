import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { media, posts, projects, testimonials, type Post, type Project, type Testimonial } from "@/server/db/schema";
import { toPublicMedia, type PublicMedia } from "@/server/media/url";
import { isPreview } from "@/server/content";

export type PublicProject = Omit<Project, "coverMediaId" | "galleryMediaIds"> & {
  cover: PublicMedia | null;
  gallery: PublicMedia[];
};
export type PublicPost = Omit<Post, "coverMediaId"> & { cover: PublicMedia | null };
export type PublicTestimonial = Omit<Testimonial, "photoMediaId"> & { photo: PublicMedia | null };

async function mediaMap(ids: (string | null | undefined)[]): Promise<Map<string, PublicMedia>> {
  const clean = Array.from(new Set(ids.filter((v): v is string => Boolean(v))));
  if (clean.length === 0) return new Map();
  const db = await getDb();
  const rows = await db.select().from(media).where(inArray(media.id, clean));
  return new Map(rows.map((m) => [m.id, toPublicMedia(m)]));
}

function hydrateProject(p: Project, map: Map<string, PublicMedia>): PublicProject {
  const { coverMediaId, galleryMediaIds, ...rest } = p;
  return {
    ...rest,
    cover: coverMediaId ? (map.get(coverMediaId) ?? null) : null,
    gallery: galleryMediaIds.map((id) => map.get(id)).filter((m): m is PublicMedia => Boolean(m)),
  };
}

export const listPublicProjects = cache(async (): Promise<PublicProject[]> => {
  try {
    const db = await getDb();
    const preview = await isPreview();
    const rows = await db
      .select()
      .from(projects)
      .where(preview ? undefined : eq(projects.status, "published"))
      .orderBy(asc(projects.sortOrder), desc(projects.createdAt));
    const map = await mediaMap(rows.flatMap((r) => [r.coverMediaId, ...r.galleryMediaIds]));
    return rows.map((r) => hydrateProject(r, map));
  } catch (err) {
    console.warn("[projects] indisponível:", (err as Error).message);
    return [];
  }
});

export const getPublicProject = cache(async (slug: string): Promise<PublicProject | null> => {
  try {
    const db = await getDb();
    const preview = await isPreview();
    const rows = await db
      .select()
      .from(projects)
      .where(preview ? eq(projects.slug, slug) : and(eq(projects.slug, slug), eq(projects.status, "published")))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const map = await mediaMap([row.coverMediaId, ...row.galleryMediaIds]);
    return hydrateProject(row, map);
  } catch {
    return null;
  }
});

export const listPublicPosts = cache(async (category?: string): Promise<PublicPost[]> => {
  try {
    const db = await getDb();
    const preview = await isPreview();
    const conds = [preview ? undefined : eq(posts.status, "published"), category ? eq(posts.category, category) : undefined].filter(Boolean);
    const rows = await db
      .select()
      .from(posts)
      .where(conds.length ? and(...(conds as [ReturnType<typeof eq>])) : undefined)
      .orderBy(desc(posts.publishedAt), desc(posts.createdAt));
    const map = await mediaMap(rows.map((r) => r.coverMediaId));
    return rows.map(({ coverMediaId, ...rest }) => ({ ...rest, cover: coverMediaId ? (map.get(coverMediaId) ?? null) : null }));
  } catch (err) {
    console.warn("[posts] indisponível:", (err as Error).message);
    return [];
  }
});

export const getPublicPost = cache(async (slug: string): Promise<PublicPost | null> => {
  try {
    const db = await getDb();
    const preview = await isPreview();
    const rows = await db
      .select()
      .from(posts)
      .where(preview ? eq(posts.slug, slug) : and(eq(posts.slug, slug), eq(posts.status, "published")))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const map = await mediaMap([row.coverMediaId]);
    const { coverMediaId, ...rest } = row;
    return { ...rest, cover: coverMediaId ? (map.get(coverMediaId) ?? null) : null };
  } catch {
    return null;
  }
});

/** Só depoimentos publicados E com autorização registrada aparecem no site. */
export const listPublicTestimonials = cache(async (): Promise<PublicTestimonial[]> => {
  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(testimonials)
      .where(and(eq(testimonials.status, "published"), eq(testimonials.authorized, true)))
      .orderBy(asc(testimonials.sortOrder), desc(testimonials.createdAt));
    const map = await mediaMap(rows.map((r) => r.photoMediaId));
    return rows.map(({ photoMediaId, ...rest }) => ({ ...rest, photo: photoMediaId ? (map.get(photoMediaId) ?? null) : null }));
  } catch {
    return [];
  }
});
