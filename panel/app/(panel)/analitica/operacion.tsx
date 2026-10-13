"use client";

import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts";
import { CalendarRange } from "lucide-react";
import { EmptyState } from "@/components/brand/empty-state";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import {
  DIAS_SEMANA,
  DIAS_SEMANA_LARGO,
  MESES,
  fmtDec1,
  fmtDuracion,
  restarDias,
  useAnalitica,
} from "@/lib/analitica";
import { mapaCalorSchema, ocupacionSerieSchema, permanenciaSchema } from "@/lib/analitica-schemas";
import { EstadoConsulta, GraficaOTabla, TablaSimple, Tarjeta } from "@/app/(panel)/analitica/comunes";
import { Tooltip as Tip } from "@/app/(panel)/analitica/tooltip";

const config = {
  carro: { label: "Carros", color: "var(--serie-carro)" },
  moto: { label: "Motos", color: "var(--serie-moto)" },
} satisfies ChartConfig;

/** "2026-10-06T08:00:00-05:00" -> etiquetas en hora local de Bogotá (el instante ya trae su desfase). */
function partes(inicio: string) {
  const fecha = inicio.slice(0, 10);
  const hora = Number(inicio.slice(11, 13));
  const [y, m, d] = fecha.split("-").map(Number);
  const dow = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // 0 = lunes
  return { fecha, hora, dia: d, mes: m - 1, dow };
}

/* ---------- Ocupación por hora o por día ---------- */

export function OcupacionBloque({
  simulados,
  desde,
  hasta,
  granularidad,
  capacidad,
  controles,
}: {
  simulados: boolean;
  desde: string;
  hasta: string;
  granularidad: "hora" | "dia";
  capacidad: number;
  controles: React.ReactNode;
}) {
  const q = useAnalitica("ocupacion", ocupacionSerieSchema, simulados, { desde, hasta, granularidad });
  const serie = q.data?.serie ?? [];
  const vacia = serie.every((s) => s.carro === 0 && s.moto === 0);
  const datos = serie.map((s) => {
    const p = partes(s.inicio);
    return {
      ...s,
      etiqueta: granularidad === "hora" ? `${DIAS_SEMANA[p.dow]} ${p.dia} ${String(p.hora).padStart(2, "0")} h` : `${p.dia} ${MESES[p.mes]}`,
    };
  });
  const pico = serie.reduce((a, s) => (s.picoCarro > a.v ? { v: s.picoCarro, en: s.inicio } : a), { v: 0, en: "" });
  const media = serie.length ? serie.reduce((a, s) => a + s.carro, 0) / serie.length : 0;

  return (
    <Tarjeta
      titulo="Ocupación"
      descripcion={granularidad === "hora" ? "Carros dentro, media por hora" : "Carros dentro, media por día"}
      origen="spring"
      simulados={simulados}
      acciones={controles}
      className="lg:col-span-2"
    >
      <EstadoConsulta q={q}>
        {vacia ? (
          <EmptyState icono={CalendarRange} titulo="Sin movimientos en este rango" descripcion="No hubo vehículos dentro en las fechas elegidas." />
        ) : (
          <GraficaOTabla
            resumen={`Media de ${fmtDec1(media)} de ${capacidad} carros; pico de ${pico.v} carros${pico.en ? ` el ${pico.en.slice(0, 10)}` : ""}. Eje fijo de 0 a ${capacidad}.`}
            grafica={
              <ChartContainer config={config} className="aspect-auto h-64 w-full">
                <ComposedChart data={datos} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} minTickGap={32} />
                  <YAxis domain={[0, capacidad]} allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                  <ReferenceLine y={capacidad} stroke="var(--muted-foreground)" strokeDasharray="4 4" label={{ value: `Capacidad ${capacidad}`, position: "insideTopRight", fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <Area dataKey="carro" type={granularidad === "hora" ? "stepAfter" : "monotone"} stroke="var(--color-carro)" fill="var(--color-carro)" fillOpacity={0.18} strokeWidth={2} isAnimationActive={false} />
                  <Line dataKey="moto" type={granularidad === "hora" ? "stepAfter" : "monotone"} stroke="var(--color-moto)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      const d = payload?.[0]?.payload as (typeof datos)[number] | undefined;
                      if (!active || !d) return null;
                      return (
                        <Tip titulo={d.etiqueta}>
                          <Tip.Fila color="var(--serie-carro)" nombre="Carros (media)" valor={`${fmtDec1(d.carro)} de ${capacidad}`} />
                          <Tip.Fila nombre="Pico de carros" valor={String(d.picoCarro)} />
                          <Tip.Fila color="var(--serie-moto)" nombre="Motos (media)" valor={fmtDec1(d.moto)} />
                          {d.censuradas > 0 ? <Tip.Nota>{d.censuradas} estancias sin salida registrada (se cortan a 24 h)</Tip.Nota> : null}
                        </Tip>
                      );
                    }}
                  />
                </ComposedChart>
              </ChartContainer>
            }
            tabla={
              <TablaSimple
                caption="Ocupación por periodo"
                columnas={[{ titulo: "Periodo" }, { titulo: "Carros (media)", numerica: true }, { titulo: "Pico carros", numerica: true }, { titulo: "Motos (media)", numerica: true }]}
                filas={datos.map((d) => [d.etiqueta, fmtDec1(d.carro), d.picoCarro, fmtDec1(d.moto)])}
              />
            }
          />
        )}
      </EstadoConsulta>
      <Leyenda />
    </Tarjeta>
  );
}

