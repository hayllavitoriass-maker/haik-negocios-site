import type { Metadata } from "next";
import { getContent } from "@/server/content";
import { pageMetadata } from "@/lib/seo";
import { ROUTES } from "@/content/site";
import { NichePage } from "@/components/sections/NichePage";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getContent("seo");
  return pageMetadata({ ...seo.arquitetura, path: ROUTES.arquitetura });
}

export default async function ArquiteturaPage() {
  const [t, home] = await Promise.all([getContent("architecture"), getContent("home")]);
  const eyebrow = home.segments.items.find((s) => s.href === ROUTES.arquitetura)?.title ?? "Arquitetura";
  return <NichePage content={t} path={ROUTES.arquitetura} eyebrow={eyebrow} formation="stack" />;
}
