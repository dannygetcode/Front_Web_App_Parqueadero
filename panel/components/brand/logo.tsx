import { cn } from "@/lib/utils";

/** Marca "Cupo": señal P (azul) más la palabra. */
export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary font-heading text-lg font-bold text-primary-foreground"
      >
        P
      </span>
      {compact ? <span className="sr-only">Cupo</span> : (
        <span className="font-heading text-xl font-bold tracking-tight">Cupo</span>
      )}
    </span>
  );
}
