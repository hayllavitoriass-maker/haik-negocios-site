import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/server/db/client";
import { media } from "@/server/db/schema";
import { AuthError, requireUserForAction } from "@/server/auth/guard";
import { audit } from "@/server/auth/audit";
import { isMediaCategory, newStorageKey, processUpload, removeStoredFile, storeUpload, toAdminMedia, UploadError, MAX_PDF_BYTES } from "@/server/repos/admin/media";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Verificação anti-CSRF para uploads: o navegador precisa estar na mesma origem.
 * Aceita `Sec-Fetch-Site: same-origin` ou `Origin` igual ao Host da requisição.
 */
function isSameOrigin(req: Request): boolean {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin";
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json(403, { ok: false, error: "Origem não permitida." });

  let user;
  try {
    user = await requireUserForAction();
  } catch (err) {
    if (err instanceof AuthError) return json(err.code === "forbidden" ? 403 : 401, { ok: false, error: "Sessão inválida. Entre novamente." });
    throw err;
  }

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_PDF_BYTES + 1024 * 1024) return json(413, { ok: false, error: "Arquivo grande demais." });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json(400, { ok: false, error: "Envio inválido." });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return json(400, { ok: false, error: "Selecione um arquivo." });
  if (file.size === 0) return json(400, { ok: false, error: "Arquivo vazio." });
  if (file.size > MAX_PDF_BYTES) return json(413, { ok: false, error: "Arquivo acima do limite (25 MB para PDF, 15 MB para imagens)." });

  const categoryRaw = String(form.get("category") ?? "geral");
  const category = isMediaCategory(categoryRaw) ? categoryRaw : "geral";
  const replaceId = String(form.get("replace") ?? "");
  const altRaw = String(form.get("alt") ?? "").trim().slice(0, 300);

  let processed;
  try {
    processed = await processUpload(Buffer.from(await file.arrayBuffer()), file.type);
  } catch (err) {
    if (err instanceof UploadError) return json(err.status, { ok: false, error: err.message });
    console.error("[upload] falha ao processar", err);
    return json(400, { ok: false, error: "Não foi possível processar o arquivo." });
  }

  const db = await getDb();
  const safeName = file.name.replace(/[\r\n"]/g, "").slice(0, 200) || `arquivo.${processed.ext}`;

  if (replaceId) {
    if (!/^[0-9a-f-]{36}$/i.test(replaceId)) return json(400, { ok: false, error: "Identificador inválido." });
    const [existing] = await db.select().from(media).where(eq(media.id, replaceId)).limit(1);
    if (!existing) return json(404, { ok: false, error: "Mídia não encontrada." });
    const key = newStorageKey(existing.category, processed.ext);
    await storeUpload(processed, key);
    const [row] = await db
      .update(media)
      .set({ storageKey: key, filename: safeName, mime: processed.mime, size: processed.buffer.length, width: processed.width, height: processed.height, updatedAt: new Date() })
      .where(eq(media.id, existing.id))
      .returning();
    await removeStoredFile(existing.storageKey);
    await audit({ actorId: user.id, actorEmail: user.email, action: "media.replace", entity: "media", entityId: row.id, meta: { key } });
    revalidatePath("/", "layout");
    revalidatePath("/admin/midia");
    return json(200, { ok: true, media: toAdminMedia(row) });
  }

  const key = newStorageKey(category, processed.ext);
  await storeUpload(processed, key);
  const [row] = await db
    .insert(media)
    .values({ category, storageKey: key, filename: safeName, mime: processed.mime, size: processed.buffer.length, width: processed.width, height: processed.height, alt: altRaw, createdBy: user.id })
    .returning();
  await audit({ actorId: user.id, actorEmail: user.email, action: "media.upload", entity: "media", entityId: row.id, meta: { key, mime: row.mime, size: row.size } });
  revalidatePath("/admin/midia");
  return json(200, { ok: true, media: toAdminMedia(row) });
}
