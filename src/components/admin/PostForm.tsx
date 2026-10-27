"use client";

import { useActionState, useState } from "react";
import type { ActionResult } from "@/server/auth/guard";
import { savePost } from "@/server/actions/admin/posts";
import { cn } from "@/lib/cn";
import { Alert, Button, Divider, Input, Select, Textarea, controlClass } from "./ui";
import { SubmitButton, Toast } from "./client";
import { TitleSlugFields } from "./SlugField";
import { MediaPicker, type PickerMedia } from "./media/MediaPicker";
import { MarkdownPreview } from "./MarkdownPreview";

export type PostFormData = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  cover: PickerMedia | null;
  body: string;
  seoTitle: string;
  seoDescription: string;
};

export function PostForm({ initial, categories }: { initial: PostFormData; categories: readonly string[] }) {
  const [state, action] = useActionState<ActionResult<{ id: string }> | undefined, FormData>(savePost, undefined);
  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const [body, setBody] = useState(initial.body);
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  return (
    <form action={action} className="grid gap-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}
      <Toast result={state} />
      <div className="grid gap-4 md:grid-cols-2">
        <TitleSlugFields initialTitle={initial.title} initialSlug={initial.slug} errors={errors} basePath="/conteudos" />
        <Select label="Categoria" name="category" defaultValue={initial.category || categories[0]} options={categories} error={errors.category} />
        <MediaPicker name="coverMediaId" label="Capa" initial={initial.cover} defaultCategory="blog" />
      </div>
      <Textarea label="Resumo" name="excerpt" defaultValue={initial.excerpt} maxLength={400} hint="Aparece na lista de artigos e nas redes." error={errors.excerpt} />

      <Divider />
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="post-body" className="text-[13px] font-medium">
            Texto do artigo <span className="font-normal text-grey-400">(Markdown)</span>
          </label>
          <div className="flex gap-1 lg:hidden">
            <Button type="button" size="sm" variant={tab === "edit" ? "primary" : "ghost"} onClick={() => setTab("edit")}>
              Editar
            </Button>
            <Button type="button" size="sm" variant={tab === "preview" ? "primary" : "ghost"} onClick={() => setTab("preview")}>
              Prévia
            </Button>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <textarea id="post-body" name="body" value={body} onChange={(e) => setBody(e.target.value)} className={cn(controlClass, "min-h-[480px] py-2 font-mono text-[13px] leading-[1.55]", tab === "preview" && "hidden lg:block")} />
          <div className={cn("max-h-[720px] overflow-auto rounded-xs bg-grey-50 p-4", tab === "edit" && "hidden lg:block")}>
            <MarkdownPreview source={body} />
          </div>
        </div>
        {errors.body && <p className="text-[12px] text-red-600">{errors.body}</p>}
        <p className="text-[12px] text-grey-500">Títulos com #, listas com -, links com [texto](https://...). HTML não é renderizado.</p>
      </div>

      <Divider />
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Título SEO" name="seoTitle" defaultValue={initial.seoTitle} maxLength={120} optional error={errors.seoTitle} />
        <Input label="Descrição SEO" name="seoDescription" defaultValue={initial.seoDescription} maxLength={300} optional error={errors.seoDescription} />
      </div>
      <div className="sticky bottom-0 -mx-4 flex items-center gap-2 border-t border-grey-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <SubmitButton>{initial.id ? "Salvar" : "Criar rascunho"}</SubmitButton>
      </div>
    </form>
  );
}
