"use client"

import { Row } from "@tanstack/react-table"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
    row
}: DataTableRowActionsProps<TData>) {
  return (
    <div className="flex flex-row space-x-2">
      <button
        disabled
        type="button"
        title="Próximamente"
        className="text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 font-medium rounded-md text-sm px-2 py-1.5 text-center mr-2 mb-2 opacity-50 cursor-not-allowed"
      >
        Descontar
      </button>
    </div>
  )
}