"use client";

import { useEffect, useState } from "react";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { ROUTES } from "@/content/site";

export const CONSENT_KEY = "haik:consent";
export type Consent = { analytics: boolean; at: string };

export function readConsent(): Consent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
}

/**
 * Aviso de cookies (LGPD). Scripts de marketing/analytics não essenciais só podem ser
 * carregados após `analytics: true` (ver hook useConsent). Hoje o site não carrega
 * nenhum script de terceiros; o gate fica pronto para quando houver.
 */
export function CookieConsent({ body, accept, decline, more }: { body: string; accept: string; decline: string; more: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- estado só conhecido no navegador, aplicado após a hidratação
    setOpen(readConsent() === null);
  }, []);

  const save = (analytics: boolean) => {
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics, at: new Date().toISOString() } satisfies Consent));
      window.dispatchEvent(new CustomEvent("haik:consent", { detail: { analytics } }));
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-[calc(var(--mobile-bar-h)+12px)] z-30 mx-auto max-w-[560px] rounded-md bg-ink p-4 text-white shadow-[0_24px_60px_rgba(0,0,0,.4)] desk:inset-x-auto desk:bottom-5 desk:left-5"
    >
      <p className="text-[14px] leading-[1.5] text-grey-200">{body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => save(true)} className="h-9 rounded-xs bg-red px-3 text-[13px] font-medium text-white hover:bg-white hover:text-ink">
          {accept}
        </button>
        <button type="button" onClick={() => save(false)} className="h-9 rounded-xs px-3 text-[13px] font-medium hairline-dark hover:bg-white/10">
          {decline}
        </button>
        <TransitionLink href={ROUTES.privacidade} className="ml-auto text-[13px] text-grey-300 underline underline-offset-4 hover:text-white">
          {more}
        </TransitionLink>
      </div>
    </div>
  );
}
