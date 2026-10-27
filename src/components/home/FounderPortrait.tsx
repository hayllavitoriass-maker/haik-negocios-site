import Image from "next/image";
import type { PublicMedia } from "@/server/media/url";
import { cn } from "@/lib/cn";

/**
 * Retrato de fundador: usa a foto real enviada pelo painel quando existir.
 * Sem foto, mostra uma composição de marca (iniciais + tile vermelho), nunca um retrato inventado.
 */
export function FounderPortrait({
  media,
  name,
  className,
  sizes = "(max-width: 900px) 100vw, 420px",
  priority,
}: {
  media?: PublicMedia | null;
  name: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className={cn("relative aspect-[4/5] w-full overflow-hidden rounded-md bg-ink-900", className)}>
      {media ? (
        <Image
          src={media.url}
          alt={media.alt || name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          style={{ objectPosition: `${media.focalX * 100}% ${media.focalY * 100}%` }}
        />
      ) : (
        <div className="absolute inset-0 grid-bg grid place-items-center" aria-label={`Espaço reservado para a foto de ${name}`} role="img">
          <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_100%,rgba(234,25,35,.45),transparent_70%)]" />
          <span className="font-display text-[clamp(56px,10vw,120px)] font-bold tracking-[-.05em] text-white/90">{initials}</span>
          <span className="absolute left-4 top-4 size-10 rounded-xs bg-red shadow-[var(--shadow-tile)]" aria-hidden="true" />
          <span className="mono absolute bottom-4 left-4 text-white/60">foto em breve</span>
        </div>
      )}
    </div>
  );
}
