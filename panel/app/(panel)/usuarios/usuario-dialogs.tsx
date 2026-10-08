"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, KeyRound, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { apiSend } from "@/lib/api-client";
import { formatearFechaHora } from "@/lib/format";
import { notificarError } from "@/lib/mutations";
import { usuarioSchema, type Usuario } from "@/lib/schemas";
import { z } from "zod";

export type CodigoMostrado = { codigo: string; expiraEn: string; nombre: string };

/** El código de activación solo existe en esta respuesta: no se guarda ni se vuelve a pedir. */
export function CodigoDialog({
  datos,
  onClose,
}: {
  datos: CodigoMostrado | null;
  onClose: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  useEffect(() => setCopiado(false), [datos]);

  async function copiar() {
    if (!datos) return;
    try {
      await navigator.clipboard.writeText(datos.codigo);
      setCopiado(true);
    } catch {
      toast.error("No se pudo copiar. Anótalo manualmente.");
    }
  }

  return (
    <Dialog open={datos !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Código de activación</DialogTitle>
          <DialogDescription>
            Entrégaselo a {datos?.nombre}. Solo se muestra ahora y no se podrá consultar después; si
            se pierde, genera uno nuevo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between gap-3 rounded-card bg-muted p-4">
          <span className="tabular font-heading text-3xl font-bold tracking-[0.3em]">
            {datos?.codigo}
          </span>
          <Button variant="outline" size="sm" onClick={copiar}>
            {copiado ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copiado ? "Copiado" : "Copiar"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Vence el {formatearFechaHora(datos?.expiraEn)}.
        </p>
        <DialogFooter>
          <Button onClick={onClose}>Ya lo entregué</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Suspender y reactivar ---------- */

export function EstadoDialog({
  usuario,
  onClose,
}: {
  usuario: Usuario | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const suspendido = usuario?.estado === "SUSPENDIDO";
  const [motivo, setMotivo] = useState("");
  useEffect(() => setMotivo(""), [usuario]);

  const cambiar = useMutation({
    mutationFn: () =>
      apiSend("PUT", `/api/bff/usuarios/${usuario?.id}/estado`, usuarioSchema, {
        accion: suspendido ? "REACTIVAR" : "SUSPENDER",
        motivo: motivo.trim() || null,
      }),
    onSuccess: () => {
      toast.success(suspendido ? "Usuario reactivado" : "Usuario suspendido");
      void qc.invalidateQueries({ queryKey: ["usuarios"] });
      onClose();
    },
    onError: notificarError,
  });

  const demasiado = motivo.length > 200;
  return (
    <Dialog open={usuario !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{suspendido ? "Reactivar usuario" : "Suspender usuario"}</DialogTitle>
          <DialogDescription>
            {suspendido
              ? `${usuario?.nombre} podrá volver a entrar si su pago está vigente.`
              : `${usuario?.nombre} no podrá abrir la puerta mientras esté suspendido.`}
          </DialogDescription>
        </DialogHeader>
        <Field id="motivo-estado" label="Motivo (opcional)" error={demasiado ? "Máximo 200 caracteres" : undefined}>
          <Textarea id="motivo-estado" value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => cambiar.mutate()} disabled={cambiar.isPending || demasiado}>
            {cambiar.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {suspendido ? "Reactivar" : "Suspender"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Baja ---------- */

export function BajaDialog({ usuario, onClose }: { usuario: Usuario | null; onClose: () => void }) {
  const qc = useQueryClient();
  const baja = useMutation({
    mutationFn: () => apiSend("DELETE", `/api/bff/usuarios/${usuario?.id}`, z.null()),
    onSuccess: () => {
      toast.success("Usuario dado de baja");
      void qc.invalidateQueries({ queryKey: ["usuarios"] });
      void qc.invalidateQueries({ queryKey: ["cupos"] });
      onClose();
    },
    onError: notificarError,
  });
  return (
    <Dialog open={usuario !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dar de baja a {usuario?.nombre}</DialogTitle>
          <DialogDescription>
            Se libera el cupo {usuario?.cupo?.codigo} y el usuario ya no podrá ingresar. Su historial
            se conserva.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => baja.mutate()} disabled={baja.isPending}>
            {baja.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Dar de baja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Nuevo código (olvidé mi PIN) ---------- */

export function NuevoCodigoDialog({
  usuario,
  onClose,
  onCodigo,
}: {
  usuario: Usuario | null;
  onClose: () => void;
  onCodigo: (c: CodigoMostrado) => void;
}) {
  const qc = useQueryClient();
  const generar = useMutation({
    mutationFn: () =>
      apiSend("POST", `/api/bff/usuarios/${usuario?.id}/codigo`, z.object({ codigo: z.string(), expiraEn: z.string() })),
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: ["usuarios"] });
      onCodigo({ codigo: r.codigo, expiraEn: r.expiraEn, nombre: `${usuario?.nombre} ${usuario?.apellido}` });
      onClose();
    },
    onError: notificarError,
  });
  return (
    <Dialog open={usuario !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar código nuevo</DialogTitle>
          <DialogDescription>
            Sirve para que {usuario?.nombre} active la app otra vez o recupere el acceso si olvidó su
            PIN. También desbloquea la cuenta.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => generar.mutate()} disabled={generar.isPending}>
            {generar.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <KeyRound className="size-4" aria-hidden />
            )}
            Generar código
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
