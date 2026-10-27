import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Metadata padrão de página: título, descrição, canonical, Open Graph e Twitter. */
export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  noindex?: boolean;
  type?: "website" | "article";
}): Metadata {
  const url = `${SITE_URL}${input.path}`;
  const image = input.image ?? `${SITE_URL}/opengraph-image`;
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    robots: input.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: "HAIK Negócios",
      locale: "pt_BR",
      type: input.type ?? "website",
      images: [{ url: image, width: 1200, height: 630, alt: "HAIK Negócios" }],
    },
    twitter: { card: "summary_large_image", title: input.title, description: input.description, images: [image] },
  };
}

/** Serializa JSON-LD escapando `<` para uso seguro dentro de <script>. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />;
}
