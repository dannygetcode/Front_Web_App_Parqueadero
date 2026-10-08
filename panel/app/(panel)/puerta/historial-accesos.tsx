"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PlateChip } from "@/components/brand/plate-chip";
import { StatusBadge } from "@/components/brand/status-badge";
import { DataTable, type Column } from "@/components/data/data-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, errorMessage } from "@/lib/api-client";
import { formatearFechaHora, MOTIVOS_ACCESO } from "@/lib/format";
import { eventoAccesoSchema, paginaSchema, type EventoAcceso } from "@/lib/schemas";

const TAMANO = 10;
const paginaEventos = paginaSchema(eventoAccesoSchema);
const ORIGENES = { CAMARA: "Cámara", APP_USUARIO: "App del usuario", MANUAL_ADMIN: "Manual (admin)" } as const;

export function HistorialAccesos() {
  const [resultado, setResultado] = useState<"TODOS" | "PERMITIDO" | "DENEGADO">("TODOS");
  const [pagina, setPagina] = useState(0);

  const query = useQuery({
    queryKey: ["accesos", { resultado, pagina }],
    queryFn: () => {
      const q = new URLSearchParams({ page: String(pagina), size: String(TAMANO) });
      if (resultado !== "TODOS") q.set("resultado", resultado);
      return api(`/api/bff/accesos?${q}`, paginaEventos);
    },
    refetchInterval: 10_000,
  });
  const total = query.data?.page.totalPages ?? 0;

  const columnas: Column<EventoAcceso>[] = [
    { id: "hora", header: "Hora", cell: (a) => <span className="tabular">{formatearFechaHora(a.ocurridoEn)}</span> },
    { id: "placa", header: "Placa", cell: (a) => <PlateChip placa={a.placaLeida} size="sm" /> },
    { id: "tipo", header: "Movimiento", cell: (a) => (a.tipo === "ENTRADA" ? "Entrada" : "Salida") },
    {
      id: "resultado",
      header: "Resultado",
      cell: (a) =>
        a.resultado === "PERMITIDO" ? (
          <StatusBadge estado="libre" label="Permitido" />
        ) : (
          <StatusBadge estado="ocupado" label="Denegado" />
        ),
    },
    { id: "motivo", header: "Motivo", cell: (a) => (a.motivo ? (MOTIVOS_ACCESO[a.motivo] ?? a.motivo) : "-") },
    { id: "origen", header: "Origen", cell: (a) => ORIGENES[a.origen] },
    { id: "usuario", header: "Usuario", cell: (a) => a.usuarioNombre ?? "Sin usuario" },
  ];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">Historial de accesos</h2>
        <div className="flex items-center gap-3">
          <label htmlFor="filtro-resultado" className="text-sm font-medium">
            Resultado
          </label>
          <Select
            value={resultado}
            onValueChange={(v) => {
              setResultado(v as typeof resultado);
              setPagina(0);
            }}
          >
            <SelectTrigger id="filtro-resultado" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="PERMITIDO">Permitidos</SelectItem>
              <SelectItem value="DENEGADO">Denegados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DataTable
        caption="Historial de accesos a la puerta"
        columns={columnas}
        rows={query.data?.content}
        rowKey={(a) => a.id}
        loading={query.isLoading}
        error={query.isError ? errorMessage(query.error) : null}
        onRetry={() => query.refetch()}
        emptyTitle="Sin accesos registrados"
        emptyDescription="Las aperturas y lecturas de placa aparecerán aquí."
      />
      {total > 1 ? (
        <nav aria-label="Paginación del historial" className="flex items-center justify-end gap-3 text-sm">
          <span className="tabular text-muted-foreground">
            Página {pagina + 1} de {total}
          </span>
          <Button variant="outline" size="icon" disabled={pagina === 0} onClick={() => setPagina((n) => n - 1)} aria-label="Página anterior">
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <Button variant="outline" size="icon" disabled={pagina + 1 >= total} onClick={() => setPagina((n) => n + 1)} aria-label="Página siguiente">
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </nav>
      ) : null}
    </section>
  );
}
