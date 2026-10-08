import "server-only";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { problemSchema, type Problem } from "@/lib/schemas";
import { SESSION_COOKIE } from "@/lib/session";
import { rejectForeignOrigin } from "@/lib/server/origin";

/** URL del backend: variable de entorno solo del servidor. */
export function backendUrl(): string {
  const url = process.env.BACKEND_URL;
  if (!url) throw new Error("Falta la variable de entorno BACKEND_URL");
  return url.replace(/\/+$/, "");
}

export function problem(status: number, detail: string, extra: Partial<Problem> = {}) {
  const body: Problem = { status, title: extra.title ?? "Error", detail, ...extra };
  return NextResponse.json(body, {
    status,
    headers: { "Content-Type": "application/problem+json" },
  });
}

/**
 * Rutas del backend que el navegador puede alcanzar a través del BFF.
 * `:id` coincide con un segmento numérico. Todo lo demás se rechaza con 404.
 */
const ALLOWED = new Set([
  "GET usuarios",
  "GET usuarios/:id",
  "POST usuarios",
  "PUT usuarios/:id",
  "DELETE usuarios/:id",
  "PUT usuarios/:id/vehiculo",
  "PUT usuarios/:id/estado",
  "POST usuarios/:id/codigo",
  "GET cupos",
  "GET tarifas",
  "GET pagos",
  "GET pagos/:id",
  "GET pagos/:id/comprobante",
  "POST pagos/manual",
  "PUT pagos/:id/aprobar",
  "PUT pagos/:id/rechazar",
  "GET accesos",
  "GET accesos/ocupacion",
  "POST accesos/lecturas",
  "GET puerta",
  "PUT puerta",
]);

const SEGMENT = /^[A-Za-z0-9_-]{1,40}$/;
const MAX_BODY_BYTES = 6 * 1024 * 1024; // comprobante de 5 MB más el sobre multipart

function routeKey(method: string, segments: string[]): string | null {
  if (!segments.every((s) => SEGMENT.test(s))) return null;
  const key = `${method} ${segments.map((s) => (/^\d{1,18}$/.test(s) ? ":id" : s)).join("/")}`;
  return ALLOWED.has(key) ? key : null;
}

/**
 * Reenvía una petición del navegador al backend añadiendo el Bearer de la cookie.
 * Solo pasan rutas de la lista blanca; los métodos que modifican estado exigen Origin válido.
 * Ante 401 del backend borra la cookie para que el cliente vuelva a /login.
 */
export async function forward(req: NextRequest, segments: string[]) {
  const method = req.method;
  if (!routeKey(method, segments)) return problem(404, "Recurso no encontrado.");
  if (method !== "GET") {
    const foreign = rejectForeignOrigin(req);
    if (foreign) return foreign;
  }

  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return problem(401, "Tu sesión no está activa.", { codigo: "SESION_EXPIRADA" });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: req.headers.get("accept") ?? "application/json",
  };
  let body: ArrayBuffer | undefined;
  if (method === "POST" || method === "PUT") {
    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > MAX_BODY_BYTES) return problem(413, "El archivo es demasiado grande.");
    body = await req.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES) return problem(413, "El archivo es demasiado grande.");
    const contentType = req.headers.get("content-type");
    if (contentType && body.byteLength > 0) headers["Content-Type"] = contentType;
  }

  let res: Response;
  try {
    res = await fetch(`${backendUrl()}/api/${segments.join("/")}${req.nextUrl.search}`, {
      method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return problem(502, "No se pudo conectar con el servidor del parqueadero.", {
      codigo: "BACKEND_NO_DISPONIBLE",
    });
  }

  if (res.status === 401) {
    jar.delete(SESSION_COOKIE);
    return problem(401, "Tu sesión expiró. Inicia sesión de nuevo.", { codigo: "SESION_EXPIRADA" });
  }

  const out = new Headers({ "Cache-Control": "private, no-store" });
  const type = res.headers.get("content-type");
  if (type) out.set("Content-Type", type);
  if (res.status === 204 || res.status === 205) return new NextResponse(null, { status: res.status, headers: out });
  // Un error sin cuerpo ProblemDetail legible se normaliza.
  if (!res.ok && !type?.includes("json")) {
    return problem(res.status, "El servidor respondió con un error inesperado.");
  }
  if (!res.ok) {
    const parsed = problemSchema.safeParse(await res.clone().json().catch(() => null));
    // Los 403 de puerta traen el evento en el cuerpo, que no es ProblemDetail: se pasa tal cual.
    if (!parsed.success && res.status !== 403) {
      return problem(res.status, "El servidor respondió con un error inesperado.");
    }
  }
  return new NextResponse(res.body, { status: res.status, headers: out });
}
