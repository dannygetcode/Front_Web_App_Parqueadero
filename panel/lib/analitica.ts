"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { z } from "zod";
import { api, ApiError } from "@/lib/api-client";

/* ---------- Interruptor de datos simulados (vive en la URL, apagado por defecto) ---------- */

export function useSimulados(): [boolean, (v: boolean) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activo = params.get("simulados") === "1";
  const set = useCallback(
    (v: boolean) => {
      const q = new URLSearchParams(params.toString());
      if (v) q.set("simulados", "1");
      else q.delete("simulados");
      router.replace(`${pathname}${q.size ? `?${q}` : ""}`, { scroll: false });
    },
    [params, router, pathname],
  );
  return [activo, set];
}

/** No se reintenta un 503 (servicio caído) ni un 4xx: se muestra el mensaje del backend. */
function reintentar(fallos: number, e: unknown) {
  if (e instanceof ApiError && e.status >= 400 && e.status < 600 && e.status !== 502) return false;
  return fallos < 1;
}

/**
 * GET a /api/bff/analitica/<ruta>. `incluirSimulados` va en la clave de caché para que
 * nunca se mezclen resultados reales y simulados.
 */
export function useAnalitica<T extends z.ZodType>(
  ruta: string,
  schema: T,
  simulados: boolean,
  params: Record<string, string | number | undefined> = {},
  enabled = true,
) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) q.set(k, String(v));
  q.set("incluirSimulados", String(simulados));
  return useQuery({
    queryKey: ["analitica", ruta, simulados, params],
    queryFn: () => api(`/api/bff/analitica/${ruta}?${q}`, schema),
    retry: reintentar,
    staleTime: 60_000,
    enabled,
  });
}

/* ---------- Fechas en America/Bogota ---------- */

const ISO_BOGOTA = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Hoy en Bogotá como "YYYY-MM-DD". */
export function hoyBogota(): string {
  return ISO_BOGOTA.format(new Date());
}

/** Resta días a una fecha "YYYY-MM-DD" (aritmética en UTC, sin desfases). */
export function restarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - dias)).toISOString().slice(0, 10);
}

export const RANGOS = [
  { id: "7d", etiqueta: "7 días", dias: 7 },
  { id: "30d", etiqueta: "30 días", dias: 30 },
  { id: "90d", etiqueta: "90 días", dias: 90 },
  { id: "12m", etiqueta: "12 meses", dias: 365 },
] as const;
export type RangoId = (typeof RANGOS)[number]["id"];

/** desde/hasta inclusivos para un rango (máximo 400 días según el contrato). */
export function rangoFechas(id: RangoId, hoy: string) {
  const dias = RANGOS.find((r) => r.id === id)?.dias ?? 30;
  return { desde: restarDias(hoy, dias - 1), hasta: hoy, dias };
}

/* ---------- Formato ---------- */

const dec = (n: number, d: number) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Carros u ocupación con 1 decimal: "2,4". */
export const fmtDec1 = (n: number | null | undefined) => (n == null ? "-" : dec(n, 1));
/** Probabilidad 0-1 en porcentaje entero: "55 %". */
export const fmtPct = (p: number | null | undefined) =>
  p == null ? "-" : `${Math.round(p * 100)} %`;
/** Minutos a "10 h 16 min". */
export function fmtDuracion(min: number | null | undefined): string {
  if (min == null) return "-";
  const h = Math.floor(min / 60);
  const m = Math.round(min - h * 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
/** Métrica del modelo con 2 o 3 decimales y coma decimal. */
export const fmtMetrica = (n: unknown, d = 2) => (typeof n === "number" ? dec(n, d) : "-");

export const DIAS_SEMANA = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
export const DIAS_SEMANA_LARGO = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
export const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
