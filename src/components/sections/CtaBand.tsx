import type { ReactNode } from "react";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Label } from "@/components/ui/Label";
import { ThemeZone } from "./ThemeZone";
import { cn } from "@/lib/cn";

type Props = {
  eyebrow?: string;
  title?: string;
  body?: string;
  cta: string;
  href: string;
  /** Linha de apoio abaixo do botão (ex.: "Prefere conversar antes? Chame no WhatsApp"). */
  support?: ReactNode;
  /** Botão secundário (ex.: WhatsApp). */
  secondary?: { label: string; href: string; external?: boolean };
  /** Fica escuro até o fim da página (usar quando o rodapé vem logo depois). */
  untilEnd?: boolean;
  /** Tamanho do título: "beat" para frases curtas, "h3" para parágrafos-statement. */
  titleSize?: "beat" | "h2" | "h3";
  id?: string;
  className?: string;
};

const TITLE_SIZES = { beat: "text-beat max-w-[12em]", h2: "text-h2 max-w-[16em]", h3: "text-h3 max-w-[24em] font-medium" };

/** Faixa escura de chamada para ação, reutilizada pelas páginas internas. */
export function CtaBand({ eyebrow, title, body, cta, href, support, secondary, untilEnd = true, titleSize = "beat", id, className }: Props) {
  const titleId = id ? `${id}-title` : undefined;
  return (
    <ThemeZone theme="dark" untilEnd={untilEnd} id={id} labelledBy={titleId} className={cn("relative isolate overflow-hidden bg-ink-900 text-white", className)}>
      <div aria-hidden="true" className="pointer-events-none absolute -left-[10vw] bottom-[-20vw] size-[44vw] rounded-full bg-red/[.16] blur-[120px]" />
      <div aria-hidden="true" className="grid-bg pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(60%_60%_at_80%_50%,#000,transparent_75%)]" />
      <Container className="relative py-[clamp(80px,12vw,168px)]">
        <div className="grid gap-12 desk:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)] desk:items-end">
          <div className="grid gap-7">
            {eyebrow && (
              <Reveal y={16}>
                <Label index="→" text={eyebrow} />
              </Reveal>
            )}
            {title && <SplitHeading as="h2" id={titleId} text={title} mode={titleSize === "h3" ? "words" : "chars"} className={TITLE_SIZES[titleSize]} />}
            {body && (
              <Reveal y={24}>
                <p className="max-w-[58ch] text-intro text-grey-300">{body}</p>
              </Reveal>
            )}
          </div>
          <Reveal y={32} className="glass-panel is-on grid gap-4 p-6 sm:p-8">
            <Button href={href} size="lg" arrow className="w-full">
              {cta}
            </Button>
            {secondary && (
              <Button
                href={secondary.href}
                variant="outline"
                size="lg"
                className="w-full"
                target={secondary.external ? "_blank" : undefined}
                rel={secondary.external ? "noopener noreferrer" : undefined}
              >
                {secondary.label}
              </Button>
            )}
            {support && <div className="text-small text-grey-300">{support}</div>}
          </Reveal>
        </div>
      </Container>
    </ThemeZone>
  );
}
