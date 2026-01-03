"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CompensatorysWithUser } from '@/types/collections';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const columns: ColumnDef<CompensatorysWithUser>[] = [
  {
    accessorKey: "event_date",
    header: "Fecha",
    cell: ({ row }) => {
      const date = row.getValue("event_date") as string | null;
      if (date) {
        return <div className="text-gray-600 font-medium">{date.split('T')[0]}</div>;
      }
      const compensatedDay = row.original.compensated_hours_day as string | null;
      if (compensatedDay) {
        return <div className="text-gray-600 font-medium">{compensatedDay.split('T')[0]}</div>;
      }
      return <div className="text-gray-400">-</div>;
    },
  },
  {
    accessorKey: "description",
    header: "Descripción",
    cell: ({ row }) => {
      const eventName = row.original.event_name;
      const tTimeStart = row.original.t_time_start;
      const hours = Number(row.original.hours ?? 0);
      const compensatedHours = Number(row.original.compensated_hours ?? 0);

      let description = "";
      if (hours > 0) {
        description = eventName || (tTimeStart ? `Para compensar ${tTimeStart}` : "Horas trabajadas");
      } else if (compensatedHours > 0) {
        description = "Uso de compensatorio";
      } else {
        description = "Solicitud registrada";
      }

      return <div className="text-gray-800">{description}</div>;
    },
  },
  {
    id: "entrada",
    header: () => (
      <div className="flex items-center gap-1">
        <TrendingUp className="h-4 w-4 text-green-600" />
        <span>Entrada</span>
      </div>
    ),
    cell: ({ row }) => {
      const hours = Number(row.original.hours ?? 0);
      if (hours > 0) {
        return (
          <div className="text-green-600 font-semibold">
            +{hours}
          </div>
        );
      }
      return <div className="text-gray-300">-</div>;
    },
  },
  {
    id: "salida",
    header: () => (
      <div className="flex items-center gap-1">
        <TrendingDown className="h-4 w-4 text-red-500" />
        <span>Salida</span>
      </div>
    ),
    cell: ({ row }) => {
      const hours = Number(row.original.compensated_hours ?? 0);
      if (hours > 0) {
        return (
          <div className="text-red-500 font-semibold">
            -{hours}
          </div>
        );
      }
      return <div className="text-gray-300">-</div>;
    },
  },
  {
    id: "saldo",
    header: "Saldo",
    cell: ({ row, table }) => {
      const { rows } = table.getRowModel();
      const rowIndex = rows.findIndex(r => r.id === row.id);

      // Calcular saldo acumulado hasta esta fila
      let balance = 0;
      for (let i = 0; i <= rowIndex; i++) {
        const r = rows[i];
        const entrada = Number(r.original.hours ?? 0);
        const salida = Number(r.original.compensated_hours ?? 0);
        balance += entrada - salida;
      }

      const balanceClass = balance >= 0 ? "text-gray-700" : "text-red-500";

      return (
        <div className={`font-semibold ${balanceClass}`}>
          {balance}
        </div>
      );
    },
  },
]