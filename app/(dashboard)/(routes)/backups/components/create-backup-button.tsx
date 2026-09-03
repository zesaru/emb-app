"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CreateBackupButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const createBackup = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/backup", { method: "POST" });
        const result = await response.json();

        if (!response.ok || !result.success) {
          toast.error(result.error || "No se pudo crear el backup.");
          return;
        }

        toast.success("Backup creado correctamente.");
        router.refresh();
      } catch {
        toast.error("Ocurrió un error inesperado al crear el backup.");
      }
    });
  };

  return (
    <Button type="button" onClick={createBackup} disabled={isPending}>
      <Plus className="mr-2 h-4 w-4" />
      {isPending ? "Creando backup..." : "Crear backup"}
    </Button>
  );
}
