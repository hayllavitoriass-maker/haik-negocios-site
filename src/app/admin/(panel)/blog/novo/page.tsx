import { requireUser } from "@/server/auth/guard";
import { contentsContent } from "@/content/pages/misc";
import { PostForm } from "@/components/admin/PostForm";
import { Card, LinkButton, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Novo artigo" };

export default async function NewPostPage() {
  await requireUser();
  return (
    <>
      <PageHeader eyebrow="Blog" title="Novo artigo" actions={<LinkButton href="/admin/blog" size="sm">Voltar</LinkButton>} />
      <Card>
        <PostForm categories={contentsContent.categories} initial={{ title: "", slug: "", excerpt: "", category: contentsContent.categories[0], cover: null, body: "", seoTitle: "", seoDescription: "" }} />
      </Card>
    </>
  );
}
