"use client"

import { Row } from "@tanstack/react-table"
import { useTransition } from "react";
import updateApproveRegister from "@/actions/updateApproveRegister";


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
      console.log(response)
    });
  }
  

  return (
    <div className="flex flex-row space-x-2">
      <button onClick={handleClick}>Aprobar</button>
    </div>
  )
}