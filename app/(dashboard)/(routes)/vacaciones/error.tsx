"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VacationError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="container mx-auto px-4 py-8">
      <div role="alert" className="rounded-lg border border-red-200 bg-white p-6">
        <h1 className="text-xl font-semibold">No se pudieron cargar las vacaciones</h1>
        <p className="mt-2 text-sm text-slate-600">Revisa el periodo de los filtros o vuelve a intentarlo.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button disabled={pending} onClick={() => startTransition(() => { router.refresh(); reset(); })}>
            {pending ? "Cargando…" : "Reintentar"}
          </Button>
          <Button variant="outline" asChild><Link href="/vacaciones">Limpiar filtros</Link></Button>
        </div>
      </div>
    </div>
  );
}
