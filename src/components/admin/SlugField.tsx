"use client";

import { useState } from "react";
import { slugify } from "./labels";
import { Input } from "./ui";

/** Título + slug: o slug acompanha o título até ser editado manualmente. */
export function TitleSlugFields({ initialTitle = "", initialSlug = "", errors = {}, basePath }: { initialTitle?: string; initialSlug?: string; errors?: Record<string, string>; basePath: string }) {
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug || slugify(initialTitle));
  const [manual, setManual] = useState(Boolean(initialSlug));
  return (
    <>
      <Input
        label="Título"
        name="title"
        value={title}
        required
        maxLength={160}
        error={errors.title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (!manual) setSlug(slugify(e.target.value));
        }}
      />
      <Input
        label="Slug (endereço)"
        name="slug"
        value={slug}
        maxLength={120}
        error={errors.slug}
        hint={`Endereço público: ${basePath}/${slug || "..."}`}
        onChange={(e) => {
          setManual(true);
          setSlug(slugify(e.target.value).replace(/-$/, "") + (e.target.value.endsWith("-") ? "-" : ""));
        }}
        onBlur={() => setSlug((s) => slugify(s))}
      />
    </>
  );
}
