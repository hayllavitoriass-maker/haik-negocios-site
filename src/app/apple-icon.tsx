import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ícone para tela inicial do iOS: quadrado vermelho da marca com o H. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#EA1923",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 36,
        }}
      >
        <svg width="112" height="112" viewBox="0 0 64 64" fill="none">
          <rect x="12" y="14" width="9" height="36" rx="3" fill="#fff" />
          <rect x="43" y="14" width="9" height="36" rx="3" fill="#fff" />
          <path d="M21 28h10c6 0 9 3 11 7l5 10h-9l-4-7c-1-2-2-2-4-2H21z" fill="#171717" />
        </svg>
      </div>
    ),
    size,
  );
}
