import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { AnaliticaView } from "@/app/(panel)/analitica/analitica-view";

export const metadata: Metadata = { title: "Analítica" };

export default function AnaliticaPage() {
  // useSearchParams (interruptor de simulados y pestaña) exige un límite de Suspense.
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-card" />}>
      <AnaliticaView />
    </Suspense>
  );
}
