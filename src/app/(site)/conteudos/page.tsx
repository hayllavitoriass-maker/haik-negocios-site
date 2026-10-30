import type { Metadata } from "next";
import { getContent, getMediaSlots } from "@/server/content";
import { listPublicPosts } from "@/server/repos/public";
import { pageMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";
import { MAIN_NAV, ROUTES } from "@/content/site";
import { Container, Section } from "@/components/ui/Container";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger } from "@/components/sections/Stagger";
import { ChecklistForm } from "@/components/forms/ChecklistForm";
import { DEFAULT_CHECKLIST_FILE } from "@/content/checklist";
import { PageHero } from "@/components/sections/PageHero";
import { PageSetup } from "@/components/sections/PageSetup";
import { FinalCta } from "@/components/sections/FinalCta";
import { PostCard } from "@/components/sections/Cards";
import { cn } from "@/lib/cn";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getContent("seo");
  return pageMetadata({ ...seo.conteudos, path: ROUTES.conteudos });
}

const NAV_LABEL = MAIN_NAV.find((i) => i.href === ROUTES.conteudos)?.label ?? "Conteúdos";

type Props = { searchParams: Promise<{ categoria?: string | string[] }> };

export default async function ConteudosPage({ searchParams }: Props) {
  const [{ categoria }, t, copy, slots] = await Promise.all([searchParams, getContent("contents"), getContent("microcopy"), getMediaSlots()]);
  const checklistFile = slots["checklist.pdf"] ?? DEFAULT_CHECKLIST_FILE;
  const requested = Array.isArray(categoria) ? categoria[0] : categoria;
  const category = requested && t.categories.includes(requested) ? requested : undefined;
  const posts = await listPublicPosts(category);

  const chip = "inline-flex h-10 items-center rounded-xs px-3.5 text-[14px] font-medium transition-colors";

  return (
    <>
      <PageSetup formation="drift" />
      <JsonLd data={breadcrumbLd([{ name: "Início", path: "/" }, { name: NAV_LABEL, path: ROUTES.conteudos }])} />

      <PageHero eyebrow={{ text: NAV_LABEL }} title={t.title} intro={t.subtitle} size="beat" />

      <Section id="artigos">
        <Container className="grid gap-10">
          <Reveal as="nav" y={16} className="-mx-[var(--gutter)] overflow-x-auto px-[var(--gutter)] [scrollbar-width:none]">
            <ul className="flex w-max gap-2 pb-1">
              <li>
                <TransitionLink href={ROUTES.conteudos} aria-current={!category ? "page" : undefined} className={cn(chip, !category ? "bg-[var(--fg)] text-[var(--bg)]" : "bg-[var(--bg)]/70 hairline hover:bg-[var(--fg)] hover:text-[var(--bg)]")}>
                  Todos
                </TransitionLink>
              </li>
              {t.categories.map((c) => {
                const active = c === category;
                return (
                  <li key={c}>
                    <TransitionLink
                      href={`${ROUTES.conteudos}?categoria=${encodeURIComponent(c)}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(chip, active ? "bg-red text-white" : "bg-[var(--bg)]/70 hairline hover:bg-[var(--fg)] hover:text-[var(--bg)]")}
                    >
                      {c}
                    </TransitionLink>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          {posts.length > 0 ? (
            <Stagger as="ul" stagger={0.1} className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} readCta={t.readCta} />
              ))}
            </Stagger>
          ) : (
            <Reveal>
              <div role="status" className="grid gap-4 rounded-md bg-white p-6 text-ink shadow-[var(--shadow-card-light)] hairline-light sm:p-10">
                <span className="mono text-red">{NAV_LABEL}</span>
                <h2 className="text-h3 max-w-[18em]">{t.emptyTitle}</h2>
                <p className="max-w-[60ch] text-[16px] leading-[1.65] text-grey-600">{t.emptyBody}</p>
              </div>
            </Reveal>
          )}
        </Container>
      </Section>

      <Section id="checklist" className="pt-0">
        <Container>
          <Reveal>
            <ChecklistForm content={t.capture} source="conteudos" sending={copy.sending} download={checklistFile} />
          </Reveal>
        </Container>
      </Section>

      <FinalCta eyebrow={NAV_LABEL} />
    </>
  );
}
