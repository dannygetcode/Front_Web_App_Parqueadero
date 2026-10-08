"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/data/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { apiSend } from "@/lib/api-client";
import { notificarError } from "@/lib/mutations";
import { useCupos } from "@/lib/queries";
import {
  altaFormSchema,
  altaRespuestaSchema,
  edicionFormSchema,
  usuarioSchema,
  vehiculoFormSchema,
  vehiculoSchema,
  type AltaForm,
  type Cupo,
  type EdicionForm,
  type TipoVehiculo,
  type Usuario,
  type VehiculoForm,
} from "@/lib/schemas";
import { VehiculoFields } from "@/app/(panel)/usuarios/vehiculo-fields";

function SelectorCupo({
  id,
  value,
  onChange,
  cupos,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  cupos: Cupo[];
  error?: string;
}) {
  return (
    <Field id={id} label="Cupo" error={error}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full" aria-invalid={Boolean(error)}>
          <SelectValue placeholder="Elige un cupo libre" />
        </SelectTrigger>
        <SelectContent>
          {cupos.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>
              {c.codigo} ({c.tipoVehiculo === "MOTO" ? "moto" : "carro"})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function Guardar({ cargando, texto }: { cargando: boolean; texto: string }) {
  return (
    <Button type="submit" disabled={cargando}>
      {cargando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {texto}
    </Button>
  );
}

/* ---------- Alta ---------- */

const ALTA_VACIA: AltaForm = {
  telefono: "",
  nombre: "",
  apellido: "",
  cupoId: "",
  placa: "",
  tipoVehiculo: "CARRO",
  carroceria: "",
  color: "",
  marca: "",
};

export function AltaSheet({
  open,
  onOpenChange,
  onCreado,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreado: (codigo: string, expiraEn: string, nombre: string) => void;
}) {
  const qc = useQueryClient();
  const cupos = useCupos();
  const libres = (cupos.data ?? []).filter((c) => c.activo && !c.ocupado);
  const form = useForm<AltaForm>({ resolver: zodResolver(altaFormSchema), defaultValues: ALTA_VACIA });
  const { register, control, handleSubmit, setValue, watch, reset, formState } = form;
  const tipo = watch("tipoVehiculo");

  useEffect(() => {
    if (open) reset(ALTA_VACIA);
  }, [open, reset]);

  const crear = useMutation({
    mutationFn: (v: AltaForm) =>
      apiSend("POST", "/api/bff/usuarios", altaRespuestaSchema, {
        telefono: v.telefono,
        nombre: v.nombre,
        apellido: v.apellido,
        cupoId: Number(v.cupoId),
        vehiculo: {
          placa: v.placa,
          tipoVehiculo: v.tipoVehiculo,
          carroceria: v.tipoVehiculo === "CARRO" ? v.carroceria : null,
          color: v.color,
          marca: v.marca || null,
        },
      }),
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: ["usuarios"] });
      void qc.invalidateQueries({ queryKey: ["cupos"] });
      onOpenChange(false);
      onCreado(r.codigoValidacion, r.codigoExpiraEn, `${r.usuario.nombre} ${r.usuario.apellido}`);
    },
    onError: notificarError,
  });

  const e = formState.errors;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Nuevo usuario</SheetTitle>
          <SheetDescription>
            Al guardar se genera un código de activación que se muestra una sola vez.
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleSubmit((v) => crear.mutate(v))}
          noValidate
          className="flex flex-col gap-4 px-4 pb-4"
        >
          <Field id="nombre" label="Nombre" error={e.nombre?.message}>
            <Input id="nombre" autoComplete="off" aria-invalid={Boolean(e.nombre)} {...register("nombre")} />
          </Field>
          <Field id="apellido" label="Apellido" error={e.apellido?.message}>
            <Input id="apellido" autoComplete="off" aria-invalid={Boolean(e.apellido)} {...register("apellido")} />
          </Field>
          <Field id="telefono" label="Celular" error={e.telefono?.message} hint="10 dígitos, empieza por 3">
            <Input
              id="telefono"
              inputMode="numeric"
              maxLength={10}
              autoComplete="off"
              className="tabular"
              aria-invalid={Boolean(e.telefono)}
              {...register("telefono")}
            />
          </Field>
          <Controller
            control={control}
            name="cupoId"
            render={({ field }) => (
              <SelectorCupo
                id="cupoId"
                value={field.value}
                cupos={libres}
                error={e.cupoId?.message}
                onChange={(v) => {
                  field.onChange(v);
                  const c = libres.find((x) => String(x.id) === v);
                  if (c) {
                    setValue("tipoVehiculo", c.tipoVehiculo as TipoVehiculo);
                    if (c.tipoVehiculo === "MOTO") setValue("carroceria", "");
                  }
                }}
              />
            )}
          />
          <VehiculoFields
            tipo={tipo}
            register={register as never}
            control={control as never}
            errors={e as never}
          />
          <SheetFooter className="px-0">
            <Guardar cargando={crear.isPending} texto="Crear usuario" />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* ---------- Edición de datos y cupo ---------- */

export function EditarSheet({
  usuario,
  onClose,
}: {
  usuario: Usuario | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const cupos = useCupos();
  const { register, control, handleSubmit, reset, formState } = useForm<EdicionForm>({
    resolver: zodResolver(edicionFormSchema),
  });

  useEffect(() => {
    if (usuario) {
      reset({
        telefono: usuario.telefono,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        cupoId: usuario.cupo ? String(usuario.cupo.id) : "",
      });
    }
  }, [usuario, reset]);

  const opciones = (cupos.data ?? []).filter(
    (c) => c.activo && (!c.ocupado || c.id === usuario?.cupo?.id),
  );

  const guardar = useMutation({
    mutationFn: (v: EdicionForm) =>
      apiSend("PUT", `/api/bff/usuarios/${usuario?.id}`, usuarioSchema, {
        telefono: v.telefono,
        nombre: v.nombre,
        apellido: v.apellido,
        cupoId: Number(v.cupoId),
      }),
    onSuccess: () => {
      toast.success("Usuario actualizado");
      void qc.invalidateQueries({ queryKey: ["usuarios"] });
      void qc.invalidateQueries({ queryKey: ["cupos"] });
      onClose();
    },
    onError: notificarError,
  });

  const e = formState.errors;
  return (
    <Sheet open={usuario !== null} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar usuario</SheetTitle>
          <SheetDescription>Datos personales y cupo asignado.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit((v) => guardar.mutate(v))} noValidate className="flex flex-col gap-4 px-4 pb-4">
          <Field id="e-nombre" label="Nombre" error={e.nombre?.message}>
            <Input id="e-nombre" aria-invalid={Boolean(e.nombre)} {...register("nombre")} />
          </Field>
          <Field id="e-apellido" label="Apellido" error={e.apellido?.message}>
            <Input id="e-apellido" aria-invalid={Boolean(e.apellido)} {...register("apellido")} />
          </Field>
          <Field id="e-telefono" label="Celular" error={e.telefono?.message}>
            <Input id="e-telefono" inputMode="numeric" maxLength={10} className="tabular" aria-invalid={Boolean(e.telefono)} {...register("telefono")} />
          </Field>
          <Controller
            control={control}
            name="cupoId"
            render={({ field }) => (
              <SelectorCupo id="e-cupo" value={field.value} cupos={opciones} error={e.cupoId?.message} onChange={field.onChange} />
            )}
          />
          <SheetFooter className="px-0">
            <Guardar cargando={guardar.isPending} texto="Guardar cambios" />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* ---------- Cambio de vehículo ---------- */

export function VehiculoSheet({
  usuario,
  onClose,
}: {
  usuario: Usuario | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const tipo: TipoVehiculo = usuario?.cupo?.tipoVehiculo ?? "CARRO";
  const { register, control, handleSubmit, reset, formState } = useForm<VehiculoForm>({
    resolver: zodResolver(vehiculoFormSchema),
  });

  useEffect(() => {
    if (usuario) {
      reset({ placa: "", tipoVehiculo: tipo, carroceria: "", color: "", marca: "" });
    }
  }, [usuario, tipo, reset]);

  const guardar = useMutation({
    mutationFn: (v: VehiculoForm) =>
      apiSend("PUT", `/api/bff/usuarios/${usuario?.id}/vehiculo`, vehiculoSchema, {
        placa: v.placa,
        tipoVehiculo: v.tipoVehiculo,
        carroceria: v.tipoVehiculo === "CARRO" ? v.carroceria : null,
        color: v.color,
        marca: v.marca || null,
      }),
    onSuccess: () => {
      toast.success("Vehículo actualizado");
      void qc.invalidateQueries({ queryKey: ["usuarios"] });
      onClose();
    },
    onError: notificarError,
  });

  return (
    <Sheet open={usuario !== null} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Cambiar vehículo</SheetTitle>
          <SheetDescription>
            El vehículo actual ({usuario?.vehiculo?.placa ?? "ninguno"}) pasa a inactivo. El tipo
            debe coincidir con el del cupo.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit((v) => guardar.mutate(v))} noValidate className="flex flex-col gap-4 px-4 pb-4">
          <VehiculoFields tipo={tipo} register={register} control={control} errors={formState.errors} />
          <SheetFooter className="px-0">
            <Guardar cargando={guardar.isPending} texto="Cambiar vehículo" />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
