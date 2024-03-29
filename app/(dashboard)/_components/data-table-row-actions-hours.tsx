"use client"

import { Row } from "@tanstack/react-table"
import { useTransition } from "react";
import updateApproveRegisterHour from "@/actions/updateRegisterHour";
import { toast } from "react-toastify";
import React from "react";


interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
    row
}: DataTableRowActionsProps<TData>) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const response = await updateApproveRegisterHour(row.original);
            
      if (response?.success) {
        toast("🦄 Ha sido aprobado el descanso!", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      }
    });
  }


  return (
    <div className="flex flex-row space-x-2">
      <button onClick={handleClick} type="button" className="text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-4 py-2 text-center mr-1 mb-1">Aprobar</button>
    </div>
  )
}