"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FlaskConical, X } from "lucide-react";
import { KpiCard } from "@/components/brand/kpi-card";
import { SectionHeader } from "@/components/brand/section-header";
import { ErrorState } from "@/components/brand/error-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { errorMessage } from "@/lib/api-client";
import { MESES, RANGOS, hoyBogota, rangoFechas, useAnalitica, useSimulados, type RangoId } from "@/lib/analitica";
import { resumenSchema, type Resumen } from "@/lib/analitica-schemas";
import { formatearFechaHora, formatearMonto } from "@/lib/format";
import { cn } from "@/lib/utils";
import { IngresosBloque, MorosidadBloque } from "@/app/(panel)/analitica/dinero";
import { MapaCalorBloque, OcupacionBloque, PermanenciaBloque } from "@/app/(panel)/analitica/operacion";
import { AvisoModelo, LlegadasBloque, OcupacionEsperadaBloque, VacanciaBloque } from "@/app/(panel)/analitica/pronostico";

const VISTAS = ["operacion", "dinero", "pronostico"] as const;
type Vista = (typeof VISTAS)[number];

function Kpis({ r, simulados }: { r: Resumen; simulados: boolean }) {
  const carro = r.cupos.find((c) => c.tipo === "CARRO");
  const moto = r.cupos.find((c) => c.tipo === "MOTO");
  const dif = r.ingresos.mesActual - r.ingresos.mesAnterior;
  const mes = Number(r.generadoEn.slice(5, 7));
  const prox = r.vencimientos.lista.slice(0, 3).map((v) => `${v.cupo} en ${v.diasRestantes} d`).join(", ");
  const borde = simulados ? "border-t-4 border-sim" : "";
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <KpiCard
        className={borde}
        titulo="Contratados"
        valor={`${carro?.asignados ?? 0} de ${carro?.totales ?? 0}`}
        unidad="carros"
        periodo={`Moto ${moto?.asignados ?? 0} de ${moto?.totales ?? 0}. Usuarios: ${r.usuarios.activo} activos, ${r.usuarios.vencido} vencidos, ${r.usuarios.suspendido} suspendidos`}
      />
      <KpiCard
        className={borde}
        titulo="Dentro ahora"
        valor={`${r.dentroAhora.carro} de ${carro?.totales ?? 0}`}
        unidad="carros"
        periodo={`Moto ${r.dentroAhora.moto} de ${moto?.totales ?? 0}`}
      />
      <KpiCard
        className={borde}
        titulo={`Ingresos de ${MESES[mes - 1]}`}
        valor={formatearMonto(r.ingresos.mesActual)}
        periodo="Mes en curso"
        comparacion={{
          texto: `${dif >= 0 ? "+" : "-"}${formatearMonto(Math.abs(dif))} frente a ${MESES[(mes + 10) % 12]} completo`,
          tendencia: dif > 0 ? "sube" : dif < 0 ? "baja" : "igual",
        }}
      />
      <KpiCard className={borde} titulo="Pagos por revisar" valor={r.pagosPendientes} unidad={r.pagosPendientes === 1 ? "pago" : "pagos"} />
      <KpiCard
        className={cn(borde, "col-span-2 lg:col-span-1")}
        titulo="Vencen pronto"
        valor={`${r.vencimientos.en7Dias} / ${r.vencimientos.en15Dias} / ${r.vencimientos.en30Dias}`}
        periodo={`En 7, 15 y 30 días${prox ? `. Próximos: ${prox}` : ""}`}
      />
    </div>
  );
}

