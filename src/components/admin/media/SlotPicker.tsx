"use client";

import { useRef, useState } from "react";
import { assignMediaSlot } from "@/server/actions/admin/media";
import { Button } from "../ui";
import { SubmitButton } from "../client";
import { MediaLibraryDialog, MediaThumb, type PickerMedia } from "./MediaPicker";

/** Linha de um slot: mídia atual + escolher/limpar (envia a action ao escolher). */
export function SlotPicker({ slot, current, pdf }: { slot: string; current: PickerMedia | null; pdf?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [selected, setSelected] = useState<PickerMedia | null>(current);

  return (
    <form ref={formRef} action={assignMediaSlot} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="slot" value={slot} />
      <input type="hidden" name="mediaId" value={selected?.id ?? ""} />
      <MediaThumb m={selected} className="size-14 shrink-0 rounded-xs hairline" />
      <span className="min-w-0 flex-1 truncate text-[12px] text-grey-500">{selected ? selected.alt || selected.filename : "Nenhuma mídia atribuída"}</span>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => ref.current?.showModal()}>
          {selected ? "Trocar" : "Escolher"}
        </Button>
        {current && (
          <SubmitButton
            variant="ghost"
            size="sm"
            pendingText="Limpando..."
            formAction={(fd) => {
              fd.set("mediaId", "");
              return assignMediaSlot(fd);
            }}
          >
            Limpar
          </SubmitButton>
        )}
      </div>
      <MediaLibraryDialog
        dialogRef={ref}
        onlyImages={!pdf}
        onlyPdf={pdf}
        defaultCategory={pdf ? "arquivos" : slot.startsWith("founders") ? "fundadores" : slot.startsWith("services") ? "servicos" : slot.startsWith("og") ? "og" : "institucional"}
        onSelect={(m) => {
          setSelected(m);
          // Envia logo após o estado atualizar (próximo tick).
          setTimeout(() => formRef.current?.requestSubmit(), 0);
        }}
      />
    </form>
  );
}
