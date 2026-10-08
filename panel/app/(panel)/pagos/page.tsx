import type { Metadata } from "next";
import { PagosView } from "@/app/(panel)/pagos/pagos-view";

export const metadata: Metadata = { title: "Pagos" };

export default function PagosPage() {
  return <PagosView />;
}
