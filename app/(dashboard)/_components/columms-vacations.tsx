"use client";

import { ColumnDef } from "@tanstack/react-table";
import { VacationsWithUser } from "@/types/collections";
import {  GanttChartSquare } from "lucide-react";
import Link from "next/link";
import { DataTableRowActions } from "./data-table-row-actions-vacations";

export const columnVacations: ColumnDef<VacationsWithUser>[] = [
  {
    accessorKey: "user_id",
    header: "ID",
    cell: ({ row }) => {
      const id = row.getValue("user_id");

      return (
        <Link
          href={`/vacaciones/${id}`}
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
    accessorKey: "request_date",
    header: "Fecha de solicitud",
  },
  {
    accessorKey: "start",
    header: "Desde",
  },
  {
    accessorKey: "finish",
    header: "Hasta",
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
