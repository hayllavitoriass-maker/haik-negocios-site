import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy (antigo middleware):
 * 1. Gera um nonce por request e define a Content-Security-Policy estrita.
 * 2. Verificação otimista do painel: sem cookie de sessão, redireciona para o login
 *    (a autorização real acontece no servidor, em cada página e action).
 */
const SESSION_COOKIE = "haik_session";
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/setup", "/admin/recuperar", "/admin/redefinir"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (!request.cookies.get(SESSION_COOKIE)?.value) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    // strict-dynamic: scripts carregados por scripts com nonce (chunks do Next) são permitidos.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Atributos style inline são usados por GSAP/Three/React; nonce não cobre atributos.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'" + (isDev ? " ws: wss:" : ""),
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src https://www.youtube-nocookie.com https://player.vimeo.com",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Arquivos estáticos (PDF, imagens, ícones...) não recebem a CSP de página: o visualizador
      // de PDF do Chrome é bloqueado por `object-src 'none'`.
      source: "/((?!_next/static|_next/image|media/|favicon.ico|icon|apple-icon|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:pdf|svg|png|jpg|jpeg|webp|avif|gif|ico|txt|xml|woff2?)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
