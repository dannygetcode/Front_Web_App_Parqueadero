"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Gift, TriangleAlert } from "lucide-react";
import { PlateChip } from "@/components/brand/plate-chip";
import { SectionHeader } from "@/components/brand/section-header";
import { EstadoPagoBadge } from "@/components/brand/estado-pago-badge";
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
import { formatearFecha, formatearFechaHora, formatearMonto } from "@/lib/format";
import { pagoSchema, paginaSchema, type EstadoPago, type Pago } from "@/lib/schemas";
import { CortesiaDialog } from "@/app/(panel)/pagos/cortesia-dialog";
import { PagoSheet } from "@/app/(panel)/pagos/pago-sheet";

const TAMANO = 15;
const paginaPagos = paginaSchema(pagoSchema);

export function PagosView() {
  const [estado, setEstado] = useState<EstadoPago | "TODOS">("PENDIENTE");
  const [pagina, setPagina] = useState(0);
  const [seleccion, setSeleccion] = useState<Pago | null>(null);
  const [cortesia, setCortesia] = useState(false);

  const query = useQuery({
    queryKey: ["pagos", { estado, pagina }],
    queryFn: () => {
      const q = new URLSearchParams({ page: String(pagina), size: String(TAMANO) });
      if (estado !== "TODOS") q.set("estado", estado);
      return api(`/api/bff/pagos?${q}`, paginaPagos);
    },
  });
  const total = query.data?.page.totalPages ?? 0;

  const columnas: Column<Pago>[] = [
    {
      id: "usuario",
      header: "Usuario",
      cell: (p) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{p.usuarioNombre ?? `Usuario ${p.usuarioId}`}</span>
          {p.placa ? <PlateChip placa={p.placa} size="sm" className="self-start" /> : null}
        </div>
      ),
    },
    {
      id: "periodo",
      header: "Periodo",
      cell: (p) => (
        <span className="tabular">
          {formatearFecha(p.periodoInicio)} a {formatearFecha(p.periodoFin)}
        </span>
      ),
    },
    { id: "esperado", header: "Esperado", numeric: true, cell: (p) => formatearMonto(p.montoEsperado) },
    { id: "ocr", header: "Leído del comprobante", numeric: true, cell: (p) => formatearMonto(p.montoOcr) },
    {
      id: "estado",
      header: "Estado",
      cell: (p) => (
        <div className="flex flex-col items-start gap-1">
          <EstadoPagoBadge estado={p.estado} />
          {p.posibleDuplicado ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-st-por-vencer">
              <TriangleAlert className="size-3.5" aria-hidden /> Posible duplicado
            </span>
          ) : null}
        </div>
      ),
    },
    { id: "creado", header: "Recibido", cell: (p) => <span className="tabular">{formatearFechaHora(p.creadoEn)}</span> },
    {
      id: "acciones",
      header: "Acciones",
      cell: (p) => (
        <Button variant="outline" size="sm" onClick={() => setSeleccion(p)}>
          {p.estado === "PENDIENTE" ? "Revisar" : "Ver"}
        </Button>
      ),
    },
  ];

  return (
    <>
      <SectionHeader
        titulo="Pagos"
        descripcion="Revisión de comprobantes y cortesías."
        acciones={
          <Button variant="outline" onClick={() => setCortesia(true)}>
            <Gift className="size-4" aria-hidden /> Registrar cortesía
          </Button>
        }
      />
      <div className="flex items-center gap-3">
        <label htmlFor="filtro-estado" className="text-sm font-medium">
          Estado
        </label>
        <Select
          value={estado}
          onValueChange={(v) => {
            setEstado(v as EstadoPago | "TODOS");
            setPagina(0);
          }}
        >
          <SelectTrigger id="filtro-estado" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDIENTE">Pendientes</SelectItem>
            <SelectItem value="APROBADO">Aprobados</SelectItem>
            <SelectItem value="RECHAZADO">Rechazados</SelectItem>
            <SelectItem value="TODOS">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        caption="Pagos recibidos"
        columns={columnas}
        rows={query.data?.content}
        rowKey={(p) => p.id}
        loading={query.isLoading}
        error={query.isError ? errorMessage(query.error) : null}
        onRetry={() => query.refetch()}
        emptyTitle={estado === "PENDIENTE" ? "No hay pagos pendientes" : "Sin pagos con este filtro"}
        emptyDescription="Cuando un usuario suba un comprobante aparecerá aquí."
      />

      {total > 1 ? (
        <nav aria-label="Paginación" className="flex items-center justify-end gap-3 text-sm">
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

      <PagoSheet pago={seleccion} onClose={() => setSeleccion(null)} />
      <CortesiaDialog open={cortesia} onOpenChange={setCortesia} />
    </>
  );
}
