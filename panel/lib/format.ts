const pesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatearMonto(valor: number | null | undefined): string {
  return valor == null ? "-" : pesos.format(valor);
}

/** "2026-10-07" -> "7 oct 2026" (sin desplazamiento de zona horaria). */
export function formatearFecha(valor: string | null | undefined): string {
  if (!valor) return "-";
  const [y, m, d] = valor.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatearFechaHora(valor: string | null | undefined): string {
  if (!valor) return "-";
  return new Date(valor).toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });
}

export const MOTIVOS_ACCESO: Record<string, string> = {
  PLACA_DESCONOCIDA: "Placa desconocida",
  USUARIO_VENCIDO: "Usuario vencido",
  USUARIO_SUSPENDIDO: "Usuario suspendido",
  USUARIO_DE_BAJA: "Usuario dado de baja",
  SIN_CUPO: "Sin cupo asignado",
  TIPO_CUPO_DISTINTO: "Tipo de cupo distinto",
  FORZADO_ADMIN: "Apertura forzada por el admin",
  SALIDA_CON_DEUDA: "Salida con deuda",
  YA_DENTRO: "El vehículo ya está dentro",
};
export const CARROCERIAS: Record<string, string> = {
  SEDAN: "Sedán",
  HATCHBACK: "Hatchback",
  SUV: "SUV",
  PICKUP: "Camioneta pickup",
  VAN: "Van",
  COUPE: "Coupé",
  OTRO: "Otra",
};
