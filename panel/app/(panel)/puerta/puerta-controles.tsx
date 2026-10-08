"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DoorClosed, DoorOpen, Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/data/field";
import { StatusBadge } from "@/components/brand/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiSend } from "@/lib/api-client";
import { MOTIVOS_ACCESO } from "@/lib/format";
import { notificarError } from "@/lib/mutations";
import {
  aperturaFormSchema,
  eventoAccesoSchema,
  puertaSchema,
  type AperturaForm,
  type EventoAcceso,
} from "@/lib/schemas";
import { z } from "zod";

function Resultado({ evento }: { evento: EventoAcceso }) {
  const permitido = evento.resultado === "PERMITIDO";
  return (
    <p role="status" className="flex flex-wrap items-center gap-2 text-sm">
      <StatusBadge estado={permitido ? "libre" : "ocupado"} label={permitido ? "Permitido" : "Denegado"} />
      <span className="tabular font-medium">{evento.placaLeida}</span>
      {evento.motivo ? <span className="text-muted-foreground">{MOTIVOS_ACCESO[evento.motivo] ?? evento.motivo}</span> : null}
      {evento.duplicado ? <span className="text-muted-foreground">(lectura repetida, se devolvió el evento anterior)</span> : null}
    </p>
  );
}

/** Abrir con placa (obligatoria) y cerrar. La apertura del admin siempre se permite; si la placa no tendría acceso queda como forzada y pide observación. */
export function AperturaCard({ abierta }: { abierta: boolean }) {
  const qc = useQueryClient();
  const { register, control, handleSubmit, setError, reset, formState } = useForm<AperturaForm>({
    resolver: zodResolver(aperturaFormSchema),
    defaultValues: { placa: "", tipo: "ENTRADA", observacion: "" },
  });

  const refrescar = () => {
    void qc.invalidateQueries({ queryKey: ["puerta"] });
    void qc.invalidateQueries({ queryKey: ["accesos"] });
    void qc.invalidateQueries({ queryKey: ["ocupacion"] });
  };

  const abrir = useMutation({
    mutationFn: (v: AperturaForm) =>
      apiSend("PUT", "/api/bff/puerta", puertaSchema, {
        abierta: true,
        placa: v.placa,
        tipo: v.tipo,
        observacion: v.observacion || null,
      }),
    onSuccess: (r) => {
      toast.success(r.evento?.motivo === "FORZADO_ADMIN" ? "Puerta abierta (forzada)" : "Puerta abierta");
      reset({ placa: "", tipo: "ENTRADA", observacion: "" });
      refrescar();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 400 && /observaci/i.test(e.message + JSON.stringify(e.problem.errores ?? []))) {
        setError("observacion", { message: "Esta placa no tiene acceso: explica por qué abres la puerta." });
      }
      notificarError(e);
    },
  });

  const cerrar = useMutation({
    mutationFn: () => apiSend("PUT", "/api/bff/puerta", puertaSchema, { abierta: false }),
    onSuccess: () => {
      toast.success("Puerta cerrada");
      refrescar();
    },
    onError: notificarError,
  });

  const e = formState.errors;
  return (
    <section className="flex flex-col gap-4 rounded-card bg-card p-5 ring-1 ring-border">
      <h2 className="font-heading text-lg font-semibold">Control manual</h2>
      <form onSubmit={handleSubmit((v) => abrir.mutate(v))} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="placa-puerta" label="Placa" error={e.placa?.message}>
            <Input id="placa-puerta" maxLength={10} autoCapitalize="characters" className="uppercase tabular" aria-invalid={Boolean(e.placa)} {...register("placa")} />
          </Field>
          <Field id="tipo-puerta" label="Movimiento" error={e.tipo?.message}>
            <Controller
              control={control}
              name="tipo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="tipo-puerta" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTRADA">Entrada</SelectItem>
                    <SelectItem value="SALIDA">Salida</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
        <Field id="obs-puerta" label="Observación (opcional)" error={e.observacion?.message} hint="Obligatoria si la placa no tiene acceso: la apertura queda registrada como forzada.">
          <Textarea id="obs-puerta" rows={2} aria-invalid={Boolean(e.observacion)} {...register("observacion")} />
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={abrir.isPending}>
            {abrir.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <DoorOpen className="size-4" aria-hidden />}
            Abrir puerta
          </Button>
          <Button type="button" variant="outline" disabled={!abierta || cerrar.isPending} onClick={() => cerrar.mutate()}>
            {cerrar.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <DoorClosed className="size-4" aria-hidden />}
            Cerrar puerta
          </Button>
        </div>
      </form>
    </section>
  );
}

const lecturaFormSchema = z.object({
  placa: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,10}$/, "Placa de 3 a 10 letras o números"),
});

/** Simula una lectura de la cámara: aplica las reglas reales de acceso. */
export function SimuladorCamara() {
  const qc = useQueryClient();
  const [resultado, setResultado] = useState<EventoAcceso | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof lecturaFormSchema>>({
    resolver: zodResolver(lecturaFormSchema),
    defaultValues: { placa: "" },
  });

  const leer = useMutation({
    mutationFn: async (v: { placa: string }) => {
      try {
        return await apiSend("POST", "/api/bff/accesos/lecturas", eventoAccesoSchema, { placa: v.placa });
      } catch (e) {
        // Un acceso denegado responde 403 con el evento en el cuerpo (no es un error de la llamada).
        if (e instanceof ApiError && e.status === 403) {
          const evento = eventoAccesoSchema.safeParse(e.body);
          if (evento.success) return evento.data;
        }
        throw e;
      }
    },
    onSuccess: (evento) => {
      setResultado(evento);
      void qc.invalidateQueries({ queryKey: ["puerta"] });
      void qc.invalidateQueries({ queryKey: ["accesos"] });
      void qc.invalidateQueries({ queryKey: ["ocupacion"] });
    },
    onError: notificarError,
  });

  return (
    <section className="flex flex-col gap-4 rounded-card bg-card p-5 ring-1 ring-border">
      <h2 className="font-heading text-lg font-semibold">Simular lectura de cámara</h2>
      <form onSubmit={handleSubmit((v) => leer.mutate(v))} noValidate className="flex items-start gap-3">
        <div className="flex-1">
          <Field id="placa-lectura" label="Placa leída" error={formState.errors.placa?.message}>
            <Input id="placa-lectura" maxLength={10} autoCapitalize="characters" className="uppercase tabular" aria-invalid={Boolean(formState.errors.placa)} {...register("placa")} />
          </Field>
        </div>
        <Button type="submit" className="mt-[26px]" disabled={leer.isPending}>
          {leer.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ScanLine className="size-4" aria-hidden />}
          Leer
        </Button>
      </form>
      {resultado ? <Resultado evento={resultado} /> : null}
    </section>
  );
}
