"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MEDIA_CATEGORIES } from "@/content/site";
import type { PublicMedia } from "@/server/media/url";
import { cn } from "@/lib/cn";
import { Alert, Button, controlClass } from "../ui";

export type UploadedMedia = PublicMedia & { category: string; size: number };

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif,application/pdf";

/**
 * Envio de arquivos para /api/admin/upload (multipart), com prévia local e barra de progresso.
 * `replaceId` troca o arquivo de uma mídia existente mantendo o mesmo registro.
 */
export function MediaUploader({
  category,
  replaceId,
  onUploaded,
  compact,
  defaultCategory = "geral",
  onlyImages,
}: {
  category?: string;
  replaceId?: string;
  onUploaded?: (m: UploadedMedia) => void;
  compact?: boolean;
  defaultCategory?: string;
  onlyImages?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cat, setCat] = useState(category ?? defaultCategory);
  const [alt, setAlt] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const pick = (f: File | null) => {
    setError(null);
    setDone(null);
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f && f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  };

  const submit = () => {
    if (!file) return;
    setError(null);
    setProgress(0);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("category", cat);
    if (alt) fd.set("alt", alt);
    if (replaceId) fd.set("replace", replaceId);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setProgress(null);
      let body: { ok?: boolean; error?: string; media?: UploadedMedia } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* resposta não-JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.ok && body.media) {
        setDone(replaceId ? "Arquivo substituído." : "Arquivo enviado.");
        pick(null);
        setAlt("");
        if (inputRef.current) inputRef.current.value = "";
        onUploaded?.(body.media);
        router.refresh();
      } else {
        setError(body.error ?? "Falha no envio. Tente novamente.");
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("Falha de rede durante o envio.");
    };
    xhr.send(fd);
  };

  return (
    <div className={cn("grid gap-3", compact ? "" : "rounded-xs bg-grey-50 p-4")}>
      <div
        className="grid cursor-pointer place-items-center gap-1 rounded-xs border border-dashed border-grey-300 bg-white px-4 py-6 text-center text-[13px] text-grey-500 hover:border-red"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files?.[0] ?? null);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="max-h-40 rounded-xs object-contain" />
        ) : file ? (
          <span className="font-medium text-ink">{file.name}</span>
        ) : (
          <>
            <span className="font-medium text-ink">{replaceId ? "Escolher novo arquivo" : "Arraste ou clique para escolher"}</span>
            <span>{onlyImages ? "JPG, PNG, WebP, AVIF ou GIF até 15 MB" : "JPG, PNG, WebP, AVIF, GIF até 15 MB · PDF até 25 MB"}</span>
          </>
        )}
        <input ref={inputRef} type="file" accept={onlyImages ? ACCEPT.replace(",application/pdf", "") : ACCEPT} className="hidden" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
      </div>
      {file && (
        <div className="text-[12px] text-grey-500">
          {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
        </div>
      )}
      {!replaceId && (
        <div className="grid gap-3 sm:grid-cols-2">
          {!category && (
            <label className="grid gap-1 text-[13px] font-medium">
              Categoria
              <select value={cat} onChange={(e) => setCat(e.target.value)} className={cn(controlClass, "h-10")}>
                {MEDIA_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="grid gap-1 text-[13px] font-medium">
            Texto alternativo
            <input value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} placeholder="Descreva a imagem" className={cn(controlClass, "h-10")} />
          </label>
        </div>
      )}
      {progress !== null && (
        <div className="h-1.5 overflow-hidden rounded-xs bg-grey-200" aria-label="Progresso do envio">
          <div className="h-full bg-red transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <Alert tone="red">{error}</Alert>}
      {done && <Alert tone="green">{done}</Alert>}
      <div>
        <Button type="button" onClick={submit} disabled={!file || progress !== null} size="sm">
          {progress !== null ? `Enviando ${progress}%` : replaceId ? "Substituir arquivo" : "Enviar"}
        </Button>
      </div>
    </div>
  );
}
