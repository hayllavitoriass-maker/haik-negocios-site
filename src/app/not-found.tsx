import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/server/content";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ROUTES } from "@/content/site";

export const metadata: Metadata = {
  title: "Página não encontrada | HAIK Negócios",
  robots: { index: false, follow: false },
};

/**
 * 404 global. Renderiza fora do layout do site (sem provedores de motion),
 * por isso usa links nativos e uma estrutura mínima sobre o layout raiz.
 */
export default async function NotFound() {
  const t = await getContent("notFound");
  const button =
    "inline-flex h-13 w-full items-center justify-between gap-4 rounded-xs px-6 text-[16px] font-medium leading-none transition-colors duration-300 sm:w-fit";
  return (
    <main className="relative isolate flex min-h-svh flex-col overflow-hidden bg-ink-900 text-white">
      <div aria-hidden="true" className="grid-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_60%_at_30%_30%,#000,transparent_75%)]" />
      <header className="container-haik relative flex h-[var(--header-h)] items-center">
        <Link href={ROUTES.home} aria-label="HAIK Negócios, início" className="inline-flex">
          <BrandLogo className="h-6" />
        </Link>
      </header>
      <section className="container-haik relative flex flex-1 flex-col justify-center gap-8 py-20">
        <p className="mono inline-flex w-fit items-center gap-[3px] leading-none">
          <span className="inline-flex items-center rounded-xs bg-red px-[9px] pt-[7px] pb-[6px] text-white">404</span>
          <span className="inline-flex items-center rounded-xs bg-white px-[9px] pt-[7px] pb-[6px] text-ink">HAIK</span>
        </p>
        <h1 className="text-beat max-w-[12em]">{t.title}</h1>
        <p className="max-w-[56ch] text-intro text-grey-300">{t.body}</p>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Link href={ROUTES.diagnostico} className={`${button} bg-red text-white hover:bg-white hover:text-ink`}>
            <span>{t.cta}</span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link href={ROUTES.home} className={`${button} bg-transparent text-white hairline-dark hover:bg-white hover:text-ink`}>
            <span>{t.home}</span>
          </Link>
        </div>
      </section>
      <div className="brand-mark container-haik relative text-[22vw] text-white/[0.06]" aria-hidden="true">
        <span className="-ml-[.04em] inline-block">HAIK</span>
      </div>
    </main>
  );
}
