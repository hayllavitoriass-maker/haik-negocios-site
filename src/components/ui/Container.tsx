import { cn } from "@/lib/cn";

export function Container({ children, className, as: Tag = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "section" | "header" | "footer" | "nav" | "article" }) {
  return <Tag className={cn("container-haik", className)}>{children}</Tag>;
}

/** Seção padrão de páginas internas: respiro vertical consistente. */
export function Section({
  children,
  className,
  id,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  tone?: "default" | "dark" | "muted" | "red";
}) {
  const tones = {
    default: "",
    dark: "chapter--dark bg-ink-900 text-white",
    muted: "bg-grey-50",
    red: "bg-red text-white",
  };
  return (
    <section id={id} className={cn("relative py-[clamp(64px,10vw,140px)]", tones[tone], className)}>
      {children}
    </section>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mono text-red", className)}>{children}</p>;
}

export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-[64ch] text-[17px] leading-[1.7] text-[var(--fg)] [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-h3 [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-card [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_a]:text-red [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-red [&_blockquote]:pl-4 [&_blockquote]:text-grey-500 [&_code]:rounded-xs [&_code]:bg-grey-100 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[.9em] [&_img]:rounded-md",
        className,
      )}
    >
      {children}
    </div>
  );
}
