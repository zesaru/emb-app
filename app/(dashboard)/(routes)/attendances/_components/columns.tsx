"use client"

import { ColumnDef } from "@tanstack/react-table"
import { AttendancesWithUser } from '@/types/collections';
import { verificarPuntualidad } from "../_util/util";
import { DataTableRowActions } from "./data-table-row-actions";

export const columns: ColumnDef<AttendancesWithUser>[] = [
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
    cell: ({ row }) => {
      const estado:any = row.getValue("hora_entrada")
      const ok = verificarPuntualidad(estado, '9:00:00')
      if (estado==='' || estado===null) {
        return <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-inset ring-gray-600/20">Sin registro</span>
      } else {
        return <span className={`inline-flex items-center rounded-md ${ok ? 'bg-green-50' : 'bg-red-50'} px-2 py-1 text-xs font-medium ${ok ? 'text-green-800' : 'text-red-800'} ring-1 ring-inset ${ok ? 'ring-green-600/20' : 'ring-red-600/20'}`}>{estado}</span>
      }
    },
  },
  {
    accessorKey: "hora_salida",
    header: "hora de salida",
  },
  {
    header: 'Compensatorio / Vacaciones',
    
    accessorFn: row => {
      if (row.t_time_start !== null) {
        return `${row.t_time_start} ${row.t_time_finish}`;
      } else {
        return ''; 
      }
    }
  },
  {
    header: "acciones",
    cell: ({ row }) => {
      const estado:any = row.getValue("hora_entrada")
      const ok = verificarPuntualidad(estado, '9:00:00')
      if (estado==='' || estado===null || ok) {
        return '' 
      } else {
        return <DataTableRowActions row={row} />
      }
    },
  }
  
]