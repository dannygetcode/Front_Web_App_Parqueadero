import type { Metadata } from "next";
import { PuertaView } from "@/app/(panel)/puerta/puerta-view";

export const metadata: Metadata = { title: "Puerta" };

export default function PuertaPage() {
  return <PuertaView />;
}
