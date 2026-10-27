import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/content/site";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "HAIK Negócios | Marketing e Tecnologia", template: "%s" },
  description:
    "Marketing que pensa. Tecnologia que executa. Sites, sistemas, automações e marketing sob medida. Peça seu diagnóstico gratuito.",
  applicationName: BRAND.name,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fefefe",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${geistSans.variable} ${geistMono.variable}`} data-theme="light">
      <body>{children}</body>
    </html>
  );
}
