import { NextResponse } from "next/server";
import { AuthError, requireUserForAction } from "@/server/auth/guard";
import { listMedia } from "@/server/repos/admin/media";

export const dynamic = "force-dynamic";

/** Lista de mídias para o seletor do painel (somente usuários autenticados). */
export async function GET(req: Request) {
  try {
    await requireUserForAction();
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ ok: false, error: "Sessão inválida." }, { status: 401 });
    throw err;
  }
  const url = new URL(req.url);
  const items = await listMedia({
    category: url.searchParams.get("categoria") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    onlyImages: url.searchParams.get("imagens") === "1",
    limit: 300,
  });
  return NextResponse.json({ ok: true, items }, { headers: { "Cache-Control": "no-store" } });
}
