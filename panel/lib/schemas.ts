import { z } from "zod";

/** Error del backend (RFC 9457) o generado por el BFF con la misma forma. */
export const problemSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  status: z.number().optional(),
  detail: z.string().optional(),
  codigo: z.string().optional(),
  errores: z.array(z.object({ campo: z.string(), mensaje: z.string() })).optional(),
});
export type Problem = z.infer<typeof problemSchema>;

export const tokenSchema = z.object({
  token: z.string().min(1),
  rol: z.string(),
  expiraEn: z.string().optional().nullable(),
});

export const loginRequestSchema = z.object({
  username: z.string().trim().min(1, "Escribe tu usuario").max(100),
  password: z.string().min(1, "Escribe tu contraseña").max(200),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const tipoVehiculoSchema = z.enum(["CARRO", "MOTO"]);
export type TipoVehiculo = z.infer<typeof tipoVehiculoSchema>;

export const cupoSchema = z.object({
  id: z.number(),
  codigo: z.string(),
  tipoVehiculo: tipoVehiculoSchema,
  activo: z.boolean(),
  usuarioId: z.number().nullable().optional(),
  ocupado: z.boolean(),
  vigente: z.boolean(),
});
export type Cupo = z.infer<typeof cupoSchema>;
export const cuposSchema = z.array(cupoSchema);

export const ocupacionSchema = z.object({
  porTipo: z.array(
    z.object({
      tipoVehiculo: tipoVehiculoSchema,
      cupos: z.number(),
      ocupados: z.number(),
      libres: z.number(),
    }),
  ),
  vehiculosDentro: z.array(
    z.object({
      placa: z.string(),
      usuario: z.string().nullable().optional(),
      desde: z.string(),
    }),
  ),
});
export type Ocupacion = z.infer<typeof ocupacionSchema>;
