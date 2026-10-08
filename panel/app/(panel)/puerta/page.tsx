import type { Metadata } from "next";
import { UnderConstruction } from "@/components/shell/under-construction";

export const metadata: Metadata = { title: "Puerta" };

export default function PuertaPage() {
  return <UnderConstruction titulo="Puerta" descripcion="Apertura, cierre e historial de accesos." />;
}
