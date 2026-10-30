"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { subscribeChecklist, type FormState } from "@/server/actions/public-forms";
import { AntiSpamFields } from "@/components/ui/Field";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const SEEN_KEY = "haik:exit-popup";

/**
 * Pop-up de saída (opcional, só no computador, uma vez por visitante): oferece o checklist.
 * Dispara quando o ponteiro sai pelo topo da janela, depois de alguns segundos na página.
 */
export function ExitPopup({
  body,
  accept,
  decline,
  placeholder,
  success,
  download,
}: {
  body: string;
  accept: string;
  decline: string;
  placeholder: string;
  success: string;
  download: { url: string; filename: string; label: string };
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(subscribeChecklist, { status: "idle" });
  const armed = useRef(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(SEEN_KEY)) return;
    } catch {
      return;
    }
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const arm = window.setTimeout(() => (armed.current = true), 8000);
    const onLeave = (e: MouseEvent) => {
      if (!armed.current || e.clientY > 0) return;
      setOpen(true);
      try {
        window.localStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
      document.removeEventListener("mouseout", onLeave);
    };
    document.addEventListener("mouseout", onLeave);
    return () => {
      window.clearTimeout(arm);
      document.removeEventListener("mouseout", onLeave);
    };
  }, []);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink-900/60 p-4 backdrop-blur-[6px]" role="dialog" aria-modal="true" aria-labelledby="exit-popup-title">
      <div className="relative w-full max-w-[520px] rounded-md bg-white p-6 text-ink shadow-[0_40px_90px_-30px_rgba(0,0,0,.5)]">
        <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="absolute right-3 top-3 grid size-9 place-items-center rounded-xs hover:bg-grey-100">
          <Icon name="close" className="size-4" />
        </button>
        <p className="mono mb-3 text-red">Checklist gratuito</p>
        <h2 id="exit-popup-title" className="text-card mb-5 font-display font-semibold">
          {body}
        </h2>
        {state.status === "success" ? (
          <div className="grid gap-4">
            <p className="text-[15px] text-grey-600">{success}</p>
            <a href={download.url} download={download.filename} className="inline-flex h-11 w-fit items-center gap-3 rounded-xs bg-red px-4 text-[15px] font-medium text-white hover:bg-ink">
              {download.label}
              <Icon name="download" className="size-4" />
            </a>
          </div>
        ) : (
          <form action={action} className="grid gap-3">
            <AntiSpamFields />
            <input type="hidden" name="source" value="exit-popup" />
            <label className="grid gap-1 text-[13px] font-medium">
              E-mail
              <input
                type="email"
                name="email"
                required
                placeholder={placeholder}
                defaultValue={state.values?.email}
                className={cn("h-12 rounded-xs px-3 text-[16px] hairline focus:outline-none focus:shadow-[inset_0_0_0_2px_var(--color-red)]")}
              />
            </label>
            {state.fieldErrors?.email && <p className="text-[13px] text-red-600">{state.fieldErrors.email}</p>}
            {state.message && <p className="text-[13px] text-red-600">{state.message}</p>}
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={pending} className="h-11 rounded-xs bg-red px-4 text-[15px] font-medium text-white hover:bg-ink disabled:opacity-60">
                {pending ? "Enviando..." : accept}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-xs px-4 text-[15px] hairline hover:bg-grey-100">
                {decline}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
