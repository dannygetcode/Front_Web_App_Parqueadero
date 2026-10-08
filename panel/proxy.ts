import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

// En Next 16 la convención "middleware" se llama "proxy"; cumple el mismo papel.
// Solo comprueba que exista la cookie; la validez del token la decide el backend
// (ante 401 el BFF borra la cookie y el cliente vuelve a /login).
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = pathname === "/login" || pathname === "/api/auth/login";
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  if (isPublic) {
    if (pathname === "/login" && hasSession && !req.nextUrl.searchParams.has("aviso")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (hasSession) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { status: 401, title: "No autenticado", detail: "Tu sesión no está activa.", codigo: "SESION_EXPIRADA" },
      { status: 401, headers: { "Content-Type": "application/problem+json" } },
    );
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
