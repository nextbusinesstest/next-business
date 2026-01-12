import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl;

  const protectedPath =
    url.pathname.startsWith("/client") || url.pathname.startsWith("/internal");

  if (!protectedPath) return NextResponse.next();

  // permitimos acceso a la pantalla de login y al api login
  if (url.pathname === "/client/login" || url.pathname.startsWith("/api/auth/login")) {
    return NextResponse.next();
  }

  const auth = req.cookies.get("nb_auth")?.value;

  if (auth === "1") return NextResponse.next();

  // si intenta entrar a cualquier ruta protegida, mandamos a login
  url.pathname = "/client/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/client/:path*", "/internal/:path*"],
};
