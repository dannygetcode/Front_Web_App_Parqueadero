import { cn } from "@/lib/utils";

/** Placa con el aspecto de una placa amarilla colombiana (fondo amarillo, texto oscuro). */
export function PlateChip({
  placa,
  size = "md",
  className,
}: {
  placa: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const limpia = placa.replace(/\s+/g, "").toUpperCase();
  const texto = limpia.length > 3 ? `${limpia.slice(0, 3)} ${limpia.slice(3)}` : limpia;
  return (
    <span
      role="img"
      aria-label={`Placa ${texto}`}
      className={cn(
        "inline-flex flex-col items-center rounded-lg border-2 border-plate-foreground/80 bg-plate px-2 text-plate-foreground",
        size === "sm" && "py-0",
        size === "md" && "py-0.5",
        size === "lg" && "px-3 py-1",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "font-semibold uppercase leading-none tracking-[0.2em]",
          size === "lg" ? "text-[9px]" : "text-[7px]",
        )}
      >
        Colombia
      </span>
      <span
        aria-hidden
        className={cn(
          "tabular whitespace-nowrap font-heading font-bold leading-tight tracking-wider",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-2xl",
        )}
      >
        {texto}
      </span>
    </span>
  );
}
