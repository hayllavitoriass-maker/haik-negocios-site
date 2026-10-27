"use client";

import type { ReactNode } from "react";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { Label } from "@/components/ui/Label";
import { ThemeZone } from "./ThemeZone";
import { cn } from "@/lib/cn";

type Props = {
  /** Chip de abertura (ex.: índice "01" + "Serviço"). */
  eyebrow?: { index?: string; text: string };
  title: string;
  highlight?: string;
  intro?: string;
  actions?: ReactNode;
  /** Conteúdo lateral (imagem, meta) exibido à direita no desktop. */
  aside?: ReactNode;
  /** "hero" para títulos curtos, "beat" para títulos longos. */
  size?: "hero" | "beat";
  className?: string;
  children?: ReactNode;
};

/**
 * Hero escuro reutilizável das páginas internas: chip, título por caractere, intro e ações.
 * Enquanto está sob o header, o documento fica em tema escuro (header branco).
 */
export function PageHero({ eyebrow, title, highlight, intro, actions, aside, size = "hero", className, children }: Props) {
  return (
    <ThemeZone theme="dark" className={cn("relative isolate overflow-hidden bg-ink-900 text-white", className)}>
      <div
        aria-hidden="true"
        className="grid-bg pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(70%_60%_at_30%_20%,#000,transparent_75%)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute -right-[12vw] -top-[18vw] size-[46vw] rounded-full bg-red/[.14] blur-[120px]" />
      <Container className="relative pb-[clamp(56px,8vw,112px)] pt-[calc(var(--header-h)+clamp(48px,8vw,112px))]">
        <div className={cn("grid gap-10 desk:gap-16", aside ? "desk:grid-cols-[minmax(0,1.25fr)_minmax(0,.75fr)] desk:items-end" : undefined)}>
          <div className="grid content-start gap-7">
            {eyebrow && (
              <Reveal y={16}>
                <Label index={eyebrow.index} text={eyebrow.text} />
              </Reveal>
            )}
            <SplitHeading
              as="h1"
              text={title}
              highlight={highlight}
              immediate
              delay={0.15}
              className={cn(size === "hero" ? "text-hero" : "text-beat", "max-w-[13em] text-balance")}
            />
            {intro && (
              <Reveal y={24} delay={0.5}>
                <p className="max-w-[58ch] text-intro text-grey-300">{intro}</p>
              </Reveal>
            )}
            {actions && (
              <Reveal y={20} delay={0.65} className="flex flex-wrap items-center gap-3 pt-2">
                {actions}
              </Reveal>
            )}
            {children}
          </div>
          {aside && (
            <Reveal y={32} delay={0.4} className="min-w-0">
              {aside}
            </Reveal>
          )}
        </div>
      </Container>
    </ThemeZone>
  );
}
