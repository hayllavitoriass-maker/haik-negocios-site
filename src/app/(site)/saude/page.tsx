import type { Metadata } from "next";
import { getContent } from "@/server/content";
import { pageMetadata } from "@/lib/seo";
import { ROUTES } from "@/content/site";
import { NichePage } from "@/components/sections/NichePage";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getContent("seo");
  return pageMetadata({ ...seo.saude, path: ROUTES.saude });
}

export default async function SaudePage() {
  const [t, home] = await Promise.all([getContent("health"), getContent("home")]);
  const eyebrow = home.segments.items.find((s) => s.href === ROUTES.saude)?.title ?? "Saúde";
  return <NichePage content={t} path={ROUTES.saude} eyebrow={eyebrow} formation="stack" />;
}
