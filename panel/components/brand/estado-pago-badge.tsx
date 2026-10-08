import { StatusBadge } from "@/components/brand/status-badge";
import type { EstadoPago } from "@/lib/schemas";

export function EstadoPagoBadge({ estado }: { estado: EstadoPago }) {
  if (estado === "APROBADO") return <StatusBadge estado="activo" label="Aprobado" />;
  if (estado === "RECHAZADO") return <StatusBadge estado="ocupado" label="Rechazado" />;
  return <StatusBadge estado="por-vencer" label="Pendiente" />;
}
