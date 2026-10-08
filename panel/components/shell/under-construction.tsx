import { Construction } from "lucide-react";
import { EmptyState } from "@/components/brand/empty-state";
import { SectionHeader } from "@/components/brand/section-header";

export function UnderConstruction({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <>
      <SectionHeader titulo={titulo} descripcion={descripcion} />
      <EmptyState
        icono={Construction}
        titulo="En construcción"
        descripcion="Esta pantalla se está rediseñando y estará disponible pronto."
      />
    </>
  );
}
