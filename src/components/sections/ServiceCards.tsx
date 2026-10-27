import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Label";
import { IconTile, type IconName } from "@/components/ui/icons";
import type { servicesOverviewContent } from "@/content/pages/services";
import { Stagger } from "./Stagger";

export const SERVICE_ICONS: Record<string, IconName> = {
  sites: "browser",
  sistemas: "layout",
  "automacoes-e-ia": "gear",
  marketing: "megaphone",
};

type Card = (typeof servicesOverviewContent)["cards"][number];

/** Quatro "feature cards" premium da visão geral de serviços. */
export function ServiceCards({ cards, tags }: { cards: readonly Card[]; tags: Record<string, readonly string[]> }) {
  return (
    <Stagger as="ul" stagger={0.12} className="grid gap-5 md:grid-cols-2">
      {cards.map((card, i) => (
        <li key={card.slug} className="group relative flex flex-col overflow-hidden rounded-md bg-white text-ink shadow-[var(--shadow-card-light)] hairline-light">
          <div className="grid-bg relative flex h-[200px] items-center justify-center overflow-hidden bg-grey-50 [mask-image:linear-gradient(#000_70%,transparent)]">
            <span className="mono absolute left-5 top-5 inline-flex items-center rounded-xs bg-ink px-[7px] pt-[6px] pb-[5px] text-white">
              {String(i + 1).padStart(2, "0")}
            </span>
            <IconTile
              name={SERVICE_ICONS[card.slug] ?? "cube"}
              size={88}
              className="transition-transform duration-700 ease-[var(--ease-out)] group-hover:-translate-y-1 group-hover:rotate-[-4deg]"
            />
          </div>
          <div className="flex flex-1 flex-col gap-5 p-6 sm:p-8">
            <h3 className="text-card">{card.title}</h3>
            <p className="text-[16px] leading-[1.6] text-ink">{card.body}</p>
            <p className="text-[15px] leading-[1.6] text-grey-500">{card.extra}</p>
            {tags[card.slug]?.length ? (
              <ul className="flex flex-wrap gap-1.5" aria-label="Destaques">
                {tags[card.slug].map((tag) => (
                  <li key={tag}>
                    <Tag tone="line" className="text-grey-600">
                      {tag}
                    </Tag>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-auto pt-2">
              <Button href={`/servicos/${card.slug}`} variant="link" arrow className="text-[15px] font-medium">
                {card.cta}
              </Button>
            </div>
          </div>
        </li>
      ))}
    </Stagger>
  );
}
