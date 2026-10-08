import type { Metadata } from "next";
import { SectionHeader } from "@/components/brand/section-header";
import { ResumenCupos } from "@/app/(panel)/resumen-cupos";

export const metadata: Metadata = { title: "Resumen" };

export default function ResumenPage() {
  return (
    <>
      <SectionHeader titulo="Resumen" descripcion="Estado de los cupos del parqueadero." />
      <ResumenCupos />
    </>
  );
}
