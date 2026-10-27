"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export type FaqItem = { q: string; a: string };

/** Acordeão acessível (botão + região) com transição suave de altura. */
export function Faq({ items, className, title, id }: { items: FaqItem[]; className?: string; title?: string; id?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className={cn("w-full", className)} id={id}>
      {title && <h2 className="text-h2 mb-8">{title}</h2>}
      <ul className="divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
        {items.map((item, i) => {
          const isOpen = open === i;
          const panelId = `${id ?? "faq"}-panel-${i}`;
          return (
            <li key={item.q}>
              <h3 className="font-sans text-[17px] font-medium">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-6 py-5 text-left transition-colors hover:text-red"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{item.q}</span>
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-xs hairline transition-transform duration-500 ease-[var(--ease-out)]",
                      isOpen && "rotate-45 bg-red text-white shadow-none",
                    )}
                    aria-hidden="true"
                  >
                    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                className={cn("grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out)]", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
              >
                <div className="overflow-hidden">
                  <p className="max-w-[62ch] pb-6 text-[16px] leading-[1.6] text-[var(--fg-muted)]">{item.a}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
