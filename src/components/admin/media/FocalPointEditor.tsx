"use client";

import { useState } from "react";

/** Clique na imagem para definir o ponto focal (0–1). Grava focalX/focalY em inputs ocultos. */
export function FocalPointEditor({ url, alt, initialX, initialY }: { url: string; alt: string; initialX: number; initialY: number }) {
  const [x, setX] = useState(initialX);
  const [y, setY] = useState(initialY);
  return (
    <div className="grid gap-2">
      <input type="hidden" name="focalX" value={x.toFixed(3)} />
      <input type="hidden" name="focalY" value={y.toFixed(3)} />
      <div
        className="relative inline-block max-w-full cursor-crosshair select-none overflow-hidden rounded-xs bg-grey-100 hairline"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setX(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
          setY(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
        }}
        role="img"
        aria-label={`Imagem com ponto focal em ${Math.round(x * 100)}% / ${Math.round(y * 100)}%`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} className="max-h-[420px] w-auto max-w-full" draggable={false} />
        <span className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red shadow-[0_0_0_2px_rgba(234,25,35,.5)]" style={{ left: `${x * 100}%`, top: `${y * 100}%` }} aria-hidden="true" />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[12px] text-grey-500">
        <span>
          Ponto focal: {Math.round(x * 100)}% × {Math.round(y * 100)}%. Clique na imagem para ajustar.
        </span>
        <button
          type="button"
          className="underline underline-offset-2 hover:text-ink"
          onClick={() => {
            setX(0.5);
            setY(0.5);
          }}
        >
          Centralizar
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["16 / 9", "aspect-video"],
          ["1 / 1", "aspect-square"],
          ["3 / 4", "aspect-[3/4]"],
        ].map(([label, cls]) => (
          <figure key={label} className="grid gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className={`w-full rounded-xs object-cover hairline ${cls}`} style={{ objectPosition: `${x * 100}% ${y * 100}%` }} />
            <figcaption className="text-center text-[11px] text-grey-500">Corte {label}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
