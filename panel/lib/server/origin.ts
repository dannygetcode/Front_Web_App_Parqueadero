import "server-only";
import type { NextRequest } from "next/server";
import { problem } from "@/lib/server/backend";

/**
 * Defensa CSRF adicional a SameSite=Strict: en handlers que modifican estado el
 * encabezado Origin debe existir y coincidir con el host que sirve el panel.
 * Devuelve una respuesta de error, o null si el origen es válido.
 */
export function rejectForeignOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host === host) return null;
    } catch {
      // origen malformado: se rechaza abajo
    }
  }
  return problem(403, "Origen de la solicitud no permitido.", { codigo: "ORIGEN_NO_PERMITIDO" });
}
