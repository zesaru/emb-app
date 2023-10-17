"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CompensatorysWithUser } from '@/types/collections';


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
    header:"Horas compensadas",
    cell: ({ row }) => {
      const hours:number = row.getValue("compensated_hours") 
      return hours > 0 ? <div className="font-medium">- {hours}</div> : <div className="font-medium"></div>
      
      
    }
  }
]