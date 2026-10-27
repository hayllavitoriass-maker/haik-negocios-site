import { cn } from "@/lib/cn";

/**
 * Logotipo HAIK em SVG (vetor autoral baseado no logo oficial): letras pretas/brancas com
 * os detalhes em vermelho (ligação do H, ponto do A e braço superior do K).
 * `ink` segue a cor do texto corrente; o vermelho é fixo da marca.
 */
export function BrandLogo({ className, withTagline = false, title = "HAIK Negócios" }: { className?: string; withTagline?: boolean; title?: string }) {
  return (
    <svg
      className={cn("h-7 w-auto", className)}
      viewBox={withTagline ? "0 0 300 118" : "0 0 300 80"}
      role="img"
      aria-label={title}
      fill="none"
    >
      <title>{title}</title>
      {/* H */}
      <rect x="4" y="2" width="20" height="76" rx="7" fill="currentColor" />
      <rect x="68" y="2" width="20" height="76" rx="7" fill="currentColor" />
      <path d="M24 30h22c12 0 18 6 22 14l10 18h-18l-8-14c-2-3-4-4-7-4H24z" fill="#EA1923" />
      {/* A */}
      <path d="M126 2h20l34 76h-22l-5-12h-34l-5 12H92z M136 50h22l-11-27z" fill="currentColor" fillRule="evenodd" />
      <circle cx="136" cy="62" r="7" fill="#EA1923" />
      {/* I */}
      <rect x="190" y="2" width="20" height="76" rx="7" fill="currentColor" />
      {/* K */}
      <rect x="222" y="2" width="20" height="76" rx="7" fill="currentColor" />
      <path d="M242 44l24 34h30l-30-40z" fill="currentColor" />
      <path d="M242 38l26-36h30l-30 36z" fill="#EA1923" />
      {withTagline && (
        <text x="150" y="108" textAnchor="middle" fontFamily="var(--font-display), sans-serif" fontSize="22" letterSpacing="6" fill="currentColor">
          negócios
        </text>
      )}
    </svg>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={cn("size-8", className)} viewBox="0 0 64 64" role="img" aria-label="HAIK" fill="none">
      <rect width="64" height="64" rx="4" fill="#EA1923" />
      <rect x="12" y="14" width="9" height="36" rx="3" fill="#fff" />
      <rect x="43" y="14" width="9" height="36" rx="3" fill="#fff" />
      <path d="M21 28h10c6 0 9 3 11 7l5 10h-9l-4-7c-1-2-2-2-4-2H21z" fill="#171717" />
    </svg>
  );
}
