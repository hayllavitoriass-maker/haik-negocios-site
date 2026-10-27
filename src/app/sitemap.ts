import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { ROUTES } from "@/content/site";
import { listPublicPosts, listPublicProjects } from "@/server/repos/public";

type Entry = MetadataRoute.Sitemap[number];

const STATIC: { path: string; priority: number; changeFrequency: Entry["changeFrequency"] }[] = [
  { path: ROUTES.home, priority: 1, changeFrequency: "weekly" },
  { path: ROUTES.diagnostico, priority: 0.95, changeFrequency: "monthly" },
  { path: ROUTES.servicos, priority: 0.9, changeFrequency: "monthly" },
  { path: ROUTES.sites, priority: 0.8, changeFrequency: "monthly" },
  { path: ROUTES.sistemas, priority: 0.8, changeFrequency: "monthly" },
  { path: ROUTES.automacoes, priority: 0.8, changeFrequency: "monthly" },
  { path: ROUTES.marketing, priority: 0.8, changeFrequency: "monthly" },
  { path: ROUTES.metodo, priority: 0.8, changeFrequency: "monthly" },
  { path: ROUTES.sobre, priority: 0.7, changeFrequency: "monthly" },
  { path: ROUTES.saude, priority: 0.8, changeFrequency: "monthly" },
  { path: ROUTES.arquitetura, priority: 0.8, changeFrequency: "monthly" },
  { path: ROUTES.projetos, priority: 0.7, changeFrequency: "weekly" },
  { path: ROUTES.conteudos, priority: 0.7, changeFrequency: "weekly" },
  { path: ROUTES.contato, priority: 0.6, changeFrequency: "yearly" },
  { path: ROUTES.privacidade, priority: 0.2, changeFrequency: "yearly" },
  { path: ROUTES.termos, priority: 0.2, changeFrequency: "yearly" },
];

/** Sitemap: rotas públicas fixas + projetos e artigos publicados. /obrigado fica de fora (noindex). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([listPublicProjects(), listPublicPosts()]);
  const now = new Date();

  const fixed: MetadataRoute.Sitemap = STATIC.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const projectEntries: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${SITE_URL}${ROUTES.projetos}/${p.slug}`,
    lastModified: p.updatedAt ?? p.publishedAt ?? now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}${ROUTES.conteudos}/${p.slug}`,
    lastModified: p.updatedAt ?? p.publishedAt ?? now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...fixed, ...projectEntries, ...postEntries];
}
