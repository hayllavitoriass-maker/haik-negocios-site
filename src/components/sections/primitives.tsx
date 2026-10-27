import Image from "next/image";
import type { ReactNode } from "react";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "./Stagger";
import { Eyebrow } from "@/components/ui/Container";
import { Icon, type IconName } from "@/components/ui/icons";
import type { PublicMedia } from "@/server/media/url";
import { cn } from "@/lib/cn";

/** Cabeçalho de seção: olho em mono vermelho, título por caractere e introdução. */
export function SectionHead({
  eyebrow,
  title,
  highlight,
  intro,
  as = "h2",
  id,
  size = "h2",
  className,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  intro?: string;
  as?: "h1" | "h2" | "h3";
  id?: string;
  size?: "h2" | "h3" | "beat";
  className?: string;
  align?: "left" | "center";
}) {
  const sizes = { h2: "text-h2 max-w-[14em]", h3: "text-h3 max-w-[18em]", beat: "text-beat max-w-[12em]" };
  return (
    <div className={cn("grid gap-5", align === "center" && "justify-items-center text-center", className)}>
      {eyebrow && (
        <Reveal y={12}>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
      )}
      <SplitHeading as={as} id={id} text={title} highlight={highlight} className={cn(sizes[size], align === "center" && "mx-auto")} />
      {intro && (
        <Reveal y={20}>
          <p className={cn("max-w-[60ch] text-intro text-[var(--fg-muted)]", align === "center" && "mx-auto")}>{intro}</p>
        </Reveal>
      )}
    </div>
  );
}

/** Lista de entregas com check vermelho, entrada em cascata. */
export function CheckList({ items, className, columns = 1 }: { items: string[]; className?: string; columns?: 1 | 2 }) {
  return (
    <Stagger as="ul" stagger={0.07} className={cn("grid gap-3", columns === 2 && "md:grid-cols-2", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 rounded-xs bg-[var(--bg)]/70 p-4 hairline">
          <span className="mt-[2px] grid size-5 shrink-0 place-items-center rounded-xs bg-red text-white" aria-hidden="true">
            <Icon name="check" className="size-3" strokeWidth={2.5} />
          </span>
          <span className="text-[16px] leading-[1.55]">{item}</span>
        </li>
      ))}
    </Stagger>
  );
}

/** Passos numerados (01, 02...) com linha fina entre eles. */
export function NumberedSteps({ items, className, tone = "default" }: { items: string[]; className?: string; tone?: "default" | "dark" }) {
  return (
    <Stagger as="ol" stagger={0.1} className={cn("grid", className)}>
      {items.map((item, i) => (
        <li
          key={item}
          className={cn(
            "grid grid-cols-[44px_1fr] items-start gap-4 border-t py-5 first:border-t-0 first:pt-0 last:pb-0",
            tone === "dark" ? "border-white/10" : "border-[var(--hairline)]",
          )}
        >
          <span className="mono inline-flex h-7 w-11 items-center justify-center rounded-xs bg-red text-[12px] text-white">{String(i + 1).padStart(2, "0")}</span>
          <span className="text-[16px] leading-[1.55] desk:text-[17px]">{item}</span>
        </li>
      ))}
    </Stagger>
  );
}

/**
 * Placeholder de marca para fotos ainda não enviadas pelo painel: painel escuro com grade,
 * iniciais em Sora e um tile vermelho. Nunca uma foto de banco de imagens.
 */
export function BrandPlaceholder({
  label,
  initials,
  icon = "spark",
  className,
}: {
  label: string;
  initials?: string;
  icon?: IconName;
  className?: string;
}) {
  return (
    <div role="img" aria-label={label} className={cn("relative isolate overflow-hidden rounded-md bg-ink-900 text-white", className)}>
      <div aria-hidden="true" className="grid-bg absolute inset-0 opacity-60 [mask-image:linear-gradient(#000,transparent_90%)]" />
      <div aria-hidden="true" className="absolute inset-0 flex items-end justify-between p-5">
        <span className="font-display text-[clamp(56px,10vw,120px)] font-bold leading-none tracking-[-.05em] text-white/90">{initials}</span>
        <span className="grid size-11 place-items-center rounded-xs bg-red text-white shadow-[var(--shadow-tile)]">
          <Icon name={icon} className="size-5" />
        </span>
      </div>
    </div>
  );
}

/** Imagem de mídia do painel com next/image, foco respeitado e alt do cadastro. */
export function MediaFigure({
  media,
  sizes,
  className,
  priority,
  fill = true,
  caption,
}: {
  media: PublicMedia;
  sizes: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  caption?: string;
}) {
  const position = `${Math.round(media.focalX * 100)}% ${Math.round(media.focalY * 100)}%`;
  return (
    <figure className={cn("relative overflow-hidden rounded-md bg-grey-100", className)}>
      {fill ? (
        <Image src={media.url} alt={media.alt} fill sizes={sizes} priority={priority} className="object-cover" style={{ objectPosition: position }} />
      ) : (
        <Image
          src={media.url}
          alt={media.alt}
          width={media.width ?? 1600}
          height={media.height ?? 1000}
          sizes={sizes}
          priority={priority}
          className="h-auto w-full"
        />
      )}
      {caption && <figcaption className="mono absolute bottom-3 left-3 rounded-xs bg-ink/80 px-2 py-1.5 text-white">{caption}</figcaption>}
    </figure>
  );
}

/** Frase do cliente em formato de citação (dores dos nichos, falas da Home). */
export function QuoteCard({ text, index, className }: { text: string; index?: number; className?: string }) {
  return (
    <li className={cn("relative grid gap-4 rounded-md bg-white p-6 shadow-[var(--shadow-card-light)] hairline-light", className)}>
      <span aria-hidden="true" className="font-display text-[44px] font-bold leading-[.6] text-red">
        “
      </span>
      <p className="text-[17px] leading-[1.5] text-ink">{text}</p>
      {typeof index === "number" && <span className="mono text-grey-400">{String(index + 1).padStart(2, "0")}</span>}
    </li>
  );
}

/** Caixa de aviso (minuta jurídica, pendências) com borda vermelha. */
export function Notice({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <div role="note" className={cn("grid gap-2 rounded-xs border-l-[3px] border-red bg-red-50 px-5 py-4 text-ink", className)}>
      {title && <p className="mono text-red">{title}</p>}
      <div className="text-[15px] leading-[1.6]">{children}</div>
    </div>
  );
}
