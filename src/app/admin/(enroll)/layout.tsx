import Link from "next/link";
import { logout } from "@/server/actions/admin/auth";

/** Layout do fluxo de ativação de MFA: sessão válida, mas ainda sem acesso ao painel completo. */
export default function EnrollLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-svh place-items-center px-4 py-10">
      <div className="w-full max-w-[520px]">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="font-display text-[20px] font-bold tracking-[-0.03em]">
            HAIK<span className="text-red">.</span>
          </Link>
          <form action={logout}>
            <button type="submit" className="text-[13px] text-grey-500 underline-offset-2 hover:underline">
              Sair
            </button>
          </form>
        </div>
        <div className="rounded-xs bg-white p-6 hairline">{children}</div>
      </div>
    </main>
  );
}
