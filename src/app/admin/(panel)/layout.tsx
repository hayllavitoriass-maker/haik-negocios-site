import Link from "next/link";
import { requireUser } from "@/server/auth/guard";
import { logout } from "@/server/actions/admin/auth";
import { Sidebar, type NavItem } from "@/components/admin/Sidebar";
import { ROLE_LABELS } from "@/components/admin/labels";
import { buttonClass } from "@/components/admin/ui";

/**
 * Shell do painel autenticado. O layout exige sessão válida (com MFA) para montar a
 * navegação, mas CADA página repete `requireUser` com o papel exigido: layouts não
 * reexecutam em toda navegação e nunca são a única barreira.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isAdmin = user.role === "admin";

  const items: NavItem[] = [
    { href: "/admin", label: "Dashboard", exact: true },
    ...(isAdmin ? [{ href: "/admin/leads", label: "Leads" }, { href: "/admin/mensagens", label: "Mensagens" }] : []),
    { href: "/admin/conteudo", label: "Conteúdo" },
    { href: "/admin/midia", label: "Mídia" },
    { href: "/admin/projetos", label: "Projetos" },
    { href: "/admin/depoimentos", label: "Depoimentos" },
    { href: "/admin/blog", label: "Blog" },
    ...(isAdmin
      ? [
          { href: "/admin/configuracoes", label: "Configurações" },
          { href: "/admin/usuarios", label: "Usuários" },
          { href: "/admin/auditoria", label: "Auditoria" },
        ]
      : []),
    { href: "/admin/seguranca", label: "Segurança" },
  ];

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b border-grey-200 bg-white">
        <div className="relative mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4">
          <Sidebar variant="mobile" items={items} user={{ name: user.name, roleLabel: ROLE_LABELS[user.role] }} />
          <Link href="/admin" className="font-display text-[18px] font-bold tracking-[-0.03em]">
            HAIK<span className="text-red">.</span>
            <span className="ml-2 font-sans text-[12px] font-medium uppercase tracking-[0.08em] text-grey-500">Painel</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-[13px] text-grey-500 sm:inline">
              <span className="font-medium text-ink">{user.name}</span> · {ROLE_LABELS[user.role]}
            </span>
            <a href="/" target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
              Ver site
            </a>
            <form action={logout}>
              <button type="submit" className={buttonClass("ghost", "sm")}>
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-[1440px] flex-1">
        <Sidebar variant="desktop" items={items} user={{ name: user.name, roleLabel: ROLE_LABELS[user.role] }} />
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
