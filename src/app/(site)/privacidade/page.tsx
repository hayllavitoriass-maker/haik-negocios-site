import type { Metadata } from "next";
import { getContent } from "@/server/content";
import { pageMetadata } from "@/lib/seo";
import { ROUTES } from "@/content/site";
import { LegalPage } from "@/components/sections/LegalPage";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getContent("seo");
  return pageMetadata({ ...seo.privacidade, path: ROUTES.privacidade });
}

export default async function PrivacidadePage() {
  const [legal, footer] = await Promise.all([getContent("legal"), getContent("footer")]);
  return <LegalPage doc={legal.privacy} reviewNotice={legal.reviewNotice} path={ROUTES.privacidade} eyebrow={footer.privacy} />;
}
