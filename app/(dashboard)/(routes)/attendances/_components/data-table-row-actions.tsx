"use client"

import { Row } from "@tanstack/react-table"
import { useTransition } from "react";
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
    row
}: DataTableRowActionsProps<TData>) {
  const [isPending, startTransition] = useTransition();

   const handleClick = () => {
    interface AttendanceData<TData> extends Row<TData> {
      hora_entrada: string;
    }

    console.log((row.original as AttendanceData<TData>).hora_entrada);

  }

  return (
    <div className="flex flex-row space-x-2">
      <button onClick={handleClick} type="button" className="text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-md text-sm px-2 py-1.5 text-center mr-2 mb-2">Descontar</button>       
    </div>

  )
}