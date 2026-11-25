"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function CompensatoryHistoryError({ reset }: { reset: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="container mx-auto px-4 py-8">
      <div role="alert" className="rounded-lg border border-red-200 bg-white p-6">
        <h1 className="text-xl font-semibold">No se pudo cargar el historial de compensatorios</h1>
        <Button className="mt-4" disabled={pending} onClick={() => startTransition(() => {
          router.refresh();
          reset();
        })}>
          {pending ? "Cargando…" : "Reintentar"}
        </Button>
      </div>
    </div>
  );
}
