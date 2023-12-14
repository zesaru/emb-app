"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CompensatorysWithUser } from '@/types/collections';


export const columns: ColumnDef<CompensatorysWithUser>[] = [
  {
    accessorKey: "event_name",
    header: "Descripción",
  },
  {
    accessorKey: "event_date",
    header: "Fecha",
  },
  
  {
    accessorKey: "hours",
    header: "Registradas/hrs",
    cell: ({ row }) => {
      const hours:number = row.getValue("hours")
      const ok:any = row.original.approve_request 
      return <div ><span className={`font-medium ${ok ?  'bg-green-600 text-white p-1' : 'bg-green-400'}`}>{hours}</span></div>
    },
  },
  {
    accessorKey:"compensated_hours",
    header:"Horas compensadas",
    cell: ({ row }) => {
      const hours:number = row.getValue("compensated_hours") 
      return hours > 0 ? <div className="font-medium">- {hours}</div> : <div className="font-medium "></div>
    }
  }
]