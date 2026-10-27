import type { Metadata } from "next";
import { getContent } from "@/server/content";
import { pageMetadata } from "@/lib/seo";
import { ROUTES } from "@/content/site";
import { LegalPage } from "@/components/sections/LegalPage";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getContent("seo");
  return pageMetadata({ ...seo.termos, path: ROUTES.termos });
}

export default async function TermosPage() {
  const [legal, footer] = await Promise.all([getContent("legal"), getContent("footer")]);
  return <LegalPage doc={legal.terms} reviewNotice={legal.reviewNotice} path={ROUTES.termos} eyebrow={footer.terms} />;
}
