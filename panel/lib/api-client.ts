import type { z } from "zod";
import { problemSchema, type Problem } from "@/lib/schemas";

/** Error con el ProblemDetail del backend (en español) listo para mostrar. */
export class ApiError extends Error {
  readonly status: number;
  readonly problem: Problem;

  constructor(status: number, problem: Problem) {
    super(problem.detail ?? problem.title ?? "Ocurrió un error inesperado.");
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }
}

/**
 * Llamada del navegador al BFF (mismo origen). El navegador nunca ve el token:
 * va en la cookie httpOnly y el BFF añade el Authorization hacia el backend.
 * Ante 401 envía al login.
 */
export async function api<T extends z.ZodType>(
  path: string,
  schema: T,
  init: RequestInit = {},
): Promise<z.infer<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      credentials: "same-origin",
      headers: { Accept: "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError(0, { detail: "Sin conexión con el panel. Revisa tu red." });
  }

  if (res.status === 401 && typeof window !== "undefined") {
    // Navegación completa a propósito: reinicia caché y estado del cliente.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login?aviso=sesion");
  }

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const parsed = problemSchema.safeParse(json);
    throw new ApiError(
      res.status,
      parsed.success ? parsed.data : { detail: "El servidor respondió con un error inesperado." },
    );
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError(res.status, { detail: "La respuesta no tiene el formato esperado." });
  }
  return parsed.data;
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Ocurrió un error inesperado.";
}
