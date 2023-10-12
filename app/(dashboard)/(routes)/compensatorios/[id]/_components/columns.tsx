"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CompensatorysWithUser } from '@/types/collections';
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export const columns: ColumnDef<CompensatorysWithUser>[] = [
  {
    accessorKey: "user1.name",
    header: "Usuario",
  },
  {
    accessorKey: "event_date",
    header: "Fecha",
  },
  
  {
    accessorKey: "hours",
    header: "Horas",
  },
  {
    accessorKey:"compensated_hours",
    header:"Horas compensadas"
  }
]