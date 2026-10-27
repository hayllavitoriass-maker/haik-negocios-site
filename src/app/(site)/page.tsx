import type { Metadata } from "next";
import { getContent, getMediaSlots, getSettings } from "@/server/content";
import { listPublicProjects, listPublicTestimonials } from "@/server/repos/public";
import { pageMetadata, JsonLd, faqLd } from "@/lib/seo";
import { HomeHero } from "@/components/home/HomeHero";
import { HomePains } from "@/components/home/HomePains";
import { HomeAbout } from "@/components/home/HomeAbout";
import { HomeServices } from "@/components/home/HomeServices";
import { HomeMethod } from "@/components/home/HomeMethod";
import { HomeFlag } from "@/components/home/HomeFlag";
import { HomeSegments } from "@/components/home/HomeSegments";
import { HomeFounders } from "@/components/home/HomeFounders";
import { HomeProjects } from "@/components/home/HomeProjects";
import { HomeFinalCta } from "@/components/home/HomeFinalCta";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getContent("seo");
  return pageMetadata({ title: seo.home.title, description: seo.home.description, path: "/" });
}

/**
 * Home: dez capítulos em scroll storytelling, na ordem definida pela HAIK
 * (problema → solução → método → pessoas → prova → convite).
 */
export default async function HomePage() {
  const [home, projectsCopy, faq, slots, settings, projects, testimonials] = await Promise.all([
    getContent("home"),
    getContent("projects"),
    getContent("faq"),
    getMediaSlots(),
    getSettings(),
    listPublicProjects(),
    listPublicTestimonials(),
  ]);
  const whatsappHref = `https://wa.me/${settings.whatsappNumber}`;

  return (
    <>
      <HomeHero content={home.hero} photo={slots["founders.together"]} />
      <HomePains content={home.pains} />
      <HomeAbout content={home.about} />
      <HomeServices content={home.services} />
      <HomeMethod content={home.method} />
      <HomeFlag content={home.flag} />
      <HomeSegments content={home.segments} />
      <HomeFounders content={home.founders} slots={slots} />
      <HomeProjects content={home.proof} projects={projects} testimonials={testimonials} demoBadge={projectsCopy.demoBadge} />
      <HomeFinalCta content={home.finalCta} whatsappHref={whatsappHref} />
      <JsonLd data={faqLd(faq.items)} />
    </>
  );
}
