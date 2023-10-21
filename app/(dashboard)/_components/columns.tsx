"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CompensatorysWithUser } from "@/types/collections";
import { ArrowUpDown, GanttChartSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTableRowActions } from "./data-table-row-actions";

export const columns: ColumnDef<CompensatorysWithUser>[] = [
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
    accessorKey: "event_name",
    header: "Nombre del Evento / Solicitud de Ausencia",
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
      );
    },
  },
  {
    accessorKey: "hours",
    header: "Horas",
  },
  {
    accessorKey: "approve_request",
    header: "Registro",
    cell: ({ row }) => {
      const estado = row.getValue("approve_request") ? "Aprobado" : "Pendiente";

      return <div className="text-center font-medium">{estado}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  }
];