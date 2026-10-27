const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });

/** Data por extenso em pt-BR (ex.: 27 de outubro de 2026). Aceita Date, ISO ou "AAAA-MM-DD". */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00-03:00` : value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return dateFormatter.format(date);
}

export function isoDate(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Iniciais (até duas) para placeholders de marca: "Haylla Vitória" → "HV". */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Converte URLs do YouTube/Vimeo em embed seguro. Só youtube-nocookie e player.vimeo
 * são permitidos pela CSP; qualquer outra URL não é incorporada.
 */
export function embedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");
  const id = (v: string | null) => (v && /^[\w-]{6,}$/.test(v) ? v : null);
  if (host === "youtube-nocookie.com") {
    const m = url.pathname.match(/^\/embed\/([\w-]+)/);
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const v = id(url.searchParams.get("v")) ?? id(url.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)/)?.[1] ?? null);
    return v ? `https://www.youtube-nocookie.com/embed/${v}` : null;
  }
  if (host === "youtu.be") {
    const v = id(url.pathname.slice(1));
    return v ? `https://www.youtube-nocookie.com/embed/${v}` : null;
  }
  if (host === "player.vimeo.com") {
    const m = url.pathname.match(/^\/video\/(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}` : null;
  }
  if (host === "vimeo.com") {
    const m = url.pathname.match(/^\/(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}` : null;
  }
  return null;
}
