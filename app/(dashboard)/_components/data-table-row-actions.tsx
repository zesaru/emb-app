"use client";

import { Row } from "@tanstack/react-table";
import { useState, useTransition } from "react";
import { toast } from "react-toastify";

import adminCancelCompensatorio from "@/actions/admin-cancel-compensatorio";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CompensatorysWithUser } from "@/types/collections";

interface DataTableRowActionsProps {
  row: Row<CompensatorysWithUser>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    const id = row.original.id;
    if (!id) return;

    startDeleteTransition(async () => {
      const response = await adminCancelCompensatorio(id);

      if (response?.success) {
        toast("La solicitud fue eliminada.", {
          position: "top-center",
          autoClose: 3000,
          theme: "light",
        });
        setOpen(false);
      } else {
        toast(`Error: ${response?.error || "No se pudo eliminar la solicitud."}`, {
          position: "top-center",
          autoClose: 5000,
          theme: "light",
        });
      }
    });
  };

  const handleClick = () => {
    startTransition(async () => {
      const data = row.original;
      const userEmail = data.user1?.email ?? data.users?.[0]?.email ?? "";
      const compensatoryInput = {
        id: data.id ?? "",
        user_id: data.user_id ?? "",
        email: userEmail || "no-email",
        hours: Number(data.hours ?? 0),
      };

      const responseRequest = await fetch("/api/compensatorys/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(compensatoryInput),
      });
      const response = await responseRequest.json();

      if (response?.success) {
        toast("El registro ha sido aprobado.", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        return;
      }

      if (response?.error) {
        toast(`Error: ${response.error}`, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      }
    });
  };

  return (
    <div className="flex flex-row space-x-2">
      <button
        disabled={isPending}
        onClick={handleClick}
        type="button"
        className="text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-4 py-2 text-center mr-1 mb-1 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Aprobando..." : "Aprobar"}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm px-4 py-2 text-center mr-1 mb-1"
          >
            Eliminar
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar esta solicitud?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. La solicitud quedará marcada como cancelada
              y ya no podrá ser aprobada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Eliminando..." : "Sí, eliminar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
