"use client";

import { useState } from "react";
import { Database, FlaskConical, Hourglass, Table2, ChartColumn } from "lucide-react";
import { ErrorState } from "@/components/brand/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, errorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/** De dónde salen las cifras. Spring suma reales y simulados; el pronóstico usa solo simulados. */
export type Origen = "spring" | "pronostico";

export function OrigenBadge({ origen, simulados }: { origen: Origen; simulados: boolean }) {
  if (!simulados) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
        <Database className="size-3.5" aria-hidden /> Datos reales
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-sim-bg px-2 py-1 text-xs font-semibold text-sim">
      <FlaskConical className="size-3.5" aria-hidden />
      {origen === "spring" ? "Real + simulado" : "Solo simulado"}
    </span>
  );
}

/** Tarjeta de un bloque de analítica: título, origen y borde de "simulado" cuando aplica. */
export function Tarjeta({
  titulo,
  descripcion,
  origen,
  simulados,
  acciones,
  className,
  children,
}: {
  titulo: string;
  descripcion?: string;
  origen: Origen;
  simulados: boolean;
  acciones?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-card bg-card p-5 ring-1 ring-border",
        simulados && "border-t-4 border-sim",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold">{titulo}</h2>
          {descripcion ? <p className="mt-0.5 text-sm text-muted-foreground">{descripcion}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {acciones}
          <OrigenBadge origen={origen} simulados={simulados} />
        </div>
      </header>
      {children}
    </section>
  );
}

/** Carga y error de una consulta; un 503 del pronóstico se muestra como aviso, sin romper la página. */
export function EstadoConsulta({
  q,
  alto = "h-64",
  tituloError = "No se pudo cargar",
  children,
}: {
  q: { isLoading: boolean; isError: boolean; error: unknown; refetch: () => unknown; data?: unknown };
  alto?: string;
  tituloError?: string;
  children: React.ReactNode;
}) {
  if (q.isError && !q.data) {
    const no503 = !(q.error instanceof ApiError && q.error.status === 503);
    return (
      <ErrorState
        tono={no503 ? "error" : "aviso"}
        titulo={no503 ? tituloError : "Pronóstico no disponible"}
        mensaje={errorMessage(q.error)}
        onReintentar={() => q.refetch()}
      />
    );
  }
  if (q.isLoading || !q.data) return <Skeleton className={cn("w-full rounded-card", alto)} />;
  return <>{children}</>;
}

/** "Datos insuficientes": la cifra no se dibuja, se explica cuánto falta. */
export function InsuficienteState({
  titulo = "Datos insuficientes",
  detalle,
  progreso,
  onVerSimulados,
}: {
  titulo?: string;
  detalle: string;
  /** Avance de 0 a 1 hacia el mínimo necesario. */
  progreso?: number;
  onVerSimulados?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card bg-muted px-6 py-10 text-center">
      <Hourglass className="size-7 text-muted-foreground" aria-hidden />
      <h3 className="font-heading text-base font-semibold">{titulo}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{detalle}</p>
      {progreso !== undefined ? (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(Math.min(1, progreso) * 100)}
          aria-label="Historia disponible frente a la necesaria"
          className="h-2 w-48 overflow-hidden rounded-lg bg-border"
        >
          <div className="h-full bg-muted-foreground" style={{ width: `${Math.min(1, progreso) * 100}%` }} />
        </div>
      ) : null}
      {onVerSimulados ? (
        <Button variant="outline" size="sm" onClick={onVerSimulados}>
          <FlaskConical className="size-4" aria-hidden /> Ver con datos simulados
        </Button>
      ) : null}
    </div>
  );
}

/** Alterna una gráfica con su versión en tabla (alternativa accesible). */
export function GraficaOTabla({
  resumen,
  grafica,
  tabla,
}: {
  /** Frase que describe la gráfica para lectores de pantalla y como pie. */
  resumen: string;
  grafica: React.ReactNode;
  tabla: React.ReactNode;
}) {
  const [verTabla, setVerTabla] = useState(false);
  return (
    <figure className="flex min-w-0 flex-col gap-3">
      {verTabla ? <div className="max-h-80 overflow-auto rounded-lg ring-1 ring-border">{tabla}</div> : grafica}
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{resumen}</span>
        <Button variant="ghost" size="sm" onClick={() => setVerTabla((v) => !v)}>
          {verTabla ? <ChartColumn className="size-4" aria-hidden /> : <Table2 className="size-4" aria-hidden />}
          {verTabla ? "Ver gráfica" : "Ver como tabla"}
        </Button>
      </figcaption>
    </figure>
  );
}

/** Tabla compacta para las vistas "Ver como tabla". */
export function TablaSimple({
  caption,
  columnas,
  filas,
}: {
  caption: string;
  columnas: { titulo: string; numerica?: boolean }[];
  filas: React.ReactNode[][];
}) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="sticky top-0 bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
        <tr>
          {columnas.map((c) => (
            <th key={c.titulo} scope="col" className={cn("px-3 py-2 font-semibold", c.numerica && "text-right")}>
              {c.titulo}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filas.map((f, i) => (
          <tr key={i} className="border-t border-border">
            {f.map((v, j) => (
              <td key={j} className={cn("px-3 py-2", columnas[j]?.numerica && "tabular text-right")}>
                {v}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
