"use client";

import { useActionState, useState } from "react";
import type { ActionResult } from "@/server/auth/guard";
import type { ProjectLink } from "@/server/db/schema";
import { saveProject } from "@/server/actions/admin/projects";
import { PROJECT_SERVICES } from "./labels";
import { Alert, Button, Checkbox, Divider, Input, Textarea } from "./ui";
import { SubmitButton, Toast } from "./client";
import { TitleSlugFields } from "./SlugField";
import { MediaMultiPicker, MediaPicker, type PickerMedia } from "./media/MediaPicker";

export type ProjectFormData = {
  id?: string;
  title: string;
  slug: string;
  client: string;
  segment: string;
  summary: string;
  scenario: string;
  bottleneck: string;
  solution: string;
  result: string;
  services: string[];
  cover: PickerMedia | null;
  gallery: PickerMedia[];
  videoUrl: string;
  links: ProjectLink[];
  isDemo: boolean;
  seoTitle: string;
  seoDescription: string;
};

export function ProjectForm({ initial }: { initial: ProjectFormData }) {
  const [state, action] = useActionState<ActionResult<{ id: string }> | undefined, FormData>(saveProject, undefined);
  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const [links, setLinks] = useState<ProjectLink[]>(initial.links);

  return (
    <form action={action} className="grid gap-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="links" value={JSON.stringify(links)} />
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}
      <Toast result={state} />

      <div className="grid gap-4 md:grid-cols-2">
        <TitleSlugFields initialTitle={initial.title} initialSlug={initial.slug} errors={errors} basePath="/projetos" />
        <Input label="Cliente" name="client" defaultValue={initial.client} maxLength={160} optional error={errors.client} />
        <Input label="Segmento" name="segment" defaultValue={initial.segment} maxLength={80} optional error={errors.segment} />
      </div>
      <Textarea label="Resumo" name="summary" defaultValue={initial.summary} maxLength={600} hint="Uma ou duas frases para o card na lista de projetos." error={errors.summary} />

      <Divider />
      <div className="grid gap-4 md:grid-cols-2">
        <Textarea label="O cenário" name="scenario" defaultValue={initial.scenario} maxLength={4000} error={errors.scenario} />
        <Textarea label="O gargalo" name="bottleneck" defaultValue={initial.bottleneck} maxLength={4000} error={errors.bottleneck} />
        <Textarea label="A solução" name="solution" defaultValue={initial.solution} maxLength={4000} error={errors.solution} />
        <div className="grid gap-2">
          <Textarea label="Resultado" name="result" defaultValue={initial.result} maxLength={4000} error={errors.result} />
          <Alert tone="amber">Só publique resultados reais, medidos e autorizados pelo cliente. Sem número comprovado, deixe em branco.</Alert>
        </div>
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-1 text-[13px] font-medium">Serviços envolvidos</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PROJECT_SERVICES.map((s) => (
            <Checkbox key={s} label={s} name="services[]" value={s} defaultChecked={initial.services.includes(s)} />
          ))}
        </div>
      </fieldset>

      <Divider />
      <div className="grid gap-5 md:grid-cols-2">
        <MediaPicker name="coverMediaId" label="Capa" initial={initial.cover} defaultCategory="projetos" hint="Imagem principal do projeto." />
        <Input label="Vídeo (URL)" name="videoUrl" type="url" defaultValue={initial.videoUrl} placeholder="https://www.youtube.com/watch?v=..." optional hint="YouTube ou Vimeo, sempre https." error={errors.videoUrl} />
      </div>
      <MediaMultiPicker name="galleryMediaIds" label="Galeria" initial={initial.gallery} defaultCategory="projetos" />

      <div className="grid gap-2">
        <span className="text-[13px] font-medium">Links (site, Instagram, episódios...)</span>
        {links.map((l, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
            <Input label={`Rótulo ${i + 1}`} value={l.label} maxLength={80} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <Input label={`URL ${i + 1}`} type="url" value={l.url} maxLength={500} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
            <Button type="button" variant="ghost" size="sm" className="self-end" onClick={() => setLinks(links.filter((_, j) => j !== i))}>
              Remover
            </Button>
          </div>
        ))}
        {errors.links && <p className="text-[12px] text-red-600">{errors.links}</p>}
        {links.length < 10 && (
          <div>
            <Button type="button" variant="secondary" size="sm" onClick={() => setLinks([...links, { label: "", url: "" }])}>
              Adicionar link
            </Button>
          </div>
        )}
      </div>

      <Divider />
      <Checkbox label="Projeto demonstrativo (mostra o selo “Projeto demonstrativo” no site)" name="isDemo" defaultChecked={initial.isDemo} />
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
