import { ErrorState } from "@/components/brand/error-state";
import { EmptyState } from "@/components/brand/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type Column<T> = {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Alinea a la derecha (montos y cifras). */
  numeric?: boolean;
  className?: string;
};

/** Tabla base: encabezado, filas, y estados de carga, vacío y error. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  emptyTitle = "Sin resultados",
  emptyDescription,
  caption,
}: {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  caption: string;
}) {
  if (error) return <ErrorState mensaje={error} onReintentar={onRetry} />;
  if (!loading && rows && rows.length === 0) {
    return <EmptyState titulo={emptyTitle} descripcion={emptyDescription} />;
  }
  return (
    <div className="overflow-x-auto rounded-card bg-card ring-1 ring-border">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            {columns.map((c) => (
              <th
                key={c.id}
                scope="col"
                className={cn("px-4 py-3 font-semibold", c.numeric && "text-right", c.className)}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading || !rows
            ? Array.from({ length: 4 }, (_, i) => (
                <tr key={i} className="border-t border-border">
                  {columns.map((c) => (
                    <td key={c.id} className="px-4 py-3">
                      <Skeleton className="h-5 w-full max-w-32" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr key={rowKey(row)} className="border-t border-border">
                  {columns.map((c) => (
                    <td
                      key={c.id}
                      className={cn("px-4 py-3", c.numeric && "tabular text-right", c.className)}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
