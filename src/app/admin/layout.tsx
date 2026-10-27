import type { Metadata } from "next";

/**
 * Layout raiz do painel: sem header do site, sem 3D, sem animações.
 * Nunca indexado (metadata + X-Robots-Tag em next.config).
 */
export const metadata: Metadata = {
  title: { default: "Painel HAIK", template: "%s · Painel HAIK" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-grey-50 font-sans text-ink antialiased" data-theme="light">
      {children}
    </div>
  );
}
