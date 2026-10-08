import { Car, DoorClosed, DoorOpen } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Persiana enrollable de la puerta. El panel de láminas sube hacia el rodillo al abrir y
 * baja al cerrar. El estado también se dice con icono y texto; con movimiento reducido
 * el cambio es instantáneo.
 */
export function Persiana({
  abierta,
  restante,
  className,
}: {
  abierta: boolean;
  /** Texto de cuenta regresiva, por ejemplo "6 s". */
  restante?: string;
  className?: string;
}) {
  const Icono = abierta ? DoorOpen : DoorClosed;
  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      <div
        role="img"
        aria-label={abierta ? "Puerta abierta" : "Puerta cerrada"}
        className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-card bg-secondary ring-1 ring-border"
      >
        {/* Interior visible al subir la persiana */}
        <div className="absolute inset-0 flex items-end justify-center pb-6 text-muted-foreground">
          <Car className="size-16" aria-hidden />
        </div>

        {/* Láminas */}
        <div
          aria-hidden
          className={cn(
            "absolute inset-x-0 top-0 h-full transition-transform duration-[1100ms] ease-in-out motion-reduce:transition-none",
            abierta ? "-translate-y-[88%]" : "translate-y-0",
          )}
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, var(--muted) 0 14px, var(--border) 14px 16px)",
          }}
        >
          <div className="absolute inset-x-0 bottom-0 h-3 bg-plate" />
        </div>

        {/* Rodillo y marco */}
        <div aria-hidden className="absolute inset-x-0 top-0 z-10 h-5 bg-foreground/85" />
        <div aria-hidden className="absolute inset-y-0 left-0 z-10 w-2 bg-foreground/85" />
        <div aria-hidden className="absolute inset-y-0 right-0 z-10 w-2 bg-foreground/85" />
      </div>

      <figcaption
        aria-live="polite"
        className={cn(
          "mx-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold",
          abierta ? "bg-st-libre-bg text-st-libre" : "bg-st-suspendido-bg text-st-suspendido",
        )}
      >
        <Icono className="size-4" aria-hidden />
        {abierta ? "Puerta abierta" : "Puerta cerrada"}
        {abierta && restante ? <span className="tabular font-normal">se cierra en {restante}</span> : null}
      </figcaption>
    </figure>
  );
}
