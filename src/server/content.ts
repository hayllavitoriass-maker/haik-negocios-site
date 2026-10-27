import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { contentEntries, mediaSlots, media, siteSettings } from "@/server/db/schema";
import { contentRegistry, type ContentKey, type ContentOf } from "@/content/registry";
import { mergeContent, schemaOf } from "@/content/fields";
import { settingsDefaults, type SiteSettings, type MediaSlotKey } from "@/content/site";
import { getSession } from "@/server/auth/session";
import { mediaUrl, type PublicMedia, toPublicMedia } from "@/server/media/url";

export const PREVIEW_COOKIE = "haik_preview";

/**
 * Pré-visualização de rascunhos: cookie `haik_preview=1` + sessão válida do painel.
 * Sem sessão, o cookie é ignorado (nunca expõe rascunhos ao público).
 */
export const isPreview = cache(async (): Promise<boolean> => {
  try {
    const store = await cookies();
    if (store.get(PREVIEW_COOKIE)?.value !== "1") return false;
    const session = await getSession();
    return Boolean(session && (!session.user.mfaEnabled || session.mfaVerified));
  } catch {
    return false;
  }
});

/**
 * Conteúdo de uma página: padrões oficiais mesclados com o que foi publicado no painel.
 * Qualquer falha de banco cai nos padrões, para o site nunca ficar sem texto.
 */
export const getContent = cache(async <K extends ContentKey>(key: K): Promise<ContentOf<K>> => {
  const defaults = contentRegistry[key].defaults as ContentOf<K>;
  try {
    const db = await getDb();
    const rows = await db.select().from(contentEntries).where(eq(contentEntries.key, key)).limit(1);
    const row = rows[0];
    if (!row) return defaults;
    const preview = await isPreview();
    const source = preview ? (row.draft ?? row.published) : row.published;
    if (!source) return defaults;
    const parsed = schemaOf(defaults).safeParse(mergeContent(defaults, source));
    return parsed.success ? (parsed.data as ContentOf<K>) : defaults;
  } catch (err) {
    console.warn(`[content] usando padrões para "${key}":`, (err as Error).message);
    return defaults;
  }
});

export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const db = await getDb();
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
    const data = rows[0]?.data;
    if (!data) return settingsDefaults;
    const parsed = schemaOf(settingsDefaults).safeParse(mergeContent(settingsDefaults, data));
    return parsed.success ? (parsed.data as SiteSettings) : settingsDefaults;
  } catch (err) {
    console.warn("[settings] usando padrões:", (err as Error).message);
    return settingsDefaults;
  }
});

export type MediaSlotMap = Partial<Record<MediaSlotKey, PublicMedia>>;

/** Mídias nomeadas (fotos dos fundadores, OG, checklist...) já com URL pública. */
export const getMediaSlots = cache(async (): Promise<MediaSlotMap> => {
  try {
    const db = await getDb();
    const rows = await db
      .select({ slot: mediaSlots.slot, media })
      .from(mediaSlots)
      .innerJoin(media, eq(media.id, mediaSlots.mediaId));
    const out: MediaSlotMap = {};
    for (const r of rows) out[r.slot as MediaSlotKey] = toPublicMedia(r.media);
    return out;
  } catch (err) {
    console.warn("[media-slots] indisponível:", (err as Error).message);
    return {};
  }
});

export { mediaUrl };
