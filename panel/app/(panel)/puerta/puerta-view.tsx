"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ErrorState } from "@/components/brand/error-state";
import { Persiana } from "@/components/brand/persiana";
import { SectionHeader } from "@/components/brand/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { api, errorMessage } from "@/lib/api-client";
import { puertaSchema } from "@/lib/schemas";
import { HistorialAccesos } from "@/app/(panel)/puerta/historial-accesos";
import { AperturaCard, SimuladorCamara } from "@/app/(panel)/puerta/puerta-controles";

/** Segundos que faltan para `hasta`, o null si no hay cuenta regresiva. */
function useRestante(hasta: string | null | undefined): number | null {
  const [ahora, setAhora] = useState(0);
  useEffect(() => {
    if (!hasta) return;
    const tick = () => setAhora(Date.now());
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [hasta]);
  if (!hasta || ahora === 0) return null;
  return Math.max(0, Math.ceil((Date.parse(hasta) - ahora) / 1000));
}

export function PuertaView() {
  const puerta = useQuery({
    queryKey: ["puerta"],
    queryFn: () => api("/api/bff/puerta", puertaSchema),
    refetchInterval: 2_000,
  });
  const restante = useRestante(puerta.data?.abierta ? puerta.data.abiertaHasta : null);
  // La puerta se cierra sola al vencer abiertaHasta, antes de que llegue la próxima consulta.
  const abierta = Boolean(puerta.data?.abierta) && (restante === null || restante > 0);

  return (
    <>
      <SectionHeader titulo="Puerta" descripcion="Apertura, cierre e historial de accesos." />
      {puerta.isError && !puerta.data ? (
        <ErrorState mensaje={errorMessage(puerta.error)} onReintentar={() => puerta.refetch()} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-card bg-card p-5 ring-1 ring-border">
            {puerta.data ? (
              <Persiana abierta={abierta} restante={restante !== null ? `${restante} s` : undefined} />
            ) : (
              <Skeleton className="mx-auto aspect-[4/3] w-full max-w-md rounded-card" />
            )}
          </div>
          <div className="flex flex-col gap-6">
            <AperturaCard abierta={abierta} />
            <SimuladorCamara />
          </div>
        </div>
      )}
      <HistorialAccesos />
    </>
  );
}
