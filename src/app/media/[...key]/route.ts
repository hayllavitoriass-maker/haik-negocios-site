import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { media } from "@/server/db/schema";
import { getStorage, isSafeKey } from "@/server/media/storage";

/**
 * Serve arquivos enviados pelo painel. Só entrega o que está registrado na tabela `media`
 * (nunca lista nem executa arquivos) e sempre com o content-type gravado na validação.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await ctx.params;
  const key = parts.join("/");
  if (!isSafeKey(key)) return new NextResponse("Not found", { status: 404 });

  const db = await getDb();
  const rows = await db.select().from(media).where(eq(media.storageKey, key)).limit(1);
  const row = rows[0];
  if (!row) return new NextResponse("Not found", { status: 404 });

  const file = await getStorage().read(key);
  if (!file) return new NextResponse("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": row.mime,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": row.mime === "application/pdf" ? `inline; filename="${row.filename.replace(/[^\w.\-]+/g, "_")}"` : "inline",
  });
  if (file.size) headers.set("Content-Length", String(file.size));
  return new NextResponse(file.stream, { headers });
}
