"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";

export type NavItem = { href: string; label: string; exact?: boolean };

/**
 * Navegação lateral do painel (cliente só para o estado ativo e o menu no celular).
 * A lista de itens vem do servidor, já filtrada pelo papel do usuário.
 */
export function Sidebar({ items, user, variant }: { items: NavItem[]; user: { name: string; roleLabel: string }; variant: "mobile" | "desktop" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Fecha o menu do celular ao navegar (ajuste de estado durante a renderização, sem efeito).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const nav = (
    <nav aria-label="Seções do painel" className="grid gap-0.5">
      {items.map((it) => {
        const active = it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(`${it.href}/`);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center rounded-xs px-3 text-[14px] transition-colors",
              active ? "bg-red-50 font-medium text-red-700" : "text-grey-600 hover:bg-grey-100 hover:text-ink",
            )}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );

  if (variant === "desktop") {
    return (
      <aside className="hidden w-[220px] shrink-0 desk:block">
        <div className="sticky top-[64px] p-3">{nav}</div>
      </aside>
    );
  }

  return (
    <>
      <button
        type="button"
        className="grid size-10 place-items-center rounded-xs hairline desk:hidden"
        aria-expanded={open}
        aria-controls="admin-mobile-nav"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75">
          {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 8h16M4 16h16" />}
        </svg>
      </button>
      {open && (
        <div id="admin-mobile-nav" className="absolute inset-x-0 top-full z-40 border-t border-grey-200 bg-white p-3 shadow-[0_20px_40px_rgba(23,23,23,0.12)] desk:hidden">
          <p className="mb-2 px-3 text-[12px] text-grey-500">
            {user.name} · {user.roleLabel}
          </p>
          {nav}
        </div>
      )}
    </>
  );
}
