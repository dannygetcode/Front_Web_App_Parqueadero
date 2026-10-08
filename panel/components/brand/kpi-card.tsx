import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type Comparacion = {
  /** Texto, por ejemplo "+2 frente a ayer". */
  texto: string;
  tendencia: "sube" | "baja" | "igual";
};

export function KpiCard({
  titulo,
  valor,
  unidad,
  periodo,
  comparacion,
  className,
}: {
  titulo: string;
  valor: string | number;
  unidad?: string;
  periodo?: string;
  comparacion?: Comparacion;
  className?: string;
}) {
  const Icono =
    comparacion?.tendencia === "sube"
      ? TrendingUp
      : comparacion?.tendencia === "baja"
        ? TrendingDown
        : Minus;
  return (
    <section className={cn("rounded-card bg-card p-5 ring-1 ring-border", className)}>
      <h3 className="text-sm font-medium text-muted-foreground">{titulo}</h3>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="tabular font-heading text-4xl font-bold leading-none">{valor}</span>
        {unidad ? <span className="text-sm text-muted-foreground">{unidad}</span> : null}
      </p>
      {periodo ? <p className="mt-2 text-xs text-muted-foreground">{periodo}</p> : null}
      {comparacion ? (
        <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium">
          <Icono className="size-3.5" aria-hidden />
          {comparacion.texto}
        </p>
      ) : null}
    </section>
  );
}
