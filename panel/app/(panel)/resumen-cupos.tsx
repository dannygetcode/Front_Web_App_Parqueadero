"use client";

import { useQuery } from "@tanstack/react-query";
import { Bike, Car, ParkingSquare, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/brand/empty-state";
import { ErrorState } from "@/components/brand/error-state";
import { KpiCard } from "@/components/brand/kpi-card";
import { PlateChip } from "@/components/brand/plate-chip";
import { StatusBadge, type Estado } from "@/components/brand/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, errorMessage } from "@/lib/api-client";
import { cuposSchema, ocupacionSchema, type Cupo } from "@/lib/schemas";

function estadoDeCupo(c: Cupo): Estado {
  if (!c.activo) return "suspendido";
  if (!c.ocupado) return "libre";
  return c.vigente ? "ocupado" : "vencido";
}

export function ResumenCupos() {
  const cupos = useQuery({ queryKey: ["cupos"], queryFn: () => api("/api/cupos", cuposSchema) });
  const ocupacion = useQuery({
    queryKey: ["ocupacion"],
    queryFn: () => api("/api/ocupacion", ocupacionSchema),
  });

  if (cupos.isError) {
    return <ErrorState mensaje={errorMessage(cupos.error)} onReintentar={() => cupos.refetch()} />;
  }

  const lista = cupos.data;
  const totalActivos = lista?.filter((c) => c.activo).length ?? 0;
  const libres = lista?.filter((c) => c.activo && !c.ocupado).length ?? 0;
  const dentro = ocupacion.data?.vehiculosDentro ?? [];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {lista ? (
          <>
            <KpiCard titulo="Cupos libres" valor={libres} unidad={`de ${totalActivos}`} periodo="Asignación actual" />
            <KpiCard
              titulo="Cupos asignados"
              valor={lista.filter((c) => c.ocupado).length}
              unidad="cupos"
              periodo="Con usuario no dado de baja"
            />
            <KpiCard
              titulo="Vehículos dentro"
              valor={ocupacion.data ? dentro.length : "-"}
              unidad="ahora"
              periodo="Ocupación física"
            />
          </>
        ) : (
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-36 rounded-card" />)
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Cupos</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void cupos.refetch();
            void ocupacion.refetch();
          }}
          disabled={cupos.isFetching}
        >
          <RefreshCw className={cupos.isFetching ? "size-4 animate-spin" : "size-4"} aria-hidden />
          Actualizar
        </Button>
      </div>

      {!lista ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <EmptyState icono={ParkingSquare} titulo="No hay cupos configurados" descripcion="Cuando se creen cupos aparecerán aquí." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {lista.map((c) => {
            const Tipo = c.tipoVehiculo === "MOTO" ? Bike : Car;
            return (
              <li key={c.id} className="flex flex-col gap-3 rounded-card bg-card p-4 ring-1 ring-border">
                <div className="flex items-center justify-between">
                  <span className="tabular font-heading text-2xl font-bold">{c.codigo}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Tipo className="size-4" aria-hidden />
                    {c.tipoVehiculo === "MOTO" ? "Moto" : "Carro"}
                  </span>
                </div>
                <StatusBadge estado={estadoDeCupo(c)} className="self-start" />
              </li>
            );
          })}
        </ul>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold">Vehículos dentro</h2>
        {ocupacion.isError ? (
          <ErrorState
            titulo="No se pudo cargar la ocupación"
            mensaje={errorMessage(ocupacion.error)}
            onReintentar={() => ocupacion.refetch()}
          />
        ) : !ocupacion.data ? (
          <Skeleton className="h-16 rounded-card" />
        ) : dentro.length === 0 ? (
          <EmptyState icono={Car} titulo="No hay vehículos dentro" descripcion="Los ingresos registrados aparecerán aquí." />
        ) : (
          <ul className="flex flex-wrap gap-3">
            {dentro.map((v) => (
              <li key={v.placa} className="flex items-center gap-3 rounded-card bg-card p-3 ring-1 ring-border">
                <PlateChip placa={v.placa} />
                <span className="text-sm text-muted-foreground">{v.usuario ?? "Sin usuario"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
