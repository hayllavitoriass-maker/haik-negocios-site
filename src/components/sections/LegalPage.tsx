import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import { Container, Prose } from "@/components/ui/Container";
import { Label } from "@/components/ui/Label";
import { breadcrumbLd, JsonLd } from "@/lib/seo";
import { PageSetup } from "./PageSetup";
import { Notice } from "./primitives";
import { formatDate } from "./format";
import { fillLegalTokens, hasPendingLegalFields, type LegalVars } from "@/lib/legal";

type Doc = { title: string; updatedAt: string; body: string };

/**
 * Página legal (Privacidade / Termos): título, data de revisão, aviso de minuta e corpo em
 * Markdown. CNPJ, e-mail, prazo de retenção e foro vêm das configurações; o que faltar
 * aparece entre colchetes para o revisor.
 */
export function LegalPage({ doc, reviewNotice, path, eyebrow, vars }: { doc: Doc; reviewNotice: string; path: string; eyebrow: string; vars: LegalVars }) {
  const body = fillLegalTokens(doc.body, vars);
  const pending = hasPendingLegalFields(body);
  return (
    <>
      <PageSetup formation="drift" intensity={0.2} />
      <JsonLd data={breadcrumbLd([{ name: "Início", path: "/" }, { name: doc.title, path }])} />
      <article className="pb-[clamp(64px,10vw,140px)] pt-[calc(var(--header-h)+clamp(40px,7vw,96px))]">
        <Container className="grid gap-10 desk:grid-cols-[minmax(0,.7fr)_minmax(0,1.3fr)] desk:gap-20">
          <header className="grid content-start gap-6 desk:sticky desk:top-[calc(var(--header-h)+24px)] desk:self-start">
            <Reveal y={12}>
              <Label text={eyebrow} />
            </Reveal>
            <SplitHeading as="h1" text={doc.title} immediate className="text-h2 max-w-[12em]" />
            <Reveal y={16}>
              <p className="mono text-grey-500">
                Última revisão: <time dateTime={doc.updatedAt}>{formatDate(doc.updatedAt)}</time>
              </p>
            </Reveal>
          </header>
          <div className="grid gap-10">
            <Reveal y={16}>
              <Notice title="Minuta">
                {reviewNotice}
                {pending && " Os campos entre colchetes ainda não foram informados em Configurações."}
              </Notice>
            </Reveal>
            <Reveal y={24} className="rounded-md bg-white p-6 shadow-[var(--shadow-card-light)] hairline-light sm:p-10">
              <Prose className="[&_h2:first-child]:mt-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
              </Prose>
            </Reveal>
          </div>
        </Container>
      </article>
    </>
  );
}
