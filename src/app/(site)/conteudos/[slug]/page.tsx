import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getContent } from "@/server/content";
import { getPublicPost } from "@/server/repos/public";
import { pageMetadata, breadcrumbLd, JsonLd, SITE_URL } from "@/lib/seo";
import { BRAND, MAIN_NAV, ROUTES } from "@/content/site";
import { Container, Prose, Section } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Label";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { PageSetup } from "@/components/sections/PageSetup";
import { FinalCta } from "@/components/sections/FinalCta";
import { MediaFigure } from "@/components/sections/primitives";
import { formatDate, isoDate } from "@/components/sections/format";

type Props = { params: Promise<{ slug: string }> };

const NAV_LABEL = MAIN_NAV.find((i) => i.href === ROUTES.conteudos)?.label ?? "Conteúdos";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicPost(slug);
  if (!post) return {};
  return pageMetadata({
    title: post.seoTitle || `${post.title} | HAIK Negócios`,
    description: post.seoDescription || post.excerpt,
    path: `${ROUTES.conteudos}/${post.slug}`,
    image: post.cover?.url,
    type: "article",
  });
}

export default async function ArtigoPage({ params }: Props) {
  const { slug } = await params;
  const [post, t] = await Promise.all([getPublicPost(slug), getContent("contents")]);
  if (!post) notFound();

  const path = `${ROUTES.conteudos}/${post.slug}`;
  const published = post.publishedAt ?? post.createdAt;
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || undefined,
    datePublished: isoDate(published),
    dateModified: isoDate(post.updatedAt),
    articleSection: post.category,
    image: post.cover ? [post.cover.url.startsWith("http") ? post.cover.url : `${SITE_URL}${post.cover.url}`] : undefined,
    mainEntityOfPage: `${SITE_URL}${path}`,
    author: { "@type": "Organization", name: BRAND.name, url: SITE_URL },
    publisher: { "@type": "Organization", name: BRAND.name, url: SITE_URL },
  };

  return (
    <>
      <PageSetup formation="drift" intensity={0.3} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Início", path: "/" },
          { name: NAV_LABEL, path: ROUTES.conteudos },
          { name: post.title, path },
        ])}
      />
      <JsonLd data={articleLd} />

      <article className="pb-[clamp(64px,10vw,140px)] pt-[calc(var(--header-h)+clamp(40px,7vw,96px))]">
        <Container className="grid gap-10">
          <header className="mx-auto grid w-full max-w-[860px] gap-6">
            <Reveal y={12}>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <TransitionLink href={`${ROUTES.conteudos}?categoria=${encodeURIComponent(post.category)}`} className="inline-flex">
                  <Tag>{post.category}</Tag>
                </TransitionLink>
                {published && (
                  <time dateTime={isoDate(published)} className="mono text-grey-500">
                    {formatDate(published)}
                  </time>
                )}
              </p>
            </Reveal>
            <SplitHeading as="h1" text={post.title} immediate mode="words" className="text-h2 max-w-[16em]" />
            {post.excerpt && (
              <Reveal y={20} delay={0.3}>
                <p className="max-w-[60ch] text-intro text-[var(--fg-muted)]">{post.excerpt}</p>
              </Reveal>
            )}
          </header>

          {post.cover && (
            <Reveal y={32} className="mx-auto w-full max-w-[1100px]">
              <MediaFigure media={post.cover} sizes="(min-width: 1150px) 1100px, 100vw" priority className="aspect-[16/9] shadow-[var(--shadow-card-light)]" />
            </Reveal>
          )}

          <Reveal y={24} className="mx-auto w-full max-w-[860px]">
            <Prose className="mx-auto [&_h2:first-child]:mt-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
            </Prose>
          </Reveal>

          <Reveal className="mx-auto w-full max-w-[860px]">
            <aside className="chapter--dark relative isolate flex flex-col gap-6 overflow-hidden rounded-md bg-ink-900 p-6 text-white sm:p-8 desk:flex-row desk:items-center desk:justify-between">
              <div aria-hidden="true" className="grid-bg absolute inset-0 opacity-40 [mask-image:linear-gradient(90deg,transparent,#000)]" />
              <p className="relative max-w-[40ch] font-display text-[20px] font-medium leading-[1.4] tracking-[-.01em]">{t.articleBox.body}</p>
              <Button href={ROUTES.diagnostico} arrow size="lg" className="relative w-full sm:w-fit">
                {t.articleBox.cta}
              </Button>
            </aside>
          </Reveal>
        </Container>
      </article>

      <Section className="pt-0">
        <Container>
          <TransitionLink href={ROUTES.conteudos} className="mono inline-flex items-center gap-2 text-[var(--fg-muted)] hover:text-red">
            ← {NAV_LABEL}
          </TransitionLink>
        </Container>
      </Section>

      <FinalCta eyebrow={NAV_LABEL} />
    </>
  );
}
