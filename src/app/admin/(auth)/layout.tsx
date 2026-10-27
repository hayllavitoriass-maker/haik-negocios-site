import Link from "next/link";

/** Páginas públicas do painel (login, setup, recuperação): cartão centralizado. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-svh place-items-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="font-display text-[20px] font-bold tracking-[-0.03em]">
            HAIK<span className="text-red">.</span>
          </Link>
          <span className="mono text-grey-500">Painel</span>
        </div>
        <div className="rounded-xs bg-white p-6 hairline">{children}</div>
        <p className="mt-6 text-center text-[12px] text-grey-500">Acesso restrito à equipe HAIK Negócios.</p>
      </div>
    </main>
  );
}
