"use client";

import { useActionState, useId, useMemo, useState } from "react";
import type { FieldNode } from "@/content/fields";
import { submitContent } from "@/server/actions/admin/content";
import { cn } from "@/lib/cn";
import { Alert, Button, controlClass } from "./ui";
import { SubmitButton } from "./client";
import { MarkdownPreview } from "./MarkdownPreview";

type Path = Array<string | number>;

function getAt(obj: unknown, path: Path): unknown {
  let cur: unknown = obj;
  for (const p of path) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[p];
  }
  return cur;
}

function setAt(obj: unknown, path: Path, value: unknown): unknown {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (Array.isArray(obj)) {
    const copy = [...obj];
    copy[head as number] = setAt(copy[head as number], rest, value);
    return copy;
  }
  const base = (obj && typeof obj === "object" ? obj : {}) as Record<string, unknown>;
  return { ...base, [head as string]: setAt(base[head as string], rest, value) };
}

function summarize(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    const first = o.title ?? o.name ?? o.label ?? o.q ?? o.letter ?? Object.values(o).find((x) => typeof x === "string");
    return typeof first === "string" ? first : "";
  }
  return "";
}

/**
 * Formulário genérico guiado pelo esquema derivado dos padrões (deriveFields).
 * O estado é um JSON completo; no envio ele vai em um campo oculto e é validado no servidor.
 */
export function ContentForm({ contentKey, root, initial, hasDraft }: { contentKey: string; root: FieldNode; initial: unknown; hasDraft: boolean }) {
  const [value, setValue] = useState<unknown>(initial);
  const [dirty, setDirty] = useState(false);
  const [state, action] = useActionState(submitContent, undefined);
  const json = useMemo(() => JSON.stringify(value), [value]);

  const update = (path: Path, v: unknown) => {
    setValue((prev: unknown) => setAt(prev, path, v));
    setDirty(true);
  };

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="key" value={contentKey} />
      <input type="hidden" name="data" value={json} />
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}

      <FieldRenderer node={root} path={[]} value={value} update={update} depth={0} />

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-2 border-t border-grey-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <SubmitButton name="intent" value="draft" variant="secondary" pendingText="Salvando...">
          Salvar rascunho
        </SubmitButton>
        <SubmitButton name="intent" value="publish" variant="primary" pendingText="Publicando...">
          Publicar
        </SubmitButton>
        <span className="text-[12px] text-grey-500">{dirty ? "Alterações não salvas." : hasDraft ? "Editando rascunho salvo." : "Sem alterações pendentes."}</span>
      </div>
    </form>
  );
}

