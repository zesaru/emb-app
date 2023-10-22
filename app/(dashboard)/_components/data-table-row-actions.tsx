"use client"

import { Row } from "@tanstack/react-table"
import { useTransition } from "react";
import updateApproveRegister from "@/actions/updateApproveRegister";
import { toast } from "react-toastify";


interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
    row
}: DataTableRowActionsProps<TData>) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const response = await updateApproveRegister(row.original);
      if (response?.success) {
        toast("🦄 El registro ha sido aprobado!", {
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
      <button onClick={handleClick}>Aprobar</button>
    </div>
  )
}