import { TransitionLink } from "@/components/motion/TransitionLink";
import { ArrowIcon } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Label";
import type { projectsContent } from "@/content/pages/misc";
import type { PublicPost, PublicProject } from "@/server/repos/public";
import { BrandPlaceholder, MediaFigure } from "./primitives";
import { formatDate, initialsOf, isoDate } from "./format";
import { cn } from "@/lib/cn";

type Labels = (typeof projectsContent)["labels"];

/** Card cinematográfico de projeto: capa (ou placeholder de marca), teaser e link. */
export function ProjectCard({
  project,
  labels,
  demoBadge,
  viewCta,
  priority,
}: {
  project: PublicProject;
  labels: Labels;
  demoBadge: string;
  viewCta: string;
  priority?: boolean;
}) {
  const href = `/projetos/${project.slug}`;
  const teaser = [
    { label: labels.scenario, text: project.scenario },
    { label: labels.bottleneck, text: project.bottleneck },
    { label: labels.solution, text: project.solution },
  ].filter((t) => t.text);

  return (
    <li className="group relative grid overflow-hidden rounded-md bg-white text-ink shadow-[var(--shadow-card-light)] hairline-light md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[360px]">
        {project.cover ? (
          <MediaFigure
            media={project.cover}
            sizes="(min-width: 768px) 50vw, 100vw"
            priority={priority}
            className="absolute inset-0 rounded-none transition-transform duration-[1200ms] ease-[var(--ease-out)] group-hover:scale-[1.03]"
          />
        ) : (
          <BrandPlaceholder label={project.title} initials={initialsOf(project.client ?? project.title)} icon="cube" className="absolute inset-0 rounded-none" />
        )}
        {project.isDemo && <span className="mono absolute left-4 top-4 rounded-xs bg-red px-2 py-1.5 text-white">{demoBadge}</span>}
      </div>
      <div className="grid content-between gap-8 p-6 sm:p-8 desk:p-10">
        <div className="grid gap-4">
          {(project.client || project.segment) && (
            <p className="mono flex flex-wrap gap-x-3 gap-y-1 text-grey-500">
              {project.client && <span>{project.client}</span>}
              {project.segment && <span className="text-red">{project.segment}</span>}
            </p>
          )}
          <h2 className="text-card">
            <TransitionLink href={href} className="after:absolute after:inset-0 after:content-['']">
              {project.title}
            </TransitionLink>
          </h2>
          {teaser.length > 0 && (
            <dl className="grid gap-3">
              {teaser.map((t) => (
                <div key={t.label} className="grid gap-1">
                  <dt className="mono text-red">{t.label}</dt>
                  <dd className="text-[15px] leading-[1.55] text-grey-600">{t.text}</dd>
                </div>
              ))}
            </dl>
          )}
          {project.services.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label={labels.services}>
              {project.services.map((s) => (
                <li key={s}>
                  <Tag tone="grey">{s}</Tag>
                </li>
              ))}
            </ul>
          )}
        </div>
        <span className="inline-flex items-center gap-2 text-[15px] font-medium transition-colors group-hover:text-red" aria-hidden="true">
          {viewCta}
          <ArrowIcon className="transition-transform duration-500 group-hover:translate-x-1" />
        </span>
      </div>
    </li>
  );
}

/** Card de artigo: capa (ou placeholder), categoria, data e resumo. */
export function PostCard({ post, readCta, className }: { post: PublicPost; readCta: string; className?: string }) {
  const href = `/conteudos/${post.slug}`;
  const date = post.publishedAt ?? post.createdAt;
  return (
    <li className={cn("group relative grid content-start gap-5 rounded-md bg-white p-4 text-ink shadow-[var(--shadow-card-light)] hairline-light", className)}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-xs">
        {post.cover ? (
          <MediaFigure media={post.cover} sizes="(min-width: 1150px) 33vw, (min-width: 768px) 50vw, 100vw" className="absolute inset-0 rounded-none transition-transform duration-[1200ms] ease-[var(--ease-out)] group-hover:scale-[1.03]" />
        ) : (
          <BrandPlaceholder label={post.title} initials={initialsOf(post.title)} icon="terminal" className="absolute inset-0 rounded-none" />
        )}
      </div>
      <div className="grid gap-3 px-2 pb-2">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Tag>{post.category}</Tag>
          {date && (
            <time dateTime={isoDate(date)} className="mono text-grey-500">
              {formatDate(date)}
            </time>
          )}
        </p>
        <h2 className="text-card">
          <TransitionLink href={href} className="after:absolute after:inset-0 after:content-['']">
            {post.title}
          </TransitionLink>
        </h2>
        {post.excerpt && <p className="text-[15px] leading-[1.6] text-grey-600">{post.excerpt}</p>}
        <span className="inline-flex items-center gap-2 pt-1 text-[14px] font-medium transition-colors group-hover:text-red" aria-hidden="true">
          {readCta}
          <ArrowIcon className="size-3.5 transition-transform duration-500 group-hover:translate-x-1" />
        </span>
      </div>
    </li>
  );
}
