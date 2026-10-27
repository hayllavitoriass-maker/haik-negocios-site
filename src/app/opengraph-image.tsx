import { ImageResponse } from "next/og";
import { BRAND, SERVICE_NAV } from "@/content/site";

export const alt = `${BRAND.name}: ${BRAND.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagem Open Graph padrão: fundo escuro, "HAIK" gigante e acentos vermelhos da marca. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0b0b0b",
          color: "#fefefe",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", right: -160, top: -200, width: 560, height: 560, borderRadius: 9999, background: "rgba(234,25,35,.22)", filter: "blur(90px)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 28, height: 28, background: "#ea1923", borderRadius: 3 }} />
          <div style={{ fontSize: 22, letterSpacing: 6, textTransform: "uppercase", color: "#b5b5b5" }}>{BRAND.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "flex-end", lineHeight: 0.9 }}>
            <div style={{ fontSize: 260, fontWeight: 800, letterSpacing: -16 }}>HAIK</div>
            <div style={{ width: 44, height: 44, background: "#ea1923", borderRadius: 4, marginLeft: 10, marginBottom: 18 }} />
          </div>
          <div style={{ fontSize: 40, color: "#dcdcdc", letterSpacing: -1 }}>{BRAND.tagline}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#8e8e8e", fontSize: 22 }}>
          <div>{SERVICE_NAV.map((s) => s.label).join(" · ")}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 120, height: 8, background: "#ea1923", borderRadius: 2 }} />
            <div style={{ width: 24, height: 8, background: "#4a4a4a", borderRadius: 2 }} />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