function FieldRenderer({ node, path, value, update, depth, label }: { node: FieldNode; path: Path; value: unknown; update: (p: Path, v: unknown) => void; depth: number; label?: string }) {
  const lbl = label ?? node.label;
  switch (node.kind) {
    case "group": {
      const entries = Object.entries(node.fields);
      const body = (
        <div className={cn("grid gap-4", depth > 0 && "pl-3 border-l-2 border-grey-100")}>
          {entries.map(([k, child]) => (
            <FieldRenderer key={k} node={child} path={[...path, k]} value={getAt(value, [k])} update={update} depth={depth + 1} />
          ))}
        </div>
      );
      if (depth === 0) return body;
      return (
        <details open={depth < 2} className="group rounded-xs bg-white">
          <summary className="cursor-pointer select-none py-1 text-[14px] font-semibold text-ink marker:text-grey-400">{lbl}</summary>
          <div className="mt-2">{body}</div>
        </details>
      );
    }
    case "list": {
      const items = Array.isArray(value) ? value : [];
      const isPrimitive = node.item.kind !== "group" && node.item.kind !== "list";
      return (
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-[14px] font-semibold text-ink">
            {lbl} <span className="font-normal text-grey-400">({items.length})</span>
          </legend>
          {items.map((item, i) => (
            <div key={i} className={cn("grid gap-2 rounded-xs bg-grey-50 p-3", isPrimitive && "sm:grid-cols-[1fr_auto] sm:items-end")}>
              {!isPrimitive && (
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12px] font-medium uppercase tracking-[0.06em] text-grey-500">
                    Item {i + 1}
                    {summarize(item) && <span className="ml-2 normal-case tracking-normal text-grey-600">· {summarize(item)}</span>}
                  </span>
                  <ListControls index={i} total={items.length} onMove={(from, to) => update(path, move(items, from, to))} onRemove={() => update(path, items.filter((_, j) => j !== i))} />
                </div>
              )}
              <FieldRenderer node={node.item} path={[...path, i]} value={item} update={update} depth={depth + 1} label={isPrimitive ? `${lbl} ${i + 1}` : node.item.label} />
              {isPrimitive && <ListControls index={i} total={items.length} onMove={(from, to) => update(path, move(items, from, to))} onRemove={() => update(path, items.filter((_, j) => j !== i))} />}
            </div>
          ))}
          {items.length < 200 && (
            <div>
              <Button type="button" variant="secondary" size="sm" onClick={() => update(path, [...items, structuredClone(node.template)])}>
                Adicionar item
              </Button>
            </div>
          )}
        </fieldset>
      );
    }
    case "boolean":
      return <BoolField label={lbl} value={Boolean(value)} onChange={(v) => update(path, v)} />;
    case "number":
      return <ScalarField label={lbl} kind="number" value={typeof value === "number" ? String(value) : ""} onChange={(v) => update(path, v === "" ? 0 : Number(v))} />;
    case "markdown":
      return <MarkdownField label={lbl} value={typeof value === "string" ? value : ""} onChange={(v) => update(path, v)} />;
    case "textarea":
      return <ScalarField label={lbl} kind="textarea" value={typeof value === "string" ? value : ""} onChange={(v) => update(path, v)} readonly={node.readonly} />;
    case "url":
      return <ScalarField label={lbl} kind="url" value={typeof value === "string" ? value : ""} onChange={(v) => update(path, v)} readonly={node.readonly} />;
    case "text":
    default:
      return <ScalarField label={lbl} kind="text" value={typeof value === "string" ? value : ""} onChange={(v) => update(path, v)} readonly={node.readonly} />;
  }
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [it] = copy.splice(from, 1);
  copy.splice(to, 0, it);
  return copy;
}

function ListControls({ index, total, onMove, onRemove }: { index: number; total: number; onMove: (from: number, to: number) => void; onRemove: () => void }) {
  const btn = "grid size-8 place-items-center rounded-xs bg-white text-grey-600 hairline hover:bg-grey-100 disabled:opacity-30";
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className={btn} aria-label="Mover para cima" disabled={index === 0} onClick={() => onMove(index, index - 1)}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="m6 15 6-6 6 6" />
        </svg>
      </button>
      <button type="button" className={btn} aria-label="Mover para baixo" disabled={index === total - 1} onClick={() => onMove(index, index + 1)}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <button type="button" className={cn(btn, "text-red-600")} aria-label="Remover item" onClick={onRemove}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function ScalarField({ label, kind, value, onChange, readonly }: { label: string; kind: "text" | "textarea" | "url" | "number"; value: string; onChange: (v: string) => void; readonly?: boolean }) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
        {readonly && <span className="ml-1 font-normal text-grey-400">(fixo)</span>}
      </label>
      {kind === "textarea" ? (
        <textarea id={id} value={value} readOnly={readonly} disabled={readonly} onChange={(e) => onChange(e.target.value)} className={cn(controlClass, "min-h-[88px] py-2 leading-[1.5]")} rows={Math.min(10, Math.max(3, Math.ceil(value.length / 90)))} />
      ) : (
        <input id={id} type={kind === "number" ? "number" : kind === "url" ? "url" : "text"} value={value} readOnly={readonly} disabled={readonly} onChange={(e) => onChange(e.target.value)} className={cn(controlClass, "h-10")} />
      )}
    </div>
  );
}

function BoolField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 text-[14px] text-ink">
      <input id={id} type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-red" />
      {label}
    </label>
  );
}

function MarkdownField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-ink">
          {label} <span className="font-normal text-grey-400">(Markdown)</span>
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
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cn(controlClass, "min-h-[320px] py-2 font-mono text-[13px] leading-[1.55]", tab === "preview" && "hidden lg:block")} />
        <div className={cn("max-h-[560px] overflow-auto rounded-xs bg-grey-50 p-4", tab === "edit" && "hidden lg:block")}>
          <MarkdownPreview source={value} />
        </div>
      </div>
    </div>
  );
}