export function AnaliticaView() {
  const [simulados, setSimulados] = useSimulados();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const vista: Vista = (VISTAS as readonly string[]).includes(params.get("vista") ?? "") ? (params.get("vista") as Vista) : "operacion";

  const [hoy] = useState(hoyBogota);
  const [rango, setRango] = useState<RangoId>("30d");
  const [granularidad, setGranularidad] = useState<"hora" | "dia">("hora");
  const [anio, setAnio] = useState(() => Number(hoy.slice(0, 4)));
  const [horizonte, setHorizonte] = useState(7);
  const { desde, hasta, dias } = rangoFechas(rango, hoy);
  // Por hora solo hasta 31 días: más puntos no se leen.
  const gran = dias > 31 ? "dia" : granularidad;

  const resumen = useAnalitica("resumen", resumenSchema, simulados);

  useEffect(() => {
    document.title = simulados ? "Analítica (simulado) | Cupo" : "Analítica | Cupo";
  }, [simulados]);

  function cambiarVista(v: string) {
    const q = new URLSearchParams(params.toString());
    q.set("vista", v);
    router.replace(`${pathname}?${q}`, { scroll: false });
  }

  const selectorRango = (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Rango de fechas">
      {RANGOS.map((r) => (
        <Button key={r.id} size="sm" variant={rango === r.id ? "default" : "outline"} aria-pressed={rango === r.id} onClick={() => setRango(r.id)}>
          {r.etiqueta}
        </Button>
      ))}
    </div>
  );
  const selectorGranularidad =
    dias > 31 ? null : (
      <div className="flex items-center gap-1" role="group" aria-label="Granularidad">
        {(["hora", "dia"] as const).map((g) => (
          <Button key={g} size="sm" variant={gran === g ? "secondary" : "ghost"} aria-pressed={gran === g} onClick={() => setGranularidad(g)}>
            {g === "hora" ? "Por hora" : "Por día"}
          </Button>
        ))}
      </div>
    );

  return (
    <>
      <SectionHeader
        titulo="Analítica"
        descripcion={resumen.data ? `Actualizado ${formatearFechaHora(resumen.data.generadoEn)}, hora Colombia` : "Ocupación, dinero y pronóstico"}
        acciones={
          <div className="flex min-h-12 items-center gap-3 rounded-lg bg-card px-3 ring-1 ring-border">
            <Switch id="simulados" checked={simulados} onCheckedChange={setSimulados} />
            <Label htmlFor="simulados" className="flex flex-col items-start gap-0 leading-tight">
              <span>Incluir datos simulados</span>
              <span className="text-xs font-normal text-muted-foreground">Solo para demostración</span>
            </Label>
          </div>
        }
      />

      {simulados ? (
        <div
          role="status"
          className="sticky top-14 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card px-4 py-3 text-sm font-semibold text-sim ring-1 ring-sim"
          style={{ backgroundImage: "repeating-linear-gradient(135deg, var(--sim-bg) 0 14px, var(--card) 14px 28px)" }}
        >
          <span className="flex items-center gap-2 rounded-lg bg-sim-bg px-2 py-1">
            <FlaskConical className="size-4" aria-hidden />
            Datos simulados incluidos: estas cifras no son reales.
          </span>
          <Button size="sm" variant="outline" onClick={() => setSimulados(false)}>
            <X className="size-4" aria-hidden /> Quitar
          </Button>
        </div>
      ) : null}

      {resumen.isError && !resumen.data ? (
        <ErrorState titulo="No se pudo cargar el resumen" mensaje={errorMessage(resumen.error)} onReintentar={() => resumen.refetch()} />
      ) : resumen.data ? (
        <Kpis r={resumen.data} simulados={simulados} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-card" />
          ))}
        </div>
      )}

      <Tabs value={vista} onValueChange={cambiarVista} className="gap-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="operacion">Operación</TabsTrigger>
          <TabsTrigger value="dinero">Dinero</TabsTrigger>
          <TabsTrigger value="pronostico">Pronóstico</TabsTrigger>
        </TabsList>

        <TabsContent value="operacion" className="flex flex-col gap-6">
          {selectorRango}
          <div className="grid gap-6 lg:grid-cols-2">
            <OcupacionBloque
              simulados={simulados}
              desde={desde}
              hasta={hasta}
              granularidad={gran}
              capacidad={resumen.data?.cupos.find((c) => c.tipo === "CARRO")?.totales || 6}
              controles={selectorGranularidad}
            />
            <MapaCalorBloque simulados={simulados} hoy={hoy} />
            <PermanenciaBloque simulados={simulados} desde={desde} hasta={hasta} />
          </div>
        </TabsContent>

        <TabsContent value="dinero" className="grid gap-6 lg:grid-cols-2">
          <IngresosBloque simulados={simulados} anio={anio} anioActual={Number(hoy.slice(0, 4))} mesActual={Number(hoy.slice(5, 7))} onAnio={setAnio} />
          <MorosidadBloque simulados={simulados} />
        </TabsContent>

        <TabsContent value="pronostico" className="flex flex-col gap-6">
          <AvisoModelo simulados={simulados} horizonte={horizonte} />
          <div className="grid gap-6 lg:grid-cols-2">
            <OcupacionEsperadaBloque simulados={simulados} horizonte={horizonte} onHorizonte={setHorizonte} onVerSimulados={() => setSimulados(true)} />
            <VacanciaBloque simulados={simulados} />
          </div>
          <LlegadasBloque simulados={simulados} />
        </TabsContent>
      </Tabs>
    </>
  );
}
