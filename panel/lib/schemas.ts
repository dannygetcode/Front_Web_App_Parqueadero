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

/* ---------- Usuarios ---------- */

export const carroceriaSchema = z.enum(["SEDAN", "HATCHBACK", "SUV", "PICKUP", "VAN", "COUPE", "OTRO"]);
export const estadoUsuarioSchema = z.enum(["ACTIVO", "VENCIDO", "SUSPENDIDO"]);
export type EstadoUsuario = z.infer<typeof estadoUsuarioSchema>;

export const vehiculoSchema = z.object({
  id: z.number().nullish(),
  placa: z.string(),
  tipoVehiculo: tipoVehiculoSchema,
  carroceria: carroceriaSchema.nullish(),
  color: z.string(),
  marca: z.string().nullish(),
});
export type Vehiculo = z.infer<typeof vehiculoSchema>;

export const usuarioSchema = z.object({
  id: z.number(),
  telefono: z.string(),
  nombre: z.string(),
  apellido: z.string(),
  estado: estadoUsuarioSchema,
  suspendidoMotivo: z.string().nullish(),
  validado: z.boolean(),
  bloqueadoHasta: z.string().nullish(),
  cupo: z.object({ id: z.number(), codigo: z.string(), tipoVehiculo: tipoVehiculoSchema }).nullish(),
  vehiculo: vehiculoSchema.nullish(),
  vigenteHasta: z.string().nullish(),
  creadoEn: z.string(),
  dadoDeBajaEn: z.string().nullish(),
});
export type Usuario = z.infer<typeof usuarioSchema>;
export const usuariosSchema = z.array(usuarioSchema);

export const altaRespuestaSchema = z.object({
  usuario: usuarioSchema,
  codigoValidacion: z.string(),
  codigoExpiraEn: z.string(),
});
export const codigoSchema = z.object({ codigo: z.string(), expiraEn: z.string() });

const vehiculoBase = z.object({
  placa: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{5,7}$/, "La placa son 5 a 7 letras o números, sin espacios"),
  tipoVehiculo: tipoVehiculoSchema,
  carroceria: z.union([carroceriaSchema, z.literal("")]).optional(),
  color: z.string().trim().min(1, "Escribe el color").max(30, "Máximo 30 caracteres"),
  marca: z.string().trim().max(40, "Máximo 40 caracteres").optional(),
});

type ConVehiculo = { tipoVehiculo: TipoVehiculo; carroceria?: string };
/** La carrocería solo es obligatoria para carros. */
function exigirCarroceria(v: ConVehiculo, ctx: z.RefinementCtx) {
  if (v.tipoVehiculo === "CARRO" && !v.carroceria) {
    ctx.addIssue({ code: "custom", path: ["carroceria"], message: "Elige la carrocería" });
  }
}

export const vehiculoFormSchema = vehiculoBase.superRefine(exigirCarroceria);
export type VehiculoForm = z.infer<typeof vehiculoFormSchema>;

const nombreCampo = (etiqueta: string) =>
  z.string().trim().min(1, `Escribe ${etiqueta}`).max(50, "Máximo 50 caracteres");
const telefonoCampo = z.string().trim().regex(/^3\d{9}$/, "Celular de 10 dígitos que empieza por 3");

/** Alta: datos personales más los campos del vehículo en el mismo nivel. */
export const altaFormSchema = z
  .object({
    telefono: telefonoCampo,
    nombre: nombreCampo("el nombre"),
    apellido: nombreCampo("el apellido"),
    cupoId: z.string().min(1, "Elige un cupo"),
  })
  .extend(vehiculoBase.shape)
  .superRefine(exigirCarroceria);
export type AltaForm = z.infer<typeof altaFormSchema>;

export const edicionFormSchema = z.object({
  telefono: telefonoCampo,
  nombre: nombreCampo("el nombre"),
  apellido: nombreCampo("el apellido"),
  cupoId: z.string().min(1, "Elige un cupo"),
});
export type EdicionForm = z.infer<typeof edicionFormSchema>;

/* ---------- Pagos ---------- */

export const estadoPagoSchema = z.enum(["PENDIENTE", "APROBADO", "RECHAZADO"]);
export type EstadoPago = z.infer<typeof estadoPagoSchema>;

export const pagoSchema = z.object({
  id: z.number(),
  usuarioId: z.number(),
  usuarioNombre: z.string().nullish(),
  placa: z.string().nullish(),
  periodoInicio: z.string(),
  periodoFin: z.string(),
  montoEsperado: z.number().nullish(),
  montoOcr: z.number().nullish(),
  fechaPagoOcr: z.string().nullish(),
  ocrEstado: z.enum(["EXITOSO", "PARCIAL", "FALLIDO", "NO_APLICA"]).nullish(),
  montoConfirmado: z.number().nullish(),
  estado: estadoPagoSchema,
  motivoRechazo: z.string().nullish(),
  observacion: z.string().nullish(),
  registradoPor: z.enum(["USUARIO", "ADMIN"]).nullish(),
  posibleDuplicado: z.boolean(),
  comprobanteUrl: z.string().nullish(),
  creadoEn: z.string(),
  revisadoEn: z.string().nullish(),
});
export type Pago = z.infer<typeof pagoSchema>;

export const paginaSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    content: z.array(item),
    page: z.object({
      size: z.number(),
      number: z.number(),
      totalElements: z.number(),
      totalPages: z.number(),
    }),
  });

export const aprobacionFormSchema = z.object({
  montoConfirmado: z.string().trim().regex(/^\d{1,9}$/, "Escribe un monto entero, sin puntos ni comas"),
  observacion: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
});
export const rechazoFormSchema = z.object({
  motivo: z.string().trim().min(5, "Mínimo 5 caracteres").max(200, "Máximo 200 caracteres"),
});
export const cortesiaFormSchema = z.object({
  usuarioId: z.string().min(1, "Elige un usuario"),
  observacion: z.string().trim().min(5, "Explica el motivo (mínimo 5 caracteres)").max(200, "Máximo 200 caracteres"),
});

/* ---------- Puerta y accesos ---------- */

export const eventoAccesoSchema = z.object({
  id: z.number(),
  placaLeida: z.string(),
  tipo: z.enum(["ENTRADA", "SALIDA"]),
  tipoInferido: z.boolean().nullish(),
  resultado: z.enum(["PERMITIDO", "DENEGADO"]),
  motivo: z.string().nullish(),
  origen: z.enum(["CAMARA", "APP_USUARIO", "MANUAL_ADMIN"]),
  observacion: z.string().nullish(),
  usuarioId: z.number().nullish(),
  usuarioNombre: z.string().nullish(),
  ocurridoEn: z.string(),
  puertaAbierta: z.boolean(),
  duplicado: z.boolean().nullish(),
});
export type EventoAcceso = z.infer<typeof eventoAccesoSchema>;

export const puertaSchema = z.object({
  abierta: z.boolean(),
  abiertaHasta: z.string().nullish(),
  ultimoEvento: eventoAccesoSchema.nullish(),
  evento: eventoAccesoSchema.nullish(),
});
export type Puerta = z.infer<typeof puertaSchema>;

export const aperturaFormSchema = z.object({
  placa: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,10}$/, "Placa de 3 a 10 letras o números"),
  tipo: z.enum(["ENTRADA", "SALIDA"]),
  observacion: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
});
export type AperturaForm = z.infer<typeof aperturaFormSchema>;
