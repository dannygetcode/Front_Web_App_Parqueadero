import type { Metadata } from "next";
import { UsuariosView } from "@/app/(panel)/usuarios/usuarios-view";

export const metadata: Metadata = { title: "Usuarios" };

export default function UsuariosPage() {
  return <UsuariosView />;
}
