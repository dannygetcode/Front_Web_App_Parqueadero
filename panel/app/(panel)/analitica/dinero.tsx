"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { CircleCheck, Wallet } from "lucide-react";
import { EmptyState } from "@/components/brand/empty-state";
import { StatusBadge } from "@/components/brand/status-badge";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MESES, fmtDec1, useAnalitica } from "@/lib/analitica";
import { ingresosSchema, morosidadSchema } from "@/lib/analitica-schemas";
import { formatearFecha, formatearMonto } from "@/lib/format";
import { EstadoConsulta, GraficaOTabla, TablaSimple, Tarjeta } from "@/app/(panel)/analitica/comunes";
import { Tooltip as Tip } from "@/app/(panel)/analitica/tooltip";

const config = {
  carro: { label: "Carros", color: "var(--serie-carro)" },
  moto: { label: "Motos", color: "var(--serie-moto)" },
} satisfies ChartConfig;

const miles = (v: number) => (v === 0 ? "0" : `${Math.round(v / 1000).toLocaleString("es-CO")} mil`);

/* ---------- Ingresos ---------- */

export function IngresosBloque({
  simulados,
  anio,
  anioActual,
  mesActual,
  onAnio,
}: {
  simulados: boolean;
  anio: number;
  anioActual: number;
  mesActual: number;
  onAnio: (a: number) => void;
}) {
  const q = useAnalitica("ingresos", ingresosSchema, simulados, { anio });
  const ultimoMes = anio === anioActual ? mesActual : 12;
  const meses = (q.data?.meses ?? []).filter((m) => m.mes <= ultimoMes);
  const datos = meses.map((m) => ({
    etiqueta: MESES[m.mes - 1],
    carro: m.carro.ingresos,
    moto: m.moto.ingresos,
    total: m.total,
    pagos: m.pagos,
    acumulado: m.acumulado,
    ticket: m.ticketPromedio,
  }));
  // Cambios de tarifa que empiezan dentro del año: se anotan para que un salto no se lea como más clientes.
  const saltos = (q.data?.tarifas ?? []).filter((t) => t.vigenteDesde.startsWith(String(anio)));
  const mesesSalto = [...new Set(saltos.map((t) => MESES[Number(t.vigenteDesde.slice(5, 7)) - 1]))];
  const total = q.data?.totalAnual;
  const anios = Array.from({ length: anioActual - 2025 + 1 }, (_, i) => 2025 + i);

  return (
    <Tarjeta
      titulo="Ingresos"
      descripcion="Pagos aprobados por mes de registro (las cortesías no suman)"
      origen="spring"
      simulados={simulados}
      className="lg:col-span-2"
      acciones={
        <Select value={String(anio)} onValueChange={(v) => onAnio(Number(v))}>
          <SelectTrigger className="w-28" aria-label="Año">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {anios.map((a) => (
              <SelectItem key={a} value={String(a)}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <EstadoConsulta q={q}>
        {total && total.pagos === 0 ? (
          <EmptyState icono={Wallet} titulo={`Sin ingresos registrados en ${anio}`} />
        ) : (
          <>
            {total ? (
              <p className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>
                  Total {anio}:{" "}
                  <strong className="tabular font-heading text-2xl text-foreground">{formatearMonto(total.total)}</strong>
                </span>
                <span className="tabular">{total.pagos} pagos</span>
                <span className="tabular">
                  Carros {formatearMonto(total.carro)} · Motos {formatearMonto(total.moto)}
                </span>
              </p>
            ) : null}
            <GraficaOTabla
              resumen={`Ingresos mensuales de ${anio} por tipo de vehículo, apilados.${saltos.length ? ` Cambio de tarifa desde ${saltos.map((t) => `${t.tipo === "MOTO" ? "moto" : "carro"} ${formatearMonto(t.valorMensual)}`).join(" y ")} (${formatearFecha(saltos[0].vigenteDesde)}): parte de la subida es precio, no más clientes.` : ""}`}
              grafica={
                <ChartContainer config={config} className="aspect-auto h-64 w-full">
                  <BarChart data={datos} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={miles} tickLine={false} axisLine={false} width={56} />
                    {mesesSalto.map((m) => (
                      <ReferenceLine key={m} x={m} stroke="var(--muted-foreground)" strokeDasharray="4 4" label={{ value: "Nueva tarifa", position: "top", fill: "var(--muted-foreground)", fontSize: 11 }} />
                    ))}
                    <Bar dataKey="carro" stackId="i" fill="var(--color-carro)" stroke="var(--card)" strokeWidth={2} isAnimationActive={false} />
                    <Bar dataKey="moto" stackId="i" fill="var(--color-moto)" stroke="var(--card)" strokeWidth={2} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        const d = payload?.[0]?.payload as (typeof datos)[number] | undefined;
                        if (!active || !d) return null;
                        return (
                          <Tip titulo={`${d.etiqueta} ${anio}`}>
                            <Tip.Fila color="var(--serie-carro)" nombre="Carros" valor={formatearMonto(d.carro)} />
                            <Tip.Fila color="var(--serie-moto)" nombre="Motos" valor={formatearMonto(d.moto)} />
                            <Tip.Fila nombre="Total" valor={formatearMonto(d.total)} />
                            <Tip.Fila nombre="Pagos" valor={String(d.pagos)} />
                          </Tip>
                        );
                      }}
                    />
                  </BarChart>
                </ChartContainer>
              }
              tabla={
                <TablaSimple
                  caption={`Ingresos de ${anio} por mes`}
                  columnas={[
                    { titulo: "Mes" },
                    { titulo: "Carros", numerica: true },
                    { titulo: "Motos", numerica: true },
                    { titulo: "Total", numerica: true },
                    { titulo: "Pagos", numerica: true },
                    { titulo: "Ticket promedio", numerica: true },
                    { titulo: "Acumulado", numerica: true },
                  ]}
                  filas={datos.map((d) => [d.etiqueta, formatearMonto(d.carro), formatearMonto(d.moto), formatearMonto(d.total), d.pagos, formatearMonto(d.ticket), formatearMonto(d.acumulado)])}
                />
              }
            />
            <ul className="flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Leyenda">
              <li className="flex items-center gap-2"><span className="size-3 rounded-sm bg-serie-carro" aria-hidden /> Carros</li>
              <li className="flex items-center gap-2"><span className="size-3 rounded-sm bg-serie-moto" aria-hidden /> Motos</li>
            </ul>
          </>
        )}
      </EstadoConsulta>
    </Tarjeta>
  );
}

/* ---------- Morosidad ---------- */

const MIN_TARDIOS = 5;

function nombreMes(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  return `${MESES[m - 1]} ${y}`;
}

export function MorosidadBloque({ simulados }: { simulados: boolean }) {
  const q = useAnalitica("morosidad", morosidadSchema, simulados);
  const d = q.data;

  return (
    <Tarjeta titulo="Morosidad" descripcion="Usuarios vencidos que ya habían pagado antes" origen="spring" simulados={simulados} className="lg:col-span-2">
      <EstadoConsulta q={q}>
        {d ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="flex flex-col gap-3">
              <p className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>
                  Adeudado:{" "}
                  <strong className="tabular font-heading text-2xl text-foreground">{formatearMonto(d.totalAdeudado)}</strong>
                </span>
                <span className="tabular">
                  {d.usuarios.length} {d.usuarios.length === 1 ? "usuario" : "usuarios"} en mora
                </span>
              </p>
              {d.usuarios.length === 0 ? (
                <p className="flex items-center gap-2 rounded-card bg-st-libre-bg p-3 text-sm font-medium text-st-libre">
                  <CircleCheck className="size-4" aria-hidden /> Nadie en mora.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg ring-1 ring-border">
                  <TablaSimple
                    caption="Usuarios en mora"
                    columnas={[{ titulo: "Cupo" }, { titulo: "Estado" }, { titulo: "Venció" }, { titulo: "Días de mora", numerica: true }, { titulo: "Meses", numerica: true }, { titulo: "Monto", numerica: true }]}
                    filas={d.usuarios.map((u) => [u.cupo ?? "-", <StatusBadge key="e" estado="vencido" />, formatearFecha(u.vencioEl), u.diasMora, u.mesesAdeudados, formatearMonto(u.montoAdeudado)])}
                  />
                </div>
              )}
              {d.vencidosSinPagoPrevio > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Además, {d.vencidosSinPagoPrevio} {d.vencidosSinPagoPrevio === 1 ? "usuario vencido nunca ha pagado" : "usuarios vencidos nunca han pagado"} (no se cuentan como mora).
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-semibold">Renovación a tiempo (últimos meses)</h3>
                <p className="text-xs text-muted-foreground">Pagaron el periodo siguiente dentro de {d.atraso.diasGracia} días de gracia.</p>
                {d.atraso.renovacionMensual.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Sin vencimientos en el periodo.</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {d.atraso.renovacionMensual.map((r) => (
                      <li key={r.mes} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{nombreMes(r.mes)}</span>
                        <span className="h-2 overflow-hidden rounded-sm bg-muted" aria-hidden>
                          <span className="block h-full bg-serie-carro" style={{ width: r.vencian ? `${(r.renovaron / r.vencian) * 100}%` : 0 }} />
                        </span>
                        <span className="tabular">{r.vencian ? `${r.renovaron} de ${r.vencian}` : "sin base"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold">Pagos tardíos ({d.atraso.ventanaMeses} meses)</h3>
                <p className="tabular mt-1 text-sm">
                  {d.atraso.tardios} de {d.atraso.pagos} pagos se registraron después de iniciar su periodo.
                </p>
                {d.atraso.tardios >= MIN_TARDIOS ? (
                  <p className="tabular text-xs text-muted-foreground">
                    Entre los tardíos: atraso típico {fmtDec1(d.atraso.medianaDiasAtraso)} días; 9 de cada 10, {fmtDec1(d.atraso.p90DiasAtraso)} días o menos.
                  </p>
                ) : d.atraso.tardios > 0 ? (
                  <p className="text-xs text-muted-foreground">Muy pocos tardíos para resumir el atraso.</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </EstadoConsulta>
    </Tarjeta>
  );
}

