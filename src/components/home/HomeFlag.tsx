import { Scene, SceneLayer } from "@/components/motion/Scene";
import { Statement } from "@/components/motion/Statement";
import { ScrambleText } from "@/components/motion/ScrambleText";
import type { HomeContent } from "@/content/pages/home";
import { HOME_CHAPTERS } from "@/content/chapters";

const chapter = HOME_CHAPTERS[5];

/** Capítulo 05 — Bandeira da marca: frase em "objeto selecionado" com zoom, depois o texto. */
export function HomeFlag({ content }: { content: HomeContent["flag"] }) {
  const [l1, l2] = splitTitle(content.title);
  return (
    <Scene id={chapter.id} index={5} label={chapter.label} theme={chapter.theme} formation={chapter.formation} height={2.6}>
      <div className="vignette-dark pointer-events-none absolute inset-0" aria-hidden="true" />
      <SceneLayer in={0} out={0.55} className="scene__layer--center container-haik text-white">
        <Statement id={`${chapter.id}-title`} lines={[l1, l2]} from={0.04} to={0.42} />
      </SceneLayer>
      <SceneLayer in={0.58} out={1} className="scene__layer--center container-haik">
        <ScrambleText as="p" text="MANIFESTO" className="mono text-red-300" />
        <p className="text-manifesto max-w-[22em] font-display font-medium text-white text-shadow-legible">{content.body}</p>
      </SceneLayer>
    </Scene>
  );
}

function splitTitle(title: string): [string, string] {
  const idx = title.indexOf(". ");
  if (idx === -1) return [title, ""];
  return [title.slice(0, idx + 1), title.slice(idx + 2)];
}
