import { requireUser } from "@/server/auth/guard";
import { TestimonialForm } from "@/components/admin/TestimonialForm";
import { Card, LinkButton, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Novo depoimento" };

export default async function NewTestimonialPage() {
  await requireUser();
  return (
    <>
      <PageHeader eyebrow="Depoimentos" title="Novo depoimento" actions={<LinkButton href="/admin/depoimentos" size="sm">Voltar</LinkButton>} />
      <Card>
        <TestimonialForm initial={{ name: "", company: "", role: "", city: "", photo: null, quote: "", authorized: false, sortOrder: 0 }} />
      </Card>
    </>
  );
}
