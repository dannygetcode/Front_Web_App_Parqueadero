"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { EstadoPagoBadge } from "@/components/brand/estado-pago-badge";
import { PlateChip } from "@/components/brand/plate-chip";
import { Field } from "@/components/data/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiBlobUrl, apiSend } from "@/lib/api-client";
import { formatearFecha, formatearFechaHora, formatearMonto } from "@/lib/format";
import { notificarError } from "@/lib/mutations";
import {
  aprobacionFormSchema,
  pagoSchema,
  rechazoFormSchema,
  type Pago,
} from "@/lib/schemas";

function Comprobante({ id }: { id: number }) {
  const imagen = useQuery({
    queryKey: ["comprobante", id],
    queryFn: () => apiBlobUrl(`/api/bff/pagos/${id}/comprobante`),
    staleTime: Infinity,
    gcTime: 0,
  });
  const url = imagen.data;
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  if (imagen.isLoading) return <Skeleton className="h-64 w-full rounded-card" />;
  if (imagen.isError) {
    const sin = imagen.error instanceof ApiError && imagen.error.status === 404;
    return (
      <p className="rounded-card bg-muted p-4 text-sm text-muted-foreground">
        {sin ? "Este pago no tiene comprobante." : "No se pudo cargar el comprobante."}
      </p>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- imagen blob protegida, no optimizable
    <img src={url} alt="Comprobante de pago" className="max-h-96 w-full rounded-card bg-muted object-contain" />
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className="tabular text-right font-medium">{children}</dd>
    </div>
  );
}

function Revision({ pago, onClose }: { pago: Pago; onClose: () => void }) {
  const qc = useQueryClient();
  const [modo, setModo] = useState<"aprobar" | "rechazar">("aprobar");

  const aprobar = useForm({
    resolver: zodResolver(aprobacionFormSchema),
    defaultValues: { montoConfirmado: String(pago.montoOcr ?? pago.montoEsperado ?? ""), observacion: "" },
  });
  const rechazar = useForm({ resolver: zodResolver(rechazoFormSchema), defaultValues: { motivo: "" } });

  const alTerminar = (mensaje: string) => {
    toast.success(mensaje);
    void qc.invalidateQueries({ queryKey: ["pagos"] });
    onClose();
  };
  const aprobarMut = useMutation({
    mutationFn: (v: { montoConfirmado: string; observacion?: string }) =>
      apiSend("PUT", `/api/bff/pagos/${pago.id}/aprobar`, pagoSchema, {
        montoConfirmado: Number(v.montoConfirmado),
        observacion: v.observacion || null,
      }),
    onSuccess: () => alTerminar("Pago aprobado"),
    onError: notificarError,
  });
  const rechazarMut = useMutation({
    mutationFn: (v: { motivo: string }) =>
      apiSend("PUT", `/api/bff/pagos/${pago.id}/rechazar`, pagoSchema, { motivo: v.motivo }),
    onSuccess: () => alTerminar("Pago rechazado"),
    onError: notificarError,
  });

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-4" aria-label="Revisión del pago">
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Decisión">
        <Button variant={modo === "aprobar" ? "default" : "outline"} onClick={() => setModo("aprobar")}>
          <Check className="size-4" aria-hidden /> Aprobar
        </Button>
        <Button variant={modo === "rechazar" ? "default" : "outline"} onClick={() => setModo("rechazar")}>
          <X className="size-4" aria-hidden /> Rechazar
        </Button>
      </div>

      {modo === "aprobar" ? (
        <form onSubmit={aprobar.handleSubmit((v) => aprobarMut.mutate(v))} noValidate className="flex flex-col gap-4">
          <Field
            id="monto"
            label="Monto confirmado (COP)"
            error={aprobar.formState.errors.montoConfirmado?.message}
            hint="Verifica el valor en la imagen; el periodo se recalcula al aprobar."
          >
            <Input id="monto" inputMode="numeric" className="tabular" {...aprobar.register("montoConfirmado")} />
          </Field>
          <Field id="obs-aprobar" label="Observación (opcional)" error={aprobar.formState.errors.observacion?.message}>
            <Textarea id="obs-aprobar" rows={2} {...aprobar.register("observacion")} />
          </Field>
          <Button type="submit" disabled={aprobarMut.isPending}>
            {aprobarMut.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Confirmar aprobación
          </Button>
        </form>
      ) : (
        <form onSubmit={rechazar.handleSubmit((v) => rechazarMut.mutate(v))} noValidate className="flex flex-col gap-4">
          <Field id="motivo" label="Motivo del rechazo" error={rechazar.formState.errors.motivo?.message} hint="El usuario lo verá en la app.">
            <Textarea id="motivo" rows={3} {...rechazar.register("motivo")} />
          </Field>
          <Button type="submit" variant="destructive" disabled={rechazarMut.isPending}>
            {rechazarMut.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Confirmar rechazo
          </Button>
        </form>
      )}
    </section>
  );
}

export function PagoSheet({ pago, onClose }: { pago: Pago | null; onClose: () => void }) {
  return (
    <Sheet open={pago !== null} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Pago de {pago?.usuarioNombre ?? "usuario"}</SheetTitle>
          <SheetDescription>Comprobante y datos leídos automáticamente (OCR).</SheetDescription>
        </SheetHeader>
        {pago ? (
          <div key={pago.id} className="flex flex-col gap-4 px-4 pb-4">
            {pago.posibleDuplicado ? (
              <p role="alert" className="flex items-start gap-2 rounded-card bg-st-por-vencer-bg p-3 text-sm font-medium text-st-por-vencer">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                Este comprobante se parece a otro ya recibido. Compáralo antes de aprobar.
              </p>
            ) : null}
            <Comprobante id={pago.id} />
            <dl className="flex flex-col gap-2">
              <Dato etiqueta="Estado"><EstadoPagoBadge estado={pago.estado} /></Dato>
              {pago.placa ? <Dato etiqueta="Placa"><PlateChip placa={pago.placa} size="sm" /></Dato> : null}
              <Dato etiqueta="Periodo (provisional)">
                {formatearFecha(pago.periodoInicio)} a {formatearFecha(pago.periodoFin)}
              </Dato>
              <Dato etiqueta="Monto esperado">{formatearMonto(pago.montoEsperado)}</Dato>
              <Dato etiqueta="Monto leído">{formatearMonto(pago.montoOcr)}</Dato>
              <Dato etiqueta="Fecha leída">{formatearFecha(pago.fechaPagoOcr)}</Dato>
              <Dato etiqueta="Lectura OCR">{pago.ocrEstado ?? "-"}</Dato>
              {pago.montoConfirmado != null ? <Dato etiqueta="Monto confirmado">{formatearMonto(pago.montoConfirmado)}</Dato> : null}
              <Dato etiqueta="Recibido">{formatearFechaHora(pago.creadoEn)}</Dato>
              {pago.revisadoEn ? <Dato etiqueta="Revisado">{formatearFechaHora(pago.revisadoEn)}</Dato> : null}
              {pago.motivoRechazo ? <Dato etiqueta="Motivo del rechazo">{pago.motivoRechazo}</Dato> : null}
              {pago.observacion ? <Dato etiqueta="Observación">{pago.observacion}</Dato> : null}
            </dl>
            {pago.estado === "PENDIENTE" ? <Revision pago={pago} onClose={onClose} /> : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