function Leyenda() {
  return (
    <ul className="flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Leyenda">
      <li className="flex items-center gap-2">
        <span className="h-0.5 w-5 bg-serie-carro" aria-hidden /> Carros (línea continua)
      </li>
      <li className="flex items-center gap-2">
        <span className="w-5 border-t-2 border-dashed border-serie-moto" aria-hidden /> Motos (línea discontinua)
      </li>
    </ul>
  );
}

/* ---------- Mapa de calor día de la semana x hora ---------- */

const MIN_MUESTRAS = 3;
const SEMANAS_MAPA = 12;

export function MapaCalorBloque({ simulados, hoy }: { simulados: boolean; hoy: string }) {
  const desde = restarDias(hoy, SEMANAS_MAPA * 7 - 1);
  const q = useAnalitica("ocupacion/mapa-calor", mapaCalorSchema, simulados, { desde, hasta: hoy });
  const cap = q.data?.cuposCarro || 6;
  const celdas = new Map((q.data?.celdas ?? []).map((c) => [`${c.diaSemana}-${c.hora}`, c]));
  const validas = (q.data?.celdas ?? []).filter((c) => c.muestras >= MIN_MUESTRAS);
  const max = validas.reduce((a, c) => (c.ocupacionMediaCarro > a.ocupacionMediaCarro ? c : a), validas[0]);

  const color = (v: number) => {
    const paso = Math.min(4, Math.floor((v / cap) * 5));
    return `color-mix(in oklab, var(--serie-carro) ${[8, 25, 45, 70, 100][paso]}%, var(--card))`;
  };

  return (
    <Tarjeta titulo="Mapa de calor" descripcion={`Carros dentro en promedio, últimas ${SEMANAS_MAPA} semanas`} origen="spring" simulados={simulados}>
      <EstadoConsulta q={q} alto="h-48">
        {validas.length === 0 ? (
          <EmptyState icono={CalendarRange} titulo="Sin muestras suficientes" descripcion={`Cada celda necesita al menos ${MIN_MUESTRAS} horas observadas.`} />
        ) : (
          <GraficaOTabla
            resumen={max ? `Hora más ocupada: ${DIAS_SEMANA_LARGO[max.diaSemana - 1]} a las ${max.hora}:00, con ${fmtDec1(max.ocupacionMediaCarro)} de ${cap} carros.` : ""}
            grafica={
              <div className="overflow-x-auto">
                <div className="grid min-w-[560px] gap-0.5" style={{ gridTemplateColumns: "2.5rem repeat(24, minmax(0, 1fr))" }} aria-hidden>
                  <span />
                  {Array.from({ length: 24 }, (_, h) => (
                    <span key={h} className="tabular text-center text-[10px] text-muted-foreground">
                      {h % 3 === 0 ? h : ""}
                    </span>
                  ))}
                  {DIAS_SEMANA.map((dia, i) => (
                    <Fila key={dia} dia={dia}>
                      {Array.from({ length: 24 }, (_, h) => {
                        const c = celdas.get(`${i + 1}-${h}`);
                        const ok = c && c.muestras >= MIN_MUESTRAS;
                        return (
                          <span
                            key={h}
                            title={ok ? `${DIAS_SEMANA_LARGO[i]} ${h}:00: ${fmtDec1(c.ocupacionMediaCarro)} carros (${c.muestras} muestras)` : `${DIAS_SEMANA_LARGO[i]} ${h}:00: sin muestras suficientes`}
                            className="h-6 rounded-sm"
                            style={
                              ok
                                ? { background: color(c.ocupacionMediaCarro) }
                                : { backgroundImage: "repeating-linear-gradient(45deg, var(--border) 0 2px, transparent 2px 6px)" }
                            }
                          />
                        );
                      })}
                    </Fila>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>0 carros</span>
                  {[0, 1, 2, 3, 4].map((p) => (
                    <span key={p} className="h-3 w-6 rounded-sm" style={{ background: color(((p + 0.5) / 5) * cap) }} />
                  ))}
                  <span>{cap} carros</span>
                  <span className="ml-2 inline-flex items-center gap-1">
                    <span className="h-3 w-6 rounded-sm" style={{ backgroundImage: "repeating-linear-gradient(45deg, var(--border) 0 2px, transparent 2px 6px)" }} />
                    Sin muestras
                  </span>
                </div>
              </div>
            }
            tabla={
              <TablaSimple
                caption="Ocupación media por día y hora"
                columnas={[{ titulo: "Día" }, { titulo: "Hora", numerica: true }, { titulo: "Carros (media)", numerica: true }, { titulo: "Muestras", numerica: true }]}
                filas={validas.map((c) => [DIAS_SEMANA_LARGO[c.diaSemana - 1], `${c.hora}:00`, fmtDec1(c.ocupacionMediaCarro), c.muestras])}
              />
            }
          />
        )}
      </EstadoConsulta>
    </Tarjeta>
  );
}

function Fila({ dia, children }: { dia: string; children: React.ReactNode }) {
  return (
    <>
      <span className="self-center text-xs text-muted-foreground">{dia}</span>
      {children}
    </>
  );
}

/* ---------- Permanencia ---------- */

const MIN_VISITAS = 10;

export function PermanenciaBloque({ simulados, desde, hasta }: { simulados: boolean; desde: string; hasta: string }) {
  const q = useAnalitica("permanencia", permanenciaSchema, simulados, { desde, hasta });
  const filas = q.data?.porTipo ?? [];
  const hist = q.data?.histogramaHoraEntrada ?? [];
  const totalEntradas = hist.reduce((a, h) => a + h.carro + h.moto, 0);
  const pico = hist.reduce((a, h) => (h.carro + h.moto > a.carro + a.moto ? h : a), hist[0]);

  return (
    <Tarjeta titulo="Permanencia" descripcion="Cuánto dura una visita y a qué hora se llega" origen="spring" simulados={simulados} className="lg:col-span-2">
      <EstadoConsulta q={q} alto="h-48">
        {totalEntradas === 0 ? (
          <EmptyState icono={CalendarRange} titulo="Sin visitas en este rango" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <dl className="flex flex-col gap-4">
              {filas.map((f) =>
                f.visitas < MIN_VISITAS ? (
                  <div key={f.tipo} className="text-sm text-muted-foreground">
                    {f.tipo === "MOTO" ? "Motos" : "Carros"}: solo {f.visitas} visitas, muy pocas para dar una duración típica.
                  </div>
                ) : (
                  <div key={f.tipo} className="flex flex-col gap-1">
                    <dt className="text-sm text-muted-foreground">
                      Estancia típica, {f.tipo === "MOTO" ? "motos" : "carros"} ({f.visitas} visitas)
                    </dt>
                    <dd className="tabular font-heading text-2xl font-bold">{fmtDuracion(f.estanciaMin?.mediana)}</dd>
                    <dd className="tabular text-xs text-muted-foreground">
                      La mitad dura entre {fmtDuracion(f.estanciaMin?.p25)} y {fmtDuracion(f.estanciaMin?.p75)}. Tiempo típico fuera entre visitas: {fmtDuracion(f.fueraMin?.mediana)}.
                    </dd>
                  </div>
                ),
              )}
            </dl>
            <GraficaOTabla
              resumen={pico ? `Entradas por hora del día; la hora con más entradas es las ${pico.hora}:00 (${pico.carro + pico.moto}).` : ""}
              grafica={
                <ChartContainer config={config} className="aspect-auto h-48 w-full">
                  <BarChart data={hist} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="hora" tickLine={false} axisLine={false} interval={2} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                    <Bar dataKey="carro" stackId="e" fill="var(--color-carro)" stroke="var(--card)" strokeWidth={1} isAnimationActive={false} />
                    <Bar dataKey="moto" stackId="e" fill="var(--color-moto)" stroke="var(--card)" strokeWidth={1} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        const d = payload?.[0]?.payload as (typeof hist)[number] | undefined;
                        if (!active || !d) return null;
                        return (
                          <Tip titulo={`Entradas a las ${d.hora}:00`}>
                            <Tip.Fila color="var(--serie-carro)" nombre="Carros" valor={String(d.carro)} />
                            <Tip.Fila color="var(--serie-moto)" nombre="Motos" valor={String(d.moto)} />
                          </Tip>
                        );
                      }}
                    />
                  </BarChart>
                </ChartContainer>
              }
              tabla={
                <TablaSimple
                  caption="Entradas por hora"
                  columnas={[{ titulo: "Hora", numerica: true }, { titulo: "Carros", numerica: true }, { titulo: "Motos", numerica: true }]}
                  filas={hist.map((h) => [`${h.hora}:00`, h.carro, h.moto])}
                />
              }
            />
          </div>
        )}
      </EstadoConsulta>
    </Tarjeta>
  );
}
