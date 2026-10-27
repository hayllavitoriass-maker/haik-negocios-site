import "server-only";
import { count } from "drizzle-orm";
import type { Database } from "./client";
import { projects, siteSettings } from "./schema";
import { demoProjectSeed } from "@/content/pages/misc";

/**
 * Dados iniciais idempotentes:
 * - linha única de configurações;
 * - Projeto HAIK demonstrativo (Derme Viva), publicado, apenas se a tabela estiver vazia
 *   (se a equipe apagar, não volta sozinho).
 * Nenhum depoimento, case ou número é inventado.
 */
export async function ensureSeedData(db: Database) {
  await db.insert(siteSettings).values({ id: 1, data: {} }).onConflictDoNothing();
  const [{ n }] = await db.select({ n: count() }).from(projects);
  if (Number(n) === 0) {
    await db.insert(projects).values({
      slug: demoProjectSeed.slug,
      title: demoProjectSeed.title,
      client: demoProjectSeed.client,
      segment: demoProjectSeed.segment,
      summary: demoProjectSeed.summary,
      scenario: demoProjectSeed.scenario,
      bottleneck: demoProjectSeed.bottleneck,
      solution: demoProjectSeed.solution,
      result: demoProjectSeed.result,
      services: demoProjectSeed.services,
      isDemo: true,
      status: "published",
      sortOrder: 0,
      publishedAt: new Date(),
    });
  }
}
