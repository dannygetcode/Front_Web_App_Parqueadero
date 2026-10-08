import { NextResponse, type NextRequest } from "next/server";
import { loginRequestSchema, problemSchema, tokenSchema } from "@/lib/schemas";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, sessionCookieOptions } from "@/lib/session";
import { backendUrl, problem } from "@/lib/server/backend";
import { rejectForeignOrigin } from "@/lib/server/origin";

export async function POST(req: NextRequest) {
  const foreign = rejectForeignOrigin(req);
  if (foreign) return foreign;

  const body = loginRequestSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return problem(400, "Escribe tu usuario y tu contraseña.");

  let res: Response;
  try {
    res = await fetch(`${backendUrl()}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body.data),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return problem(502, "No se pudo conectar con el servidor del parqueadero.", {
      codigo: "BACKEND_NO_DISPONIBLE",
    });
  }

  if (!res.ok) {
    const parsed = problemSchema.safeParse(await res.json().catch(() => null));
    return NextResponse.json(
      parsed.success ? parsed.data : { status: res.status, detail: "No se pudo iniciar sesión." },
      { status: res.status, headers: { "Content-Type": "application/problem+json" } },
    );
  }

  const token = tokenSchema.safeParse(await res.json().catch(() => null));
  if (!token.success) {
    return problem(502, "La respuesta del servidor no tiene el formato esperado.");
  }

  // La cookie caduca junto con el token.
  let maxAge = SESSION_MAX_AGE_SECONDS;
  if (token.data.expiraEn) {
    const secs = Math.floor((Date.parse(token.data.expiraEn) - Date.now()) / 1000);
    if (Number.isFinite(secs) && secs > 0) maxAge = Math.min(secs, SESSION_MAX_AGE_SECONDS);
  }

  const out = NextResponse.json({ ok: true });
  out.cookies.set(SESSION_COOKIE, token.data.token, { ...sessionCookieOptions, maxAge });
  return out;
}
