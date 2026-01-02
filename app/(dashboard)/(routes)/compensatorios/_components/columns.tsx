"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CompensatorysWithUser } from '@/types/collections';
import { ArrowUpDown, GanttChartSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link";

export const columns: ColumnDef<CompensatorysWithUser>[] = [
  {
    accessorKey: "user_id",
    header: "ID",
    cell: ({ row }) => {
      const id = row.getValue("user_id")

      return <Link href={`/compensatorios/${id}`} className="text-center font-medium"><GanttChartSquare /></Link>
    },
  },
  {
    accessorFn: (row) => row.user1?.name,
    header: "Usuario",
    id: "user1.name",
  },
  {
    accessorKey: "event_name",
    header: "Nombre del Evento",
  },
  {
    accessorKey: "event_date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Fecha
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "hours",
    header: "Horas",
  },
  {
    accessorKey: "approve_request",
    header: "Estado",
    cell: ({ row }) => {
      const estado = row.getValue("approve_request") ? "Aprobado" : "Pendiente"

      return <div className="text-center font-medium">{estado}</div>
    },
  }
]