import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { problemSchema, type Problem } from "@/lib/schemas";
import { SESSION_COOKIE } from "@/lib/session";

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

async function readProblem(res: Response): Promise<Problem> {
  try {
    const parsed = problemSchema.safeParse(await res.json());
    if (parsed.success) return { status: res.status, ...parsed.data };
  } catch {
    // cuerpo vacío o no JSON
  }
  return { status: res.status, detail: "El servidor respondió con un error inesperado." };
}

/**
 * GET autenticado al backend, validado con zod. Si el backend responde 401 se
 * borra la cookie de sesión y se devuelve 401 para que el cliente vaya a /login.
 */
export async function proxyGet<T extends z.ZodType>(path: string, schema: T) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return problem(401, "Tu sesión no está activa.", { codigo: "SESION_EXPIRADA" });

  let res: Response;
  try {
    res = await fetch(`${backendUrl()}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
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
  if (!res.ok) {
    const p = await readProblem(res);
    return NextResponse.json(p, {
      status: res.status,
      headers: { "Content-Type": "application/problem+json" },
    });
  }

  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) {
    return problem(502, "La respuesta del servidor no tiene el formato esperado.", {
      codigo: "RESPUESTA_INVALIDA",
    });
  }
  return NextResponse.json(parsed.data);
}
