"use client"

import { ColumnDef } from "@tanstack/react-table"
import { VacationsWithUser } from '@/types/collections';

export const columns: ColumnDef<VacationsWithUser>[] = [
  {
    accessorKey: "request_date",
    header: "Fecha de Solicitud",
    cell: ({ row }) => {
      const date = row.getValue("request_date") as string | null;
      if (date) {
        const formatted = new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return <div className="text-gray-600 font-medium">{formatted}</div>;
      }
      return <div className="text-gray-400">-</div>;
    },
  },
  {
    accessorKey: "period",
    header: "Período",
    cell: ({ row }) => {
      const period = row.original.period;
      const start = row.original.start as string | null;
      const finish = row.original.finish as string | null;

      let description = period;
      if (!description && start && finish) {
        const startDate = new Date(start).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        const finishDate = new Date(finish).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        description = `${startDate} - ${finishDate}`;
      }

      return <div className="text-gray-800">{description || "Vacaciones"}</div>;
    },
  },
  {
    accessorKey: "days",
    header: "Días Solicitados",
    cell: ({ row }) => {
      const days = Number(row.getValue("days") ?? 0);
      if (days > 0) {
        return (
          <div className="inline-flex items-center justify-center px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-sm font-medium rounded">
            {days} días
          </div>
        );
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
  },
  {
    id: "saldo",
    header: "Saldo",
    cell: ({ row, table }) => {
      const { rows } = table.getRowModel();
      const rowIndex = rows.findIndex(r => r.id === row.id);

      // Calcular saldo acumulado (días restantes)
      // Empezamos con el saldo actual del usuario y vamos restando
      let balance = 0;
      const userNumVacations = row.original.user1?.num_vacations ?? 0;

      // El saldo es lo que queda después de todas las vacaciones aprobadas
      // hasta este punto en orden cronológico inverso (más reciente arriba)
      let approvedDaysSoFar = 0;
      for (let i = 0; i <= rowIndex; i++) {
        const r = rows[i];
        if (r.original.approve_request) {
          approvedDaysSoFar += Number(r.original.days ?? 0);
        }
      }

      // Mostrar saldo restante en este punto
      balance = Number(userNumVacations) - approvedDaysSoFar;

      const balanceClass = balance >= 0 ? "text-gray-700" : "text-red-500";

      return (
        <div className={`font-semibold ${balanceClass}`}>
          {balance}
        </div>
      );
    },
  },
]
