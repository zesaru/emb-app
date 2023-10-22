"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CompensatorysWithUser } from "@/types/collections";
import { ArrowUpDown, GanttChartSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTableRowActions } from "./data-table-row-actions-hours";

export const columnsHour: ColumnDef<CompensatorysWithUser>[] = [
  {
    accessorKey: "user_id",
    header: "ID",
    cell: ({ row }) => {
      const id = row.getValue("user_id");

      return (
        <Link
          href={`/compensatorios/${id}`}
          className="text-center font-medium"
        >
          <GanttChartSquare />
        </Link>
      );
    },
  },
  {
    accessorKey: "user_name",
    header: "Usuario",
  },
  {
    accessorKey: "compensated_hours_day",
    header: "Fecha de Compensatorio",
  },
  {
    accessorKey: "compensated_hours",
    header: "Hora(s) de Compensatorio",
  },
  {
    accessorKey: "t_time_start",
    header: "Inicio",
  },
  {
    accessorKey: "t_time_finish",
    header: "Finalizacion",
  },
  {
    accessorKey: "final_approve_request",
    header: "Registro",
    cell: ({ row }) => {
      const estado = row.getValue("final_approve_request") ? "Aprobado" : "Pendiente";
      return <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">{estado}</span>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  }
];
