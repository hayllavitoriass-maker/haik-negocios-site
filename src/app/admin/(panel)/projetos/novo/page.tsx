import { requireUser } from "@/server/auth/guard";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { Card, LinkButton, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Novo projeto" };

export default async function NewProjectPage() {
  await requireUser();
  return (
    <>
      <PageHeader eyebrow="Projetos" title="Novo projeto" actions={<LinkButton href="/admin/projetos" size="sm">Voltar</LinkButton>} />
      <Card>
        <ProjectForm
          initial={{
            title: "",
            slug: "",
            client: "",
            segment: "",
            summary: "",
            scenario: "",
            bottleneck: "",
            solution: "",
            result: "",
            services: [],
            cover: null,
            gallery: [],
            videoUrl: "",
            links: [],
            isDemo: false,
            seoTitle: "",
            seoDescription: "",
          }}
        />
      </Card>
    </>
  );
}
