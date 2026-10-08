import {
  BadgeCheck,
  Ban,
  CalendarX,
  CircleCheck,
  CircleX,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Estado = "libre" | "ocupado" | "por-vencer" | "suspendido" | "vencido" | "activo";

const ESTADOS: Record<Estado, { label: string; icon: LucideIcon; className: string }> = {
  libre: { label: "Libre", icon: CircleCheck, className: "bg-st-libre-bg text-st-libre" },
  ocupado: { label: "Ocupado", icon: CircleX, className: "bg-st-ocupado-bg text-st-ocupado" },
  "por-vencer": {
    label: "Por vencer",
    icon: Clock,
    className: "bg-st-por-vencer-bg text-st-por-vencer",
  },
  suspendido: {
    label: "Suspendido",
    icon: Ban,
    className: "bg-st-suspendido-bg text-st-suspendido",
  },
  vencido: { label: "Vencido", icon: CalendarX, className: "bg-st-vencido-bg text-st-vencido" },
  activo: { label: "Activo", icon: BadgeCheck, className: "bg-st-activo-bg text-st-activo" },
};

/** Estado con icono y texto: nunca se comunica solo con color. */
export function StatusBadge({
  estado,
  label,
  className,
}: {
  estado: Estado;
  label?: string;
  className?: string;
}) {
  const { label: defecto, icon: Icon, className: tono } = ESTADOS[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold leading-none",
        tono,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label ?? defecto}
    </span>
  );
}
