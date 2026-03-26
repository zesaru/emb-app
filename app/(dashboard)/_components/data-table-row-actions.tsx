"use client";

import { Row } from "@tanstack/react-table";
import { useTransition } from "react";
import { toast } from "react-toastify";

import { CompensatorysWithUser } from "@/types/collections";

interface DataTableRowActionsProps {
  row: Row<CompensatorysWithUser>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const [isPending, startTransition] = useTransition();

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
    </div>
  );
}
