"use client"

import { ColumnDef } from "@tanstack/react-table"
import { VacationsWithUser } from '@/types/collections';
import { Eye } from "lucide-react"
import Link from "next/link"

export const columns: ColumnDef<VacationsWithUser>[] = [
  {
    accessorKey: "user_id",
    header: "Ver",
    cell: ({ row }) => {
      const userId = row.getValue("user_id") as string;
      return (
        <Link href={`/vacaciones/${userId}`} className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 text-gray-600">
          <Eye className="h-4 w-4" />
        </Link>
      );
    },
  },
  {
    accessorFn: (row) => row.user1?.name,
    header: "Usuario",
    id: "user1.name",
    cell: ({ row }) => {
      const name = row.original.user1?.name;
      return <div className="text-gray-800">{name || "Usuario"}</div>;
    },
  },
  {
    accessorKey: "request_date",
    header: "Fecha de Solicitud",
    cell: ({ row }) => {
      const date = row.getValue("request_date") as string | null;
      if (date) {
        const formatted = new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return <div className="text-gray-600">{formatted}</div>;
      }
      return <div className="text-gray-400">-</div>;
    },
  },
  {
    accessorKey: "start",
    header: "Inicio",
    cell: ({ row }) => {
      const date = row.getValue("start") as string | null;
      if (date) {
        const formatted = new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return <div className="text-gray-600">{formatted}</div>;
      }
      return <div className="text-gray-400">-</div>;
    },
  },
  {
    accessorKey: "finish",
    header: "Fin",
    cell: ({ row }) => {
      const date = row.getValue("finish") as string | null;
      if (date) {
        const formatted = new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return <div className="text-gray-600">{formatted}</div>;
      }
      return <div className="text-gray-400">-</div>;
    },
  },
  {
    accessorKey: "days",
    header: "Días",
    cell: ({ row }) => {
      const days = Number(row.getValue("days") ?? 0);
      if (days > 0) {
        return <div className="text-gray-800">{days} días</div>;
      }
      return <div className="text-gray-400">-</div>;
    },
  },
  {
    accessorKey: "approve_request",
    header: "Estado",
    cell: ({ row }) => {
      const approved = row.getValue("approve_request");
      if (approved) {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Aprobado
          </span>
        );
      }
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Pendiente
        </span>
      );
    },
  }
]
