import { requireUser } from "@/server/auth/guard";
import { getSettings } from "@/server/content";
import { getSettingsRow } from "@/server/repos/admin/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { Card, LinkButton, PageHeader } from "@/components/admin/ui";
import { formatDateTime } from "@/components/admin/labels";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  await requireUser({ role: "admin" });
  const [settings, row] = await Promise.all([getSettings(), getSettingsRow()]);
  return (
    <>
      <PageHeader
        title="Configurações"
        description={`Dados de contato, SEO padrão e comportamentos do site.${row?.updatedAt ? ` Última alteração em ${formatDateTime(row.updatedAt)}.` : ""}`}
        actions={
          <LinkButton href="/admin/midia/slots" size="sm">
            Slots de mídia
          </LinkButton>
        }
      />
      <Card>
        <SettingsForm initial={settings} />
      </Card>
      <p className="mt-4 text-[12px] text-grey-500">Segredos e variáveis de ambiente (banco, SMTP, S3, APP_SECRET) não são editáveis aqui: configure-os no servidor.</p>
    </>
  );
}
