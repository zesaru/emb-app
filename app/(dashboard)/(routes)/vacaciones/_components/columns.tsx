"use client"

import { ColumnDef } from "@tanstack/react-table"
import { VacationsWithUser } from '@/types/collections';
import { ArrowUpDown, GanttChartSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link";

export const columns: ColumnDef<VacationsWithUser>[] = [
  {
    accessorKey: "id_user",
    header: "ID",
    cell: ({ row }) => {
      const id = row.getValue("id_user")

      return <Link href='#' className="text-center font-medium"><GanttChartSquare /></Link>
    },
  },
  {
    accessorKey: "user1.name",
    header: "Usuario",
  },
  {
    accessorKey: "request_date",
    header: "Fecha de solicitud",
  },
  {
    accessorKey: "start",
    header: "Fecha de inicio",
  },
  {
    accessorKey: "finish",
    header: "Fecha de fin",
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