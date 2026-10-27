import "server-only";
import { count, desc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { auditLogs, contentEntries, leads, messages, posts, projects } from "@/server/db/schema";

export async function getDashboardData(isAdmin: boolean) {
  const db = await getDb();
  const n = async (q: Promise<Array<{ n: number }>>) => Number((await q)[0]?.n ?? 0);

  const [totalLeads, newLeads, newMessages, publishedProjects, publishedPosts, draftContent, draftProjects, draftPosts] = await Promise.all([
    isAdmin ? n(db.select({ n: count() }).from(leads)) : Promise.resolve(0),
    isAdmin ? n(db.select({ n: count() }).from(leads).where(eq(leads.status, "novo"))) : Promise.resolve(0),
    isAdmin ? n(db.select({ n: count() }).from(messages).where(eq(messages.status, "novo"))) : Promise.resolve(0),
    n(db.select({ n: count() }).from(projects).where(eq(projects.status, "published"))),
    n(db.select({ n: count() }).from(posts).where(eq(posts.status, "published"))),
    n(db.select({ n: count() }).from(contentEntries).where(isNotNull(contentEntries.draft))),
    n(db.select({ n: count() }).from(projects).where(eq(projects.status, "draft"))),
    n(db.select({ n: count() }).from(posts).where(eq(posts.status, "draft"))),
  ]);

  const recentAudit = isAdmin ? await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(10) : [];
  const recentLeads = isAdmin
    ? await db
        .select({ id: leads.id, name: leads.name, company: leads.company, segment: leads.segment, status: leads.status, createdAt: leads.createdAt })
        .from(leads)
        .orderBy(desc(leads.createdAt))
        .limit(5)
    : [];

  return {
    totalLeads,
    newLeads,
    newMessages,
    publishedProjects,
    publishedPosts,
    drafts: draftContent + draftProjects + draftPosts,
    draftsBreakdown: { content: draftContent, projects: draftProjects, posts: draftPosts },
    recentAudit,
    recentLeads,
  };
}
