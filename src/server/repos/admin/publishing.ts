import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { posts, projects, testimonials, users } from "@/server/db/schema";
import { getMediaByIds, type AdminMedia } from "./media";

export async function listProjectsAdmin() {
  const db = await getDb();
  const rows = await db.select().from(projects).orderBy(asc(projects.sortOrder), desc(projects.createdAt));
  const map = await getMediaByIds(rows.map((r) => r.coverMediaId ?? ""));
  return rows.map((r) => ({ ...r, cover: r.coverMediaId ? (map.get(r.coverMediaId) ?? null) : null }));
}

export async function getProjectAdmin(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!row) return null;
  const map = await getMediaByIds([row.coverMediaId ?? "", ...row.galleryMediaIds]);
  return {
    ...row,
    cover: row.coverMediaId ? (map.get(row.coverMediaId) ?? null) : null,
    gallery: row.galleryMediaIds.map((id) => map.get(id)).filter((m): m is AdminMedia => Boolean(m)),
  };
}

export async function listTestimonialsAdmin() {
  const db = await getDb();
  const rows = await db.select().from(testimonials).orderBy(asc(testimonials.sortOrder), desc(testimonials.createdAt));
  const map = await getMediaByIds(rows.map((r) => r.photoMediaId ?? ""));
  return rows.map((r) => ({ ...r, photo: r.photoMediaId ? (map.get(r.photoMediaId) ?? null) : null }));
}

export async function getTestimonialAdmin(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(testimonials).where(eq(testimonials.id, id)).limit(1);
  if (!row) return null;
  const map = await getMediaByIds([row.photoMediaId ?? ""]);
  return { ...row, photo: row.photoMediaId ? (map.get(row.photoMediaId) ?? null) : null };
}

export async function listPostsAdmin() {
  const db = await getDb();
  const rows = await db
    .select({ post: posts, authorName: users.name })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .orderBy(desc(posts.updatedAt));
  return rows.map((r) => ({ ...r.post, authorName: r.authorName }));
}

export async function getPostAdmin(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!row) return null;
  const map = await getMediaByIds([row.coverMediaId ?? ""]);
  return { ...row, cover: row.coverMediaId ? (map.get(row.coverMediaId) ?? null) : null };
}
