"use client"

import { ColumnDef } from "@tanstack/react-table"
import { AttendancesWithUser, CompensatorysWithUser } from '@/types/collections';
import { ArrowUpDown, GanttChartSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link";

export const columns: ColumnDef<AttendancesWithUser>[] = [
  // {
  //   accessorKey: "id",
  //   header: "ID",
  //   // cell: ({ row }) => {
  //   //   const id = row.getValue("user_id")

  //   //   return <Link href={`/compensatorios/${id}`} className="text-center font-medium"><GanttChartSquare /></Link>
  //   // },
  // },
  // {
  //   accessorKey: "user1.name",
  //   header: "Usuario",
  // },
  {
    accessorKey: "name",
    header: "nombre",
  },
  {
    accessorKey: "fecha",
    header: "fecha",
  },
  {
    accessorKey: "hora_entrada",
    header: "hora de entrada",
  },
  {
    accessorKey: "hora_salida",
    header: "hora de salida",
  }
]