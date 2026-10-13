import { z } from "zod";

/* Contrato: ../backend/docs/contrato-analitica.md. Los campos opcionales o nulos se aceptan con nullish. */

const num = z.number();
const numN = z.number().nullish();

/* ---------- Spring: descriptiva ---------- */

export const resumenSchema = z.object({
  generadoEn: z.string(),
  incluirSimulados: z.boolean(),
  cupos: z.array(
    z.object({ tipo: z.string(), totales: num, asignados: num, vigentes: num, porcentajeContratado: numN }),
  ),
  dentroAhora: z.object({ carro: num, moto: num }),
  usuarios: z.object({ activo: num, vencido: num, suspendido: num }),
  ingresos: z.object({ mesActual: num, mesAnterior: num, variacionPct: numN }),
  pagosPendientes: num,
  vencimientos: z.object({
    en7Dias: num,
    en15Dias: num,
    en30Dias: num,
    lista: z.array(z.object({ usuarioId: num, cupo: z.string(), fechaFin: z.string(), diasRestantes: num })),
  }),
});
export type Resumen = z.infer<typeof resumenSchema>;

export const ocupacionSerieSchema = z.object({
  desde: z.string(),
  hasta: z.string(),
  granularidad: z.enum(["hora", "dia"]),
  incluirSimulados: z.boolean(),
  serie: z.array(
    z.object({ inicio: z.string(), carro: num, moto: num, picoCarro: num, picoMoto: num, censuradas: num }),
  ),
});
export type OcupacionSerie = z.infer<typeof ocupacionSerieSchema>;

export const mapaCalorSchema = z.object({
  desde: z.string(),
  hasta: z.string(),
  incluirSimulados: z.boolean(),
  cuposCarro: num,
  celdas: z.array(
    z.object({
      diaSemana: num,
      hora: num,
      ocupacionMediaCarro: num,
      ocupacionMediaMoto: num,
      muestras: num,
    }),
  ),
});
export type MapaCalor = z.infer<typeof mapaCalorSchema>;

const ingresoTipo = z.object({ ingresos: num, pagos: num, ticketPromedio: numN, tarifaVigente: numN });
export const ingresosSchema = z.object({
  anio: num,
  incluirSimulados: z.boolean(),
  meses: z.array(
    z.object({ mes: num, carro: ingresoTipo, moto: ingresoTipo, total: num, pagos: num, ticketPromedio: numN, acumulado: num }),
  ),
  totalAnual: z.object({ carro: num, moto: num, total: num, pagos: num, ticketPromedio: numN }),
  tarifas: z.array(z.object({ tipo: z.string(), valorMensual: num, vigenteDesde: z.string() })),
});
export type Ingresos = z.infer<typeof ingresosSchema>;

export const morosidadSchema = z.object({
  fecha: z.string(),
  incluirSimulados: z.boolean(),
  usuarios: z.array(
    z.object({
      usuarioId: num,
      cupo: z.string().nullish(),
      tipo: z.string().nullish(),
      vencioEl: z.string(),
      diasMora: num,
      mesesAdeudados: num,
      montoAdeudado: num,
    }),
  ),
  totalAdeudado: num,
  vencidosSinPagoPrevio: num,
  atraso: z.object({
    ventanaMeses: num,
    pagos: num,
    tardios: num,
    porcentajeTardios: numN,
    medianaDiasAtraso: numN,
    p90DiasAtraso: numN,
    diasGracia: num,
    renovacionMensual: z.array(z.object({ mes: z.string(), vencian: num, renovaron: num, tasa: numN })),
  }),
});
export type Morosidad = z.infer<typeof morosidadSchema>;

const cuantiles = z.object({ mediana: numN, p25: numN, p75: numN }).nullish();
const fuera = z.object({ media: numN, mediana: numN }).nullish();
const filaPermanencia = z.object({
  tipo: z.string(),
  diaSemana: numN,
  visitas: num,
  estanciaMin: cuantiles,
  fueraMin: fuera,
});
export const permanenciaSchema = z.object({
  desde: z.string(),
  hasta: z.string(),
  incluirSimulados: z.boolean(),
  porTipo: z.array(filaPermanencia),
  porTipoYDia: z.array(filaPermanencia),
  histogramaHoraEntrada: z.array(z.object({ hora: num, carro: num, moto: num })),
});
export type Permanencia = z.infer<typeof permanenciaSchema>;

/* ---------- Pronóstico (servicio Python vía Spring) ---------- */

const metricas = z.object({
  disponible: z.boolean(),
  origenDatos: z.string().nullish(),
  generadoEn: z.string().nullish(),
  resumen: z.record(z.string(), z.unknown()).nullish(),
});
const comunPronostico = {
  generadoEn: z.string(),
  versionModelo: z.string().nullish(),
  incluyeSimulados: z.boolean(),
  metricas,
};

export const vacanciaSchema = z.object({
  ...comunPronostico,
  nota: z.string().nullish(),
  porTipo: z.record(
    z.string(),
    z.object({
      capacidad: num,
      titulares: num,
      cuposSinAsignar: num,
      probabilidades: z.array(z.object({ dias: num, fecha: z.string(), probabilidad: num, p10: num, p90: num })),
      primeraFechaProbMayorIgual50: z.string().nullish(),
      detalle: z.array(
        z.object({
          usuarioId: num,
          cupo: z.string().nullish(),
          estado: z.string().nullish(),
          fechaFin: z.string().nullish(),
          fechaLiberacionPotencial: z.string().nullish(),
          pRenovar: numN,
          renovacionesObservadas: numN,
          renovacionesATiempo: numN,
        }),
      ),
    }),
  ),
});
export type Vacancia = z.infer<typeof vacanciaSchema>;

export const pronosticoOcupacionSchema = z.object({
  ...comunPronostico,
  tipoVehiculo: z.string(),
  capacidad: num,
  horizonteDias: num,
  datosInsuficientes: z.boolean(),
  semanasHistoria: num,
  minSemanasHistoria: numN,
  minObservacionesHora: numN,
  ventanaSemanas: numN,
  dias: z.array(
    z.object({
      fecha: z.string(),
      horas: z.array(
        z.object({
          hora: num,
          mediana: numN,
          media: numN,
          p10: numN,
          p90: numN,
          probLleno: numN,
          observaciones: num,
          suficiente: z.boolean(),
        }),
      ),
    }),
  ),
});
export type PronosticoOcupacion = z.infer<typeof pronosticoOcupacionSchema>;

export const llegadasSchema = z.object({
  ...comunPronostico,
  ventanaSemanas: numN,
  nota: z.string().nullish(),
  usuarios: z.array(
    z.object({
      usuarioId: num,
      cupo: z.string().nullish(),
      tipoVehiculo: z.string().nullish(),
      estado: z.string().nullish(),
      proxima: z
        .object({
          fecha: z.string(),
          diaSemana: z.string().nullish(),
          diasObservados: numN,
          diasConEntrada: numN,
          probabilidadVenir: numN,
          horaMediana: z.string().nullish(),
          horaP25: z.string().nullish(),
          horaP75: z.string().nullish(),
          datosInsuficientes: z.boolean(),
          alcanzaUmbral50: z.boolean().nullish(),
        })
        .nullish(),
      tiempoFueraMedianaHoras: numN,
      visitasConsideradas: numN,
    }),
  ),
});
export type Llegadas = z.infer<typeof llegadasSchema>;
