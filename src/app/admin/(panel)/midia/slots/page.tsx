import { requireUser } from "@/server/auth/guard";
import { listSlotsWithMedia } from "@/server/repos/admin/media";
import { SlotPicker } from "@/components/admin/media/SlotPicker";
import { Card, Flash, LinkButton, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Slots de mídia" };

export default async function MediaSlotsPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const slots = await listSlotsWithMedia();
  return (
    <>
      <PageHeader
        title="Slots nomeados"
        description="Lugares fixos do site (fotos dos sócios, imagem Open Graph, checklist em PDF...). Escolha a mídia de cada um."
        actions={
          <LinkButton href="/admin/midia" size="sm">
            Biblioteca
          </LinkButton>
        }
      />
      <Flash ok={sp.ok} erro={sp.erro} />
      <Card>
        <ul className="grid gap-3">
          {slots.map((s) => (
            <li key={s.slot} className="grid gap-2 border-b border-grey-100 pb-3 last:border-0 sm:grid-cols-[260px_1fr] sm:items-center">
              <div>
                <p className="text-[14px] font-medium text-ink">{s.label}</p>
                <p className="font-mono text-[11px] text-grey-400">{s.slot}</p>
              </div>
              <SlotPicker slot={s.slot} current={s.media} pdf={s.slot === "checklist.pdf"} />
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
