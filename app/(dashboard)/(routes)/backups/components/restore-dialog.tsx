"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface RestoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  backupName: string;
}

export function RestoreDialog({
  isOpen,
  onClose,
  onConfirm,
  backupName,
}: RestoreDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Confirmar Restauración
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 pt-2">
              <p>
                Estás a punto de restaurar el backup:
                <strong className="block mt-1 text-foreground">
                  {backupName}
                </strong>
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-md p-3 mt-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                  Advertencia Importante
                </p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-400 mt-2 space-y-1 list-disc list-inside">
                  <li>
                    Esta acción sobrescribirá todos los datos actuales
                  </li>
                  <li>
                    Los cambios realizados después de este backup se perderán
                  </li>
                  <li>
                    La aplicación estará temporalmente indisponible
                  </li>
                  <li>
                    Se recomienda notificar a los usuarios antes de continuar
                  </li>
                </ul>
              </div>
              <p className="text-sm font-medium pt-2">
                ¿Deseas continuar con la restauración?
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
          >
            Confirmar Restauración
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
