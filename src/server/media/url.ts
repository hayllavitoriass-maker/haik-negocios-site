import type { Media } from "@/server/db/schema";

/** Dados de mídia seguros para enviar ao cliente (sem ids de usuário). */
export type PublicMedia = {
  id: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  mime: string;
  focalX: number;
  focalY: number;
  filename: string;
};

/**
 * URL pública de um arquivo. No driver local os arquivos passam por /media/[...key]
 * (Route Handler que valida o caminho). No S3, pela URL pública do bucket/CDN quando
 * configurada; caso contrário também pelo site, que faz o proxy.
 */
export function mediaUrl(storageKey: string): string {
  const base = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");
  if (process.env.STORAGE_DRIVER === "s3" && base) return `${base}/${storageKey}`;
  return `/media/${storageKey}`;
}

export function toPublicMedia(m: Media): PublicMedia {
  return {
    id: m.id,
    url: mediaUrl(m.storageKey),
    alt: m.alt,
    width: m.width,
    height: m.height,
    mime: m.mime,
    focalX: m.focalX,
    focalY: m.focalY,
    filename: m.filename,
  };
}
