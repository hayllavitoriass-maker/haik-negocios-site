import { cn } from "@/lib/cn";

/**
 * Rótulo "chip duplo": índice em vermelho + texto. Em capítulos claros o texto
 * inverte para fundo preto; em escuros, fundo branco.
 */
export function Label({ index, text, className }: { index?: string; text: string; className?: string }) {
  return (
    <span className={cn("mono inline-flex gap-[3px] leading-none", className)}>
      {index && (
        <span className="inline-flex items-center rounded-xs bg-red px-[9px] pt-[7px] pb-[6px] text-white">{index}</span>
      )}
      <span className="inline-flex items-center rounded-xs bg-[var(--fg)] px-[9px] pt-[7px] pb-[6px] text-[var(--bg)]">
        {text}
      </span>
    </span>
  );
}

export function Tag({ children, tone = "red", className }: { children: React.ReactNode; tone?: "red" | "grey" | "line"; className?: string }) {
  const tones = {
    red: "bg-red/10 text-red-700 dark-chapter:text-red-300",
    grey: "bg-grey-200 text-grey-600",
    line: "shadow-[inset_0_0_0_1px_currentColor]",
  };
  return <span className={cn("mono inline-flex items-center rounded-xs px-2 py-[6px]", tones[tone], className)}>{children}</span>;
}
