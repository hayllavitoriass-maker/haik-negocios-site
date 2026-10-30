import type { Metadata } from "next";
import { getContent, getSettings } from "@/server/content";
import { env } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";
import { ROUTES } from "@/content/site";
import { LegalPage } from "@/components/sections/LegalPage";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getContent("seo");
  return pageMetadata({ ...seo.termos, path: ROUTES.termos });
}

export default async function TermosPage() {
  const [legal, footer, settings] = await Promise.all([getContent("legal"), getContent("footer"), getSettings()]);
  const vars = {
    cnpj: settings.cnpj,
    email: settings.email,
    retentionDays: env.DATA_RETENTION_DAYS,
    foro: settings.mentionCity ? settings.city : "",
  };
  return <LegalPage doc={legal.terms} reviewNotice={legal.reviewNotice} path={ROUTES.termos} eyebrow={footer.terms} vars={vars} />;
}
