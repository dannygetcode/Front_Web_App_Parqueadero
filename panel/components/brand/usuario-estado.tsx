import { StatusBadge } from "@/components/brand/status-badge";
import type { Usuario } from "@/lib/schemas";

const DIAS_POR_VENCER = 5;

/** Estado del usuario con la regla "por vencer": activo con vigencia en pocos días. */
export function UsuarioEstado({ usuario }: { usuario: Usuario }) {
  if (usuario.dadoDeBajaEn) return <StatusBadge estado="suspendido" label="Dado de baja" />;
  if (usuario.estado === "SUSPENDIDO") return <StatusBadge estado="suspendido" />;
  if (usuario.estado === "VENCIDO") return <StatusBadge estado="vencido" />;
  if (usuario.vigenteHasta) {
    const [y, m, d] = usuario.vigenteHasta.split("-").map(Number);
    const dias = Math.ceil((new Date(y, m - 1, d).getTime() - Date.now()) / 86_400_000);
    if (dias <= DIAS_POR_VENCER) return <StatusBadge estado="por-vencer" />;
  }
  return <StatusBadge estado="activo" />;
}
