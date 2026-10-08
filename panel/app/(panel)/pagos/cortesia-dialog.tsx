"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/data/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";
import { notificarError } from "@/lib/mutations";
import { useUsuarios } from "@/lib/queries";
import { cortesiaFormSchema, pagoSchema } from "@/lib/schemas";

/** Mes de cortesía: pago aprobado con monto 0 y observación obligatoria (único pago manual de la Fase 1). */
export function CortesiaDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{open ? <Contenido onClose={() => onOpenChange(false)} /> : null}</DialogContent>
    </Dialog>
  );
}

function Contenido({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const usuarios = useUsuarios(false);
  const { control, register, handleSubmit, formState } = useForm({
    resolver: zodResolver(cortesiaFormSchema),
    defaultValues: { usuarioId: "", observacion: "" },
  });

  const registrar = useMutation({
    mutationFn: (v: { usuarioId: string; observacion: string }) => {
      const datos = new FormData();
      datos.set("usuarioId", v.usuarioId);
      datos.set("montoConfirmado", "0");
      datos.set("observacion", v.observacion);
      return api("/api/bff/pagos/manual", pagoSchema, { method: "POST", body: datos });
    },
    onSuccess: () => {
      toast.success("Cortesía registrada");
      void qc.invalidateQueries({ queryKey: ["pagos"] });
      void qc.invalidateQueries({ queryKey: ["usuarios"] });
      onClose();
    },
    onError: notificarError,
  });

  const e = formState.errors;
  return (
    <>
      <DialogHeader>
        <DialogTitle>Registrar cortesía</DialogTitle>
        <DialogDescription>
          Aprueba un periodo sin cobro. Queda registrado con tu observación.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit((v) => registrar.mutate(v))} noValidate className="flex flex-col gap-4">
        <Field id="usuario-cortesia" label="Usuario" error={e.usuarioId?.message}>
          <Controller
            control={control}
            name="usuarioId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="usuario-cortesia" className="w-full" aria-invalid={Boolean(e.usuarioId)}>
                  <SelectValue placeholder={usuarios.isLoading ? "Cargando usuarios" : "Elige un usuario"} />
                </SelectTrigger>
                <SelectContent>
                  {(usuarios.data ?? []).map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.nombre} {u.apellido}
                      {u.vehiculo ? ` (${u.vehiculo.placa})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="obs-cortesia" label="Motivo de la cortesía" error={e.observacion?.message}>
          <Textarea id="obs-cortesia" rows={3} aria-invalid={Boolean(e.observacion)} {...register("observacion")} />
        </Field>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={registrar.isPending}>
            {registrar.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Registrar
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
