import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorState({
  titulo = "No se pudo cargar la información",
  mensaje,
  onReintentar,
  tono = "error",
  className,
}: {
  titulo?: string;
  mensaje?: string;
  onReintentar?: () => void;
  /** "aviso" para servicios caídos temporalmente (p. ej. el pronóstico), sin alarmar. */
  tono?: "error" | "aviso";
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card px-6 py-10 text-center",
        tono === "aviso" ? "bg-st-por-vencer-bg text-st-por-vencer" : "bg-st-ocupado-bg text-st-ocupado",
        className,
      )}
    >
      <TriangleAlert className="size-8" aria-hidden />
      <h2 className="font-heading text-lg font-semibold">{titulo}</h2>
      {mensaje ? <p className="max-w-md text-sm">{mensaje}</p> : null}
      {onReintentar ? (
        <Button variant="outline" onClick={onReintentar}>
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}
