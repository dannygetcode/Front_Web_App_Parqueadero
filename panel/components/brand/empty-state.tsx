import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icono: Icono = Inbox,
  titulo,
  descripcion,
  accion,
  className,
}: {
  icono?: LucideIcon;
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card bg-card px-6 py-12 text-center ring-1 ring-border",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-card bg-muted text-muted-foreground">
        <Icono className="size-6" aria-hidden />
      </span>
      <h2 className="font-heading text-lg font-semibold">{titulo}</h2>
      {descripcion ? <p className="max-w-md text-sm text-muted-foreground">{descripcion}</p> : null}
      {accion}
    </div>
  );
}
