import { cn } from "@/lib/cn";

/**
 * Ícones de interface (traço 1.75, estilo minimalista, autorais).
 * Também servem de referência 2D para os ícones 3D da cena.
 */
type IconProps = { className?: string; strokeWidth?: number };

function Svg({ className, strokeWidth = 1.75, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={cn("size-5", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const Icons = {
  arrow: (p: IconProps) => (
    <Svg {...p}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Svg>
  ),
  plus: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  ),
  close: (p: IconProps) => (
    <Svg {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Svg>
  ),
  menu: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4 8h16M4 16h16" />
    </Svg>
  ),
  whatsapp: (p: IconProps) => (
    <svg className={cn("size-5", p.className)} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 1 1-4.2 15.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8Zm-3.3 4.3c-.2 0-.5 0-.8.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.4 2.5 1 3 .8 3.5.7.5-.1 1.7-.7 2-1.4.2-.7.2-1.2.1-1.4l-.5-.3-1.9-.9c-.3-.1-.4-.1-.6.1l-.9 1.1c-.2.2-.3.2-.6.1a7 7 0 0 1-3.4-3c-.3-.4 0-.5.2-.7l.6-.8.1-.5-.9-2c-.2-.5-.4-.4-.6-.4h-.5Z" />
    </svg>
  ),
  instagram: (p: IconProps) => (
    <Svg {...p}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  ),
  mail: (p: IconProps) => (
    <Svg {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </Svg>
  ),
  check: (p: IconProps) => (
    <Svg {...p}>
      <path d="m5 12 4 4L19 6" />
    </Svg>
  ),
  // Ícones temáticos (também espelhados em 3D)
  megaphone: (p: IconProps) => (
    <Svg {...p}>
      <path d="M3 10v4a1 1 0 0 0 1 1h3l8 4V5L7 9H4a1 1 0 0 0-1 1Z" />
      <path d="M18 9a3 3 0 0 1 0 6" />
      <path d="M7 15v4a1 1 0 0 0 1 1h1" />
    </Svg>
  ),
  chart: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="m7 14 4-4 3 3 6-6" />
      <path d="M16 7h4v4" />
    </Svg>
  ),
  target: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </Svg>
  ),
  chat: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4 5h16v11H9l-5 4V5Z" />
    </Svg>
  ),
  hashtag: (p: IconProps) => (
    <Svg {...p}>
      <path d="M9 4 7 20M17 4l-2 16M4 9h17M3 15h17" />
    </Svg>
  ),
  heart: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
    </Svg>
  ),
  at: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1" />
    </Svg>
  ),
  braces: (p: IconProps) => (
    <Svg {...p}>
      <path d="M8 4H7a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1" />
      <path d="M16 4h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-1" />
    </Svg>
  ),
  code: (p: IconProps) => (
    <Svg {...p}>
      <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
    </Svg>
  ),
  terminal: (p: IconProps) => (
    <Svg {...p}>
      <path d="m5 7 5 5-5 5M12 17h7" />
    </Svg>
  ),
  chip: (p: IconProps) => (
    <Svg {...p}>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" />
    </Svg>
  ),
  cube: (p: IconProps) => (
    <Svg {...p}>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" />
    </Svg>
  ),
  gear: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </Svg>
  ),
  arrows: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4 7h12l-3-3M20 17H8l3 3" />
    </Svg>
  ),
  network: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="5" cy="12" r="2" />
      <circle cx="19" cy="6" r="2" />
      <circle cx="19" cy="18" r="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M7 12h3M14 11l3-4M14 13l3 4" />
    </Svg>
  ),
  spark: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
    </Svg>
  ),
  cursor: (p: IconProps) => (
    <Svg {...p}>
      <path d="m5 4 14 7-6 2-2 6L5 4Z" />
    </Svg>
  ),
  vector: (p: IconProps) => (
    <Svg {...p}>
      <path d="M5 19C5 10 10 5 19 5" />
      <rect x="3" y="17" width="4" height="4" />
      <rect x="17" y="3" width="4" height="4" />
      <path d="M9 9h6v6H9z" />
    </Svg>
  ),
  grid: (p: IconProps) => (
    <Svg {...p}>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </Svg>
  ),
  browser: (p: IconProps) => (
    <Svg {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M7 6.5h.01M10 6.5h.01" />
    </Svg>
  ),
  layout: (p: IconProps) => (
    <Svg {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M10 10v10" />
    </Svg>
  ),
  bars: (p: IconProps) => (
    <Svg {...p}>
      <path d="M5 20v-6M12 20V8M19 20V4" />
    </Svg>
  ),
  calendar: (p: IconProps) => (
    <Svg {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Svg>
  ),
  shield: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </Svg>
  ),
  eye: (p: IconProps) => (
    <Svg {...p}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  ),
  clock: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  ),
  download: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 4v11M7 10l5 5 5-5M4 20h16" />
    </Svg>
  ),
};

export type IconName = keyof typeof Icons;
export function Icon({ name, className, strokeWidth }: { name: IconName; className?: string; strokeWidth?: number }) {
  const C = Icons[name];
  return <C className={className} strokeWidth={strokeWidth} />;
}

/** Tile de ícone (2D) usado em cards e linhas de capacidade. */
export function IconTile({ name, size = 64, tone = "red", className }: { name: IconName; size?: number; tone?: "red" | "white" | "ink"; className?: string }) {
  const tones = {
    red: "bg-red text-white shadow-[var(--shadow-tile)]",
    white: "bg-white text-red",
    ink: "bg-ink text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.16)]",
  };
  return (
    <span className={cn("inline-grid shrink-0 place-items-center rounded-xs", tones[tone], className)} style={{ width: size, height: size }}>
      <Icon name={name} className="size-[42%]" />
    </span>
  );
}
