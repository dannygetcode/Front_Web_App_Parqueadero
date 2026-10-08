import type { Metadata } from "next";
import { UnderConstruction } from "@/components/shell/under-construction";

export const metadata: Metadata = { title: "Usuarios" };

export default function UsuariosPage() {
  return <UnderConstruction titulo="Usuarios" descripcion="Altas, vehículos, estado y vigencia." />;
}
