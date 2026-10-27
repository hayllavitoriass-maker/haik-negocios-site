import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import sharp, { type Metadata } from "sharp";
import { getDb } from "@/server/db/client";
import { media, mediaSlots, posts, projects, testimonials, type Media } from "@/server/db/schema";
import { getStorage, isSafeKey } from "@/server/media/storage";
import { toPublicMedia, type PublicMedia } from "@/server/media/url";
import { MEDIA_CATEGORIES, MEDIA_SLOTS, type MediaSlotKey } from "@/content/site";

export type AdminMedia = PublicMedia & { category: string; size: number; createdAt: Date; updatedAt: Date };

export function toAdminMedia(m: Media): AdminMedia {
  return { ...toPublicMedia(m), category: m.category, size: m.size, createdAt: m.createdAt, updatedAt: m.updatedAt };
}

export function isMediaCategory(v: string): v is (typeof MEDIA_CATEGORIES)[number] {
  return (MEDIA_CATEGORIES as readonly string[]).includes(v);
}

export function isMediaSlot(v: string): v is MediaSlotKey {
  return v in MEDIA_SLOTS;
}

export async function listMedia(opts: { category?: string; q?: string; onlyImages?: boolean; limit?: number } = {}) {
  const db = await getDb();
  const conds: SQL[] = [];
  if (opts.category && isMediaCategory(opts.category)) conds.push(eq(media.category, opts.category));
  if (opts.onlyImages) conds.push(ilike(media.mime, "image/%"));
  const q = opts.q?.trim();
  if (q) {
    const p = `%${q.slice(0, 80).replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    conds.push(or(ilike(media.filename, p), ilike(media.alt, p))!);
  }
  const rows = await db
    .select()
    .from(media)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(media.createdAt))
    .limit(Math.min(500, opts.limit ?? 200));
  return rows.map(toAdminMedia);
}

export async function getMedia(id: string): Promise<Media | null> {
  const db = await getDb();
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return row ?? null;
}

export async function getMediaByIds(ids: string[]): Promise<Map<string, AdminMedia>> {
  const clean = Array.from(new Set(ids.filter(Boolean)));
  if (clean.length === 0) return new Map();
  const db = await getDb();
  const rows = await db.select().from(media).where(inArray(media.id, clean));
  return new Map(rows.map((m) => [m.id, toAdminMedia(m)]));
}

export type MediaUsage = {
  slots: string[];
  projects: Array<{ id: string; title: string }>;
  posts: Array<{ id: string; title: string }>;
  testimonials: Array<{ id: string; name: string }>;
};

export async function getMediaUsage(id: string): Promise<MediaUsage> {
  const db = await getDb();
  const [slots, projs, psts, tests] = await Promise.all([
    db.select({ slot: mediaSlots.slot }).from(mediaSlots).where(eq(mediaSlots.mediaId, id)),
    db
      .select({ id: projects.id, title: projects.title })
      .from(projects)
      .where(or(eq(projects.coverMediaId, id), sql`${projects.galleryMediaIds} @> ${JSON.stringify([id])}::jsonb`)),
    db.select({ id: posts.id, title: posts.title }).from(posts).where(eq(posts.coverMediaId, id)),
    db.select({ id: testimonials.id, name: testimonials.name }).from(testimonials).where(eq(testimonials.photoMediaId, id)),
  ]);
  return { slots: slots.map((s) => s.slot), projects: projs, posts: psts, testimonials: tests };
}

export function usageCount(u: MediaUsage) {
  return u.slots.length + u.projects.length + u.posts.length + u.testimonials.length;
}

export async function listSlotsWithMedia() {
  const db = await getDb();
  const rows = await db.select({ slot: mediaSlots.slot, media }).from(mediaSlots).leftJoin(media, eq(media.id, mediaSlots.mediaId));
  const map = new Map(rows.map((r) => [r.slot, r.media ? toAdminMedia(r.media) : null]));
  return (Object.keys(MEDIA_SLOTS) as MediaSlotKey[]).map((slot) => ({ slot, label: MEDIA_SLOTS[slot], media: map.get(slot) ?? null }));
}

// ---------------------------------------------------------------------------
// Processamento de uploads
// ---------------------------------------------------------------------------
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_PDF_BYTES = 25 * 1024 * 1024;
const ALLOWED_IMAGE_FORMATS = new Set(["jpeg", "png", "webp", "avif", "gif"]);
const MAX_DIMENSION = 2400;

export type ProcessedUpload = { buffer: Buffer; mime: string; ext: string; width: number | null; height: number | null };

export class UploadError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/**
 * Valida o conteúdo real do arquivo (não confia no nome nem no content-type do cliente):
 * - imagens: sharp precisa decodificar e o formato precisa estar na lista (sem SVG);
 * - PDF: assinatura `%PDF-` nos primeiros bytes.
 * Imagens são normalizadas (EXIF aplicado, máx. 2400px, WebP q82).
 */
export async function processUpload(buffer: Buffer, declaredType: string): Promise<ProcessedUpload> {
  const isPdfMagic = buffer.subarray(0, 5).toString("latin1") === "%PDF-";
  if (isPdfMagic || declaredType === "application/pdf") {
    if (!isPdfMagic) throw new UploadError("O arquivo não é um PDF válido.");
    if (buffer.length > MAX_PDF_BYTES) throw new UploadError("PDF acima de 25 MB.", 413);
    return { buffer, mime: "application/pdf", ext: "pdf", width: null, height: null };
  }
  if (buffer.length > MAX_IMAGE_BYTES) throw new UploadError("Imagem acima de 15 MB.", 413);

  let meta: Metadata;
  try {
    meta = await sharp(buffer, { limitInputPixels: 80_000_000 }).metadata();
  } catch {
    throw new UploadError("Não foi possível ler a imagem. Envie JPG, PNG, WebP, AVIF ou GIF.");
  }
  if (!meta.format || !ALLOWED_IMAGE_FORMATS.has(meta.format)) {
    throw new UploadError("Formato não permitido. Envie JPG, PNG, WebP, AVIF, GIF ou PDF.");
  }
  const animated = meta.format === "gif" && (meta.pages ?? 1) > 1;
  const pipeline = sharp(buffer, { animated, limitInputPixels: 80_000_000 })
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 });
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  const height = animated && info.pageHeight ? info.pageHeight : info.height;
  return { buffer: data, mime: "image/webp", ext: "webp", width: info.width, height };
}

export function newStorageKey(category: string, ext: string): string {
  const key = `${category}/${randomUUID()}.${ext}`.toLowerCase();
  if (!isSafeKey(key)) throw new UploadError("Chave de arquivo inválida.", 500);
  return key;
}

export async function storeUpload(processed: ProcessedUpload, key: string) {
  await getStorage().put(key, processed.buffer, processed.mime);
}

export async function removeStoredFile(key: string) {
  try {
    await getStorage().delete(key);
  } catch (err) {
    console.warn("[media] falha ao remover arquivo", key, (err as Error).message);
  }
}
