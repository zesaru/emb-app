"use client"

import { Row } from "@tanstack/react-table"
import BtnAprobar from "./btnAprobarByList"


interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
    row
}: DataTableRowActionsProps<TData>) {
    
  return (
    <div className="flex flex-row space-x-2">
      <BtnAprobar compensatory={row.original}/>
    </div>
  )
}