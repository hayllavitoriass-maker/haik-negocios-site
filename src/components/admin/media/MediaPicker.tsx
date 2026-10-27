"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicMedia } from "@/server/media/url";
import { MEDIA_CATEGORIES } from "@/content/site";
import { cn } from "@/lib/cn";
import { Button, controlClass } from "../ui";
import { Dialog } from "../client";
import { MediaUploader, type UploadedMedia } from "./MediaUploader";

export type PickerMedia = Pick<PublicMedia, "id" | "url" | "alt" | "mime" | "filename" | "width" | "height">;

export function MediaThumb({ m, className }: { m: PickerMedia | null | undefined; className?: string }) {
  if (!m) return <div className={cn("grid place-items-center bg-grey-100 text-[11px] text-grey-400", className)}>vazio</div>;
  if (m.mime === "application/pdf") {
    return (
      <div className={cn("grid place-items-center bg-grey-100 text-[11px] font-medium uppercase text-grey-600", className)}>
        PDF
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={m.url} alt={m.alt} className={cn("object-cover", className)} loading="lazy" />;
}

/**
 * Biblioteca em diálogo: busca, filtro por categoria, envio direto e seleção.
 * Reutilizada por projetos, depoimentos, artigos e slots.
 */
export function MediaLibraryDialog({
  dialogRef,
  onSelect,
  onlyImages,
  onlyPdf,
  defaultCategory,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  onSelect: (m: PickerMedia) => void;
  onlyImages?: boolean;
  onlyPdf?: boolean;
  defaultCategory?: string;
}) {
  const [items, setItems] = useState<UploadedMedia[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"library" | "upload">("library");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const u = new URLSearchParams();
      if (q) u.set("q", q);
      if (cat) u.set("categoria", cat);
      if (onlyImages) u.set("imagens", "1");
      const res = await fetch(`/api/admin/media?${u.toString()}`, { credentials: "same-origin" });
      const body = (await res.json()) as { ok: boolean; items?: UploadedMedia[] };
      let list = body.items ?? [];
      if (onlyPdf) list = list.filter((m) => m.mime === "application/pdf");
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [q, cat, onlyImages, onlyPdf]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const obs = new MutationObserver(() => {
      if (el.open) {
        timer = setTimeout(() => void load(), 0);
      }
    });
    obs.observe(el, { attributes: true, attributeFilter: ["open"] });
    return () => {
      obs.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [dialogRef, load]);

  useEffect(() => {
    if (dialogRef.current?.open) void load();
  }, [load, dialogRef]);

  return (
    <Dialog ref={dialogRef} title="Biblioteca de mídia" wide>
      <div className="mb-3 flex gap-1">
        <Button type="button" size="sm" variant={tab === "library" ? "primary" : "ghost"} onClick={() => setTab("library")}>
          Biblioteca
        </Button>
        <Button type="button" size="sm" variant={tab === "upload" ? "primary" : "ghost"} onClick={() => setTab("upload")}>
          Enviar novo
        </Button>
      </div>
      {tab === "upload" ? (
        <MediaUploader
          compact
          defaultCategory={defaultCategory}
          onlyImages={onlyImages}
          onUploaded={(m) => {
            onSelect(m);
            dialogRef.current?.close();
          }}
        />
      ) : (
        <>
          <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_180px]">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou descrição" className={cn(controlClass, "h-9")} aria-label="Buscar mídia" />
            <select value={cat} onChange={(e) => setCat(e.target.value)} className={cn(controlClass, "h-9")} aria-label="Categoria">
              <option value="">Todas as categorias</option>
              {MEDIA_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="max-h-[60vh] overflow-auto">
            {loading ? (
              <p className="py-10 text-center text-[13px] text-grey-500">Carregando...</p>
            ) : items.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-grey-500">Nenhum arquivo encontrado. Use “Enviar novo”.</p>
            ) : (
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {items.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      className="group block w-full overflow-hidden rounded-xs bg-grey-100 text-left hairline focus-visible:outline-2 focus-visible:outline-red"
                      onClick={() => {
                        onSelect(m);
                        dialogRef.current?.close();
                      }}
                    >
                      <MediaThumb m={m} className="aspect-square w-full" />
                      <span className="block truncate px-1.5 py-1 text-[11px] text-grey-600 group-hover:text-ink">{m.alt || m.filename}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </Dialog>
  );
}

/** Seletor de uma mídia: mostra a atual e grava o id em um input oculto. */
export function MediaPicker({ name, label, initial, onlyImages = true, onlyPdf, defaultCategory, hint }: { name: string; label: string; initial?: PickerMedia | null; onlyImages?: boolean; onlyPdf?: boolean; defaultCategory?: string; hint?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState<PickerMedia | null>(initial ?? null);
  return (
    <div className="grid gap-1.5">
      <span className="text-[13px] font-medium text-ink">{label}</span>
      <input type="hidden" name={name} value={current?.id ?? ""} />
      <div className="flex items-center gap-3">
        <MediaThumb m={current} className="size-20 shrink-0 rounded-xs hairline" />
        <div className="grid gap-1.5">
          {current && <span className="max-w-[260px] truncate text-[12px] text-grey-500">{current.alt || current.filename}</span>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => ref.current?.showModal()}>
              {current ? "Trocar" : "Escolher"}
            </Button>
            {current && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setCurrent(null)}>
                Remover
              </Button>
            )}
          </div>
        </div>
      </div>
      {hint && <p className="text-[12px] text-grey-500">{hint}</p>}
      <MediaLibraryDialog dialogRef={ref} onSelect={setCurrent} onlyImages={onlyImages && !onlyPdf} onlyPdf={onlyPdf} defaultCategory={defaultCategory} />
    </div>
  );
}

/** Seletor de várias mídias ordenadas (galeria). Grava `name[]` em inputs ocultos. */
export function MediaMultiPicker({ name, label, initial = [], defaultCategory }: { name: string; label: string; initial?: PickerMedia[]; defaultCategory?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<PickerMedia[]>(initial);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const copy = [...items];
    const [it] = copy.splice(from, 1);
    copy.splice(to, 0, it);
    setItems(copy);
  };
  return (
    <div className="grid gap-1.5">
      <span className="text-[13px] font-medium text-ink">
        {label} <span className="font-normal text-grey-400">({items.length})</span>
      </span>
      {items.map((m) => (
        <input key={m.id} type="hidden" name={`${name}[]`} value={m.id} />
      ))}
      {items.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {items.map((m, i) => (
            <li key={m.id} className="grid gap-1">
              <MediaThumb m={m} className="aspect-square w-full rounded-xs hairline" />
              <div className="flex justify-center gap-1">
                <button type="button" className="grid size-7 place-items-center rounded-xs hairline disabled:opacity-30" aria-label="Mover para a esquerda" disabled={i === 0} onClick={() => move(i, i - 1)}>
                  ‹
                </button>
                <button type="button" className="grid size-7 place-items-center rounded-xs hairline disabled:opacity-30" aria-label="Mover para a direita" disabled={i === items.length - 1} onClick={() => move(i, i + 1)}>
                  ›
                </button>
                <button type="button" className="grid size-7 place-items-center rounded-xs text-red-600 hairline" aria-label="Remover" onClick={() => setItems(items.filter((_, j) => j !== i))}>
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div>
        <Button type="button" variant="secondary" size="sm" onClick={() => ref.current?.showModal()}>
          Adicionar imagem
        </Button>
      </div>
      <MediaLibraryDialog dialogRef={ref} onlyImages defaultCategory={defaultCategory} onSelect={(m) => setItems((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]))} />
    </div>
  );
}
