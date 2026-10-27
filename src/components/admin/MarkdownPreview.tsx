"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/cn";

/**
 * Pré-visualização de Markdown sem HTML bruto (sem rehype-raw): tags digitadas pelo
 * editor viram texto, nunca marcação executável.
 */
export function MarkdownPreview({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn("prose-admin text-[14px] leading-[1.6] text-ink", className)}>
      {source.trim() ? (
        <Markdown
          remarkPlugins={[remarkGfm]}
          skipHtml
          components={{
            h1: (p) => <h1 className="mt-4 mb-2 font-sans text-[22px] font-semibold" {...p} />,
            h2: (p) => <h2 className="mt-4 mb-2 font-sans text-[18px] font-semibold" {...p} />,
            h3: (p) => <h3 className="mt-3 mb-1 font-sans text-[16px] font-semibold" {...p} />,
            p: (p) => <p className="mb-3" {...p} />,
            ul: (p) => <ul className="mb-3 list-disc pl-5" {...p} />,
            ol: (p) => <ol className="mb-3 list-decimal pl-5" {...p} />,
            li: (p) => <li className="mb-1" {...p} />,
            a: ({ href, children }) => (
              <a href={href} className="text-red-700 underline" target="_blank" rel="noopener noreferrer nofollow">
                {children}
              </a>
            ),
            blockquote: (p) => <blockquote className="mb-3 border-l-2 border-red pl-3 text-grey-600" {...p} />,
            code: (p) => <code className="rounded-xs bg-grey-100 px-1 py-0.5 font-mono text-[12px]" {...p} />,
            pre: (p) => <pre className="mb-3 overflow-x-auto rounded-xs bg-grey-100 p-3 font-mono text-[12px]" {...p} />,
            table: (p) => <table className="mb-3 w-full border-collapse text-[13px]" {...p} />,
            th: (p) => <th className="border border-grey-200 bg-grey-50 px-2 py-1 text-left" {...p} />,
            td: (p) => <td className="border border-grey-200 px-2 py-1" {...p} />,
            hr: () => <hr className="my-4 border-grey-200" />,
            img: ({ alt }) => <span className="text-grey-500">[imagem: {alt || "sem descrição"}]</span>,
          }}
        >
          {source}
        </Markdown>
      ) : (
        <p className="text-grey-400">A pré-visualização aparece aqui.</p>
      )}
    </div>
  );
}
