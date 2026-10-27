import Image from "next/image";
import type { PublicTestimonial } from "@/server/repos/public";

/** Depoimentos reais e autorizados (só aparecem quando existem no painel). */
export function TestimonialRail({ items }: { items: PublicTestimonial[] }) {
  return (
    <ul className="grid w-full max-w-[1000px] gap-4 desk:grid-cols-3">
      {items.slice(0, 3).map((t) => (
        <li key={t.id} className="grid content-start gap-4 rounded-md bg-white p-5 text-left shadow-[var(--shadow-card-light)]">
          <p className="text-[16px] leading-[1.6] text-ink">“{t.quote}”</p>
          <div className="flex items-center gap-3">
            {t.photo ? (
              <Image src={t.photo.url} alt={t.photo.alt || t.name} width={44} height={44} className="size-11 rounded-full object-cover" />
            ) : (
              <span className="grid size-11 place-items-center rounded-full bg-red font-display font-bold text-white">{t.name[0]}</span>
            )}
            <div className="grid">
              <span className="text-[14px] font-medium">{t.name}</span>
              <span className="text-[12px] text-grey-500">{[t.company, t.city].filter(Boolean).join(" · ")}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
