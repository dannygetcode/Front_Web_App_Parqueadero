/** Contenido de tooltip para las gráficas: texto en tinta del tema, el color solo marca la serie. */
function Tooltip({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-40 gap-1.5 rounded-lg bg-popover px-3 py-2 text-xs text-popover-foreground ring-1 ring-border">
      <p className="font-medium">{titulo}</p>
      {children}
    </div>
  );
}

function Fila({ nombre, valor, color }: { nombre: string; valor: string; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {color ? <span className="size-2 rounded-sm" style={{ background: color }} aria-hidden /> : null}
        {nombre}
      </span>
      <span className="tabular font-medium">{valor}</span>
    </div>
  );
}

function Nota({ children }: { children: React.ReactNode }) {
  return <p className="max-w-56 text-muted-foreground">{children}</p>;
}

Tooltip.Fila = Fila;
Tooltip.Nota = Nota;

export { Tooltip };
