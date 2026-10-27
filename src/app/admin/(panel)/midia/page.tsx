import Link from "next/link";
import { requireUser } from "@/server/auth/guard";
import { MEDIA_CATEGORIES } from "@/content/site";
import { listMedia } from "@/server/repos/admin/media";
import { MediaUploader } from "@/components/admin/media/MediaUploader";
import { MediaThumb } from "@/components/admin/media/MediaPicker";
import { Card, EmptyState, Flash, LinkButton, PageHeader, buttonClass, controlClass } from "@/components/admin/ui";
import { formatBytes } from "@/components/admin/labels";
import { cn } from "@/lib/cn";

export const metadata = { title: "Mídia" };

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ categoria?: string; q?: string; ok?: string; erro?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const items = await listMedia({ category: sp.categoria, q: sp.q, limit: 300 });

  return (
    <>
      <PageHeader
        title="Mídia"
        description="Imagens e PDFs usados no site. Imagens são otimizadas automaticamente (WebP, até 2400px)."
        actions={
          <LinkButton href="/admin/midia/slots" size="sm">
            Slots nomeados
          </LinkButton>
        }
      />
      <Flash ok={sp.ok} erro={sp.erro} />
      <Card title="Enviar arquivo" className="mb-4">
        <MediaUploader defaultCategory={sp.categoria && (MEDIA_CATEGORIES as readonly string[]).includes(sp.categoria) ? sp.categoria : "geral"} />
      </Card>
      <Card>
        <form method="get" action="/admin/midia" className="mb-4 flex flex-wrap items-center gap-2">
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Buscar por nome ou descrição" className={cn(controlClass, "h-9 max-w-xs")} aria-label="Buscar" />
          <button type="submit" className={buttonClass("secondary", "sm")}>
            Buscar
          </button>
          <div className="ml-auto flex flex-wrap gap-1">
            <Link href="/admin/midia" className={buttonClass(!sp.categoria ? "primary" : "ghost", "sm")}>
              Todas
            </Link>
            {MEDIA_CATEGORIES.map((c) => (
              <Link key={c} href={`/admin/midia?categoria=${c}`} className={buttonClass(sp.categoria === c ? "primary" : "ghost", "sm")}>
                {c}
              </Link>
            ))}
          </div>
        </form>
        {items.length === 0 ? (
          <EmptyState title="Nenhum arquivo nesta categoria" description="Envie imagens ou PDFs usando o formulário acima." />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {items.map((m) => (
              <li key={m.id}>
                <Link href={`/admin/midia/${m.id}`} className="group block overflow-hidden rounded-xs bg-white hairline hover:shadow-[0_8px_24px_rgba(23,23,23,0.08)]">
                  <MediaThumb m={m} className="aspect-square w-full" />
                  <div className="px-2 py-1.5">
                    <p className="truncate text-[12px] font-medium text-ink">{m.alt || m.filename}</p>
                    <p className="truncate text-[11px] text-grey-500">
                      {m.category} · {m.width && m.height ? `${m.width}×${m.height} · ` : ""}
                      {formatBytes(m.size)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
