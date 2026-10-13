"use client";

import { useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChevronDown, Hourglass, Info, ShieldAlert } from "lucide-react";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIAS_SEMANA, DIAS_SEMANA_LARGO, MESES, fmtDec1, fmtMetrica, fmtPct, useAnalitica } from "@/lib/analitica";
import { llegadasSchema, pronosticoOcupacionSchema, vacanciaSchema } from "@/lib/analitica-schemas";
import { formatearFecha } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EstadoConsulta, GraficaOTabla, InsuficienteState, TablaSimple, Tarjeta } from "@/app/(panel)/analitica/comunes";
import { Tooltip as Tip } from "@/app/(panel)/analitica/tooltip";

const config = { mediana: { label: "Carros (mediana)", color: "var(--serie-carro)" } } satisfies ChartConfig;

/** "2026-10-19" -> "19 oct", sin año ni zona horaria. */
function fechaCorta(fecha: string) {
  const [, m, d] = fecha.split("-").map(Number);
  return `${d} ${MESES[m - 1]}`;
}

/** Nombre del día calculado de la fecha (no se depende del texto del backend). */
function nombreDia(fecha: string) {
  const [y, m, d] = fecha.split("-").map(Number);
  return DIAS_SEMANA_LARGO[(new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7];
}

const n = (r: Record<string, unknown> | null | undefined, k: string) =>
  typeof r?.[k] === "number" ? (r[k] as number) : undefined;

/* ---------- Aviso del modelo: cifras leídas de metricas.resumen, nunca fijas ---------- */

export function AvisoModelo({ simulados, horizonte }: { simulados: boolean; horizonte: number }) {
  const oc = useAnalitica("pronostico/ocupacion", pronosticoOcupacionSchema, simulados, { horizonteDias: horizonte });
  const va = useAnalitica("pronostico/vacancia", vacanciaSchema, simulados);
  const ro = oc.data?.metricas.resumen;
  const rv = va.data?.metricas.resumen;
  const maeM = n(ro, "mae_modelo");
  const maeB = n(ro, "mae_baseline_semana_pasada");
  const cob = n(ro, "cobertura_p10_p90");
  const bM = n(rv, "brier_modelo");
  const bB = n(rv, "brier_baseline_tasa_constante");
  const nV = n(rv, "n");
  const mejora = maeM !== undefined && maeB ? Math.round((1 - maeM / maeB) * 100) : undefined;

  return (
    <aside className="flex items-start gap-3 rounded-card bg-st-por-vencer-bg p-4 text-sm text-st-por-vencer" aria-label="Limitaciones del pronóstico">
      <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">Pronóstico experimental: el modelo apenas supera a un método simple.</p>
        {maeM !== undefined && maeB !== undefined ? (
          <p className="tabular">
            Ocupación: probado con datos simulados, erra {fmtMetrica(maeM)} carros por hora frente a {fmtMetrica(maeB)} de repetir la semana pasada
            {mejora !== undefined ? ` (apenas un ${mejora} % mejor)` : ""}.
            {cob !== undefined ? ` El rango acertó el ${Math.round(cob * 100)} % de las veces.` : ""}
          </p>
        ) : null}
        {bM !== undefined && bB !== undefined ? (
          <p className="tabular">
            Cupo libre: empata con suponer la misma tasa de renovación para todos (Brier {fmtMetrica(bM, 3)} frente a {fmtMetrica(bB, 3)}
            {nV ? `, n = ${nV}` : ""}).
          </p>
        ) : null}
        <p>La hora de llegada no está validada. Úsalo como orientación, no como dato.</p>
      </div>
    </aside>
  );
}

/* ---------- Vacancia: probabilidad de que se libere al menos un cupo contratado ---------- */

function Escalon({ etiqueta, p, p10, p90 }: { etiqueta: string; p: number; p10: number; p90: number }) {
  return (
    <li className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 text-sm">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span className="relative h-3 rounded-sm bg-muted" aria-hidden>
        <span className="absolute inset-y-0 rounded-sm bg-serie-carro/25" style={{ left: `${p10 * 100}%`, width: `${Math.max(0.5, (p90 - p10) * 100)}%` }} />
        <span className="absolute inset-y-[-3px] w-1 rounded-sm bg-serie-carro" style={{ left: `calc(${p * 100}% - 2px)` }} />
      </span>
      <span className="tabular whitespace-nowrap text-right">
        <strong>{fmtPct(p)}</strong> <span className="text-muted-foreground">({Math.round(p10 * 100)}-{Math.round(p90 * 100)} %)</span>
      </span>
    </li>
  );
}

export function VacanciaBloque({ simulados }: { simulados: boolean }) {
  const q = useAnalitica("pronostico/vacancia", vacanciaSchema, simulados);
  const tipos = Object.entries(q.data?.porTipo ?? {}).sort(([a], [b]) => (a === "CARRO" ? -1 : b === "CARRO" ? 1 : 0));

  return (
    <Tarjeta
      titulo="Cupo libre estimado"
      descripcion="Probabilidad de que se libere al menos un cupo contratado (no es espacio físico ahora mismo)"
      origen="pronostico"
      simulados={simulados}
      className="lg:col-span-2"
    >
      <EstadoConsulta q={q} tituloError="No se pudo calcular el cupo libre">
        <div className="grid gap-8 lg:grid-cols-2">
          {tipos.map(([tipo, v]) => (
            <div key={tipo} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">
                {tipo === "MOTO" ? "Moto" : "Carros"}{" "}
                <span className="tabular font-normal text-muted-foreground">
                  ({v.titulares} de {v.capacidad} con titular{v.cuposSinAsignar ? `; ${v.cuposSinAsignar} sin asignar, ya libre` : ""})
                </span>
              </h3>
              <ul className="flex flex-col gap-2" aria-label={`Probabilidad por horizonte, ${tipo === "MOTO" ? "moto" : "carros"}`}>
                {v.probabilidades.map((p) => (
                  <Escalon key={p.dias} etiqueta={`${p.dias} días (${fechaCorta(p.fecha)})`} p={p.probabilidad} p10={p.p10} p90={p.p90} />
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                {v.primeraFechaProbMayorIgual50
                  ? `Primera fecha con 50 % o más: ${formatearFecha(v.primeraFechaProbMayorIgual50)}.`
                  : "Ningún horizonte llega al 50 %."}{" "}
                La banda clara es el rango p10-p90 por la incertidumbre de pocos datos por usuario.
              </p>
              {v.detalle.length ? (
                <details className="group rounded-lg ring-1 ring-border">
                  <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium">
                    <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
                    Detalle por titular ({v.detalle.length})
                  </summary>
                  <div className="overflow-x-auto border-t border-border">
                    <TablaSimple
                      caption={`Detalle por titular, ${tipo}`}
                      columnas={[{ titulo: "Cupo" }, { titulo: "Estado" }, { titulo: "Fin del periodo" }, { titulo: "Se liberaría" }, { titulo: "Renueva", numerica: true }]}
                      filas={v.detalle.map((d) => [d.cupo ?? "-", d.estado === "VENCIDO" ? "Vencido" : d.estado === "ACTIVO" ? "Activo" : (d.estado ?? "-"), formatearFecha(d.fechaFin), formatearFecha(d.fechaLiberacionPotencial), fmtPct(d.pRenovar)])}
                    />
                  </div>
                </details>
              ) : null}
            </div>
          ))}
        </div>
      </EstadoConsulta>
    </Tarjeta>
  );
}

/* ---------- Ocupación esperada por hora, siempre con banda p10-p90 ---------- */

export function OcupacionEsperadaBloque({
  simulados,
  horizonte,
  onHorizonte,
  onVerSimulados,
}: {
  simulados: boolean;
  horizonte: number;
  onHorizonte: (h: number) => void;
  onVerSimulados: () => void;
}) {
  const q = useAnalitica("pronostico/ocupacion", pronosticoOcupacionSchema, simulados, { horizonteDias: horizonte });
  const d = q.data;
  const cap = d?.capacidad ?? 6;
  const minObs = d?.minObservacionesHora ?? 3;
  const puntos = (d?.dias ?? []).flatMap((dia) => {
    const [y, m, dd] = dia.fecha.split("-").map(Number);
    const dow = (new Date(Date.UTC(y, m - 1, dd)).getUTCDay() + 6) % 7;
    return dia.horas.map((h) => ({
      clave: `${dia.fecha} ${h.hora}`,
      etiqueta: `${DIAS_SEMANA[dow]} ${dd}, ${h.hora}:00`,
      corta: h.hora === 0 ? `${DIAS_SEMANA[dow]} ${dd}` : `${h.hora} h`,
      hora: h.hora,
      // Una hora sin datos suficientes queda como hueco, nunca como cero.
      mediana: h.suficiente ? h.mediana : null,
      rango: h.suficiente && h.p10 != null && h.p90 != null ? [h.p10, h.p90] : null,
      p10: h.p10,
      p90: h.p90,
      observaciones: h.observaciones,
      suficiente: h.suficiente,
    }));
  });
  const ticks = puntos.filter((p) => (horizonte > 3 ? p.hora === 0 : p.hora % 6 === 0)).map((p) => p.clave);
  const corta = new Map(puntos.map((p) => [p.clave, horizonte > 3 ? p.corta : p.hora === 0 ? p.corta : `${p.hora} h`]));
  const insuf = puntos.filter((p) => !p.suficiente).length;
  const masAlta = puntos.reduce<(typeof puntos)[number] | null>((a, p) => (p.mediana != null && (!a || (a.mediana ?? 0) < p.mediana) ? p : a), null);

  return (
    <Tarjeta
      titulo="Ocupación esperada"
      descripcion="Carros dentro por hora: lo más probable (línea) y el rango donde cae 8 de cada 10 veces (banda)"
      origen="pronostico"
      simulados={simulados}
      className="lg:col-span-2"
      acciones={
        <Select value={String(horizonte)} onValueChange={(v) => onHorizonte(Number(v))}>
          <SelectTrigger className="w-32" aria-label="Horizonte del pronóstico">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 3, 7, 14].map((h) => (
              <SelectItem key={h} value={String(h)}>
                {h === 1 ? "Hoy" : `${h} días`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <EstadoConsulta q={q} tituloError="No se pudo calcular la ocupación esperada">
        {d?.datosInsuficientes ? (
          <InsuficienteState
            detalle={`Hay ${fmtDec1(d.semanasHistoria)} semanas de datos ${simulados ? "" : "reales "}y el pronóstico necesita ${d.minSemanasHistoria ?? 4}. No se muestra ninguna cifra para no inventarla.`}
            progreso={d.minSemanasHistoria ? d.semanasHistoria / d.minSemanasHistoria : undefined}
            onVerSimulados={simulados ? undefined : onVerSimulados}
          />
        ) : (
          <>
            <GraficaOTabla
              resumen={`${masAlta ? `Hora más concurrida prevista: ${masAlta.etiqueta}, unos ${fmtDec1(masAlta.mediana)} carros (entre ${fmtDec1(masAlta.p10)} y ${fmtDec1(masAlta.p90)}). ` : ""}${insuf ? `${insuf} horas sin datos suficientes quedan en blanco. ` : ""}Eje fijo de 0 a ${cap}.`}
              grafica={
                <ChartContainer config={config} className="aspect-auto h-64 w-full">
                  <ComposedChart data={puntos} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="clave" ticks={ticks} tickFormatter={(v: string) => corta.get(v) ?? ""} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, cap]} allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                    <ReferenceLine y={cap} stroke="var(--muted-foreground)" strokeDasharray="4 4" label={{ value: `Capacidad ${cap}`, position: "insideTopRight", fill: "var(--muted-foreground)", fontSize: 11 }} />
                    <Area dataKey="rango" type="monotone" stroke="none" fill="var(--color-mediana)" fillOpacity={0.25} connectNulls={false} isAnimationActive={false} />
                    <Line dataKey="mediana" type="monotone" stroke="var(--color-mediana)" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        const p = payload?.[0]?.payload as (typeof puntos)[number] | undefined;
                        if (!active || !p) return null;
                        return (
                          <Tip titulo={p.etiqueta}>
                            {p.suficiente ? (
                              <>
                                <Tip.Fila color="var(--serie-carro)" nombre="Lo más probable" valor={`${fmtDec1(p.mediana)} carros`} />
                                <Tip.Fila nombre="Rango p10-p90" valor={`${fmtDec1(p.p10)} a ${fmtDec1(p.p90)}`} />
                              </>
                            ) : (
                              <Tip.Nota>
                                Sin datos suficientes: {p.observaciones} observaciones, se necesitan {minObs}.
                              </Tip.Nota>
                            )}
                          </Tip>
                        );
                      }}
                    />
                  </ComposedChart>
                </ChartContainer>
              }
              tabla={
                <TablaSimple
                  caption="Ocupación esperada por hora"
                  columnas={[{ titulo: "Hora" }, { titulo: "Lo más probable", numerica: true }, { titulo: "p10", numerica: true }, { titulo: "p90", numerica: true }, { titulo: "Observaciones", numerica: true }]}
                  filas={puntos.map((p) => (p.suficiente ? [p.etiqueta, fmtDec1(p.mediana), fmtDec1(p.p10), fmtDec1(p.p90), p.observaciones] : [p.etiqueta, "Sin datos suficientes", "-", "-", p.observaciones]))}
                />
              }
            />
            <p className="text-xs text-muted-foreground">
              En el histórico simulado nunca se llenaron los {cap} cupos, así que la probabilidad de lleno no es fiable y no se muestra.
            </p>
          </>
        )}
      </EstadoConsulta>
    </Tarjeta>
  );
}

/* ---------- Llegadas: no validado, plegado y sin cargar hasta que se abre ---------- */

export function LlegadasBloque({ simulados }: { simulados: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const q = useAnalitica("pronostico/llegadas", llegadasSchema, simulados, {}, abierto);
  const usuarios = q.data?.usuarios ?? [];

  return (
    <details
      className={cn("group rounded-card bg-card ring-1 ring-border", simulados && "border-t-4 border-sim")}
      onToggle={(e) => setAbierto((e.target as HTMLDetailsElement).open)}
    >
      <summary className="flex cursor-pointer flex-wrap items-center gap-3 p-5">
        <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden />
        <span className="font-heading text-lg font-semibold">Hora estimada de llegada por cupo</span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-st-por-vencer-bg px-2 py-1 text-xs font-semibold text-st-por-vencer">
          <ShieldAlert className="size-3.5" aria-hidden /> Sin validar
        </span>
      </summary>
      <div className="flex flex-col gap-3 border-t border-border p-5">
        <p className="text-sm text-muted-foreground">
          Perfil de costumbre por cupo (sin nombres ni placas), según las últimas {q.data?.ventanaSemanas ?? 8} semanas. Este modelo no tiene
          backtest: no lo uses para decisiones sobre una persona.
        </p>
        {abierto ? (
          <EstadoConsulta q={q} alto="h-40" tituloError="No se pudo calcular la llegada">
            {usuarios.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay usuarios con cupo.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg ring-1 ring-border">
                <TablaSimple
                  caption="Hora estimada de llegada por cupo"
                  columnas={[{ titulo: "Cupo" }, { titulo: "Próximo día probable" }, { titulo: "Hora típica" }, { titulo: "Rango habitual" }, { titulo: "Prob. de venir", numerica: true }]}
                  filas={usuarios.map((u) => {
                    const p = u.proxima;
                    if (!p || p.datosInsuficientes) {
                      return [
                        u.cupo ?? "-",
                        <span key="i" className="inline-flex items-center gap-1 text-muted-foreground">
                          <Hourglass className="size-3.5" aria-hidden /> Datos insuficientes
                        </span>,
                        "-",
                        "-",
                        "-",
                      ];
                    }
                    return [
                      u.cupo ?? "-",
                      `${nombreDia(p.fecha)} ${formatearFecha(p.fecha)}`,
                      p.horaMediana ?? "-",
                      p.horaP25 && p.horaP75 ? `${p.horaP25} a ${p.horaP75}` : "-",
                      <span key="p" className="tabular">
                        {fmtPct(p.probabilidadVenir)}
                        {p.alcanzaUmbral50 === false ? <span className="ml-1 text-xs text-muted-foreground">(menos de 50 %)</span> : null}
                      </span>,
                    ];
                  })}
                />
              </div>
            )}
          </EstadoConsulta>
        ) : null}
      </div>
    </details>
  );
}
