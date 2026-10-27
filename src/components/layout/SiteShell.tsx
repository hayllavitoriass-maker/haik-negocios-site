"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { ChapterProvider } from "@/components/motion/ChapterProvider";
import { PixelTransitionProvider } from "@/components/motion/PixelTransition";
import { Header } from "./Header";
import { ChapterDots, ChapterIndicator, MobileBar, MotionToggle, WhatsAppFab } from "./FixedUi";
import { CookieConsent } from "./CookieConsent";
import { ExitPopup } from "./ExitPopup";
import { PreviewBar } from "./PreviewBar";
import type { microcopy } from "@/content/pages/misc";

// A cena WebGL só existe no cliente e é carregada depois do conteúdo (não bloqueia o LCP).
const Stage = dynamic(() => import("@/components/three/Stage").then((m) => m.Stage), { ssr: false });

/** Monta a cena só depois do load e de um momento ocioso: o texto e o LCP vêm primeiro. */
function DeferredStage() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const go = () => {
      if (cancelled) return;
      const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      if (idle) idle(() => !cancelled && setReady(true), { timeout: 1500 });
      else window.setTimeout(() => !cancelled && setReady(true), 400);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", go);
    };
  }, []);
  return ready ? <Stage /> : null;
}

type Props = {
  children: ReactNode;
  whatsappHref: string;
  copy: typeof microcopy;
  cookieBanner: boolean;
  exitPopup?: { placeholder: string; success: string } | null;
  preview?: boolean;
};

/** Casca do site público: provedores de motion, header, UI fixa e a cena 3D persistente. */
export function SiteShell({ children, whatsappHref, copy, cookieBanner, exitPopup, preview }: Props) {
  return (
    <MotionProvider>
      <ChapterProvider defaultTheme="light">
        <PixelTransitionProvider>
          <a href="#conteudo" className="visually-hidden focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xs focus:bg-red focus:px-4 focus:py-2 focus:text-white">
            Pular para o conteúdo
          </a>
          <DeferredStage />
          <Header />
          <main id="conteudo" className="relative z-[1] pb-[var(--mobile-bar-h)] desk:pb-0">
            {children}
          </main>
          <ChapterIndicator />
          <ChapterDots />
          <MotionToggle />
          <WhatsAppFab href={whatsappHref} tooltip={copy.whatsappTooltip} />
          <MobileBar whatsappHref={whatsappHref} label={copy.mobileBar} />
          {cookieBanner && <CookieConsent body={copy.cookie.body} accept={copy.cookie.accept} decline={copy.cookie.decline} more={copy.cookie.more} />}
          {exitPopup && (
            <ExitPopup body={copy.exitPopup.body} accept={copy.exitPopup.accept} decline={copy.exitPopup.decline} placeholder={exitPopup.placeholder} success={exitPopup.success} />
          )}
          {preview && <PreviewBar />}
        </PixelTransitionProvider>
      </ChapterProvider>
    </MotionProvider>
  );
}
