"use client"

import { ColumnDef } from "@tanstack/react-table"
import { isCompensatoryMovementApproved as isApproved, type CompensatoryHistoryRow } from "@/lib/compensatorios/history";
import { TrendingUp, TrendingDown } from 'lucide-react';
import { CancelRequestButton } from "@/app/(dashboard)/_components/cancel-request-button";
import { SuperAdminForceCancelButton } from "@/app/(dashboard)/_components/super-admin-force-cancel-button";

function isCancelled(row: CompensatoryHistoryRow) {
  return Boolean(row.cancelled_at);
}

export const columns: ColumnDef<CompensatoryHistoryRow>[] = [
  {
    accessorKey: "movementDate",
    header: "Fecha",
    cell: ({ row }) => <div className="whitespace-nowrap font-medium text-gray-600">{row.original.movementDate ?? "—"}</div>,
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
    id: "estado",
    header: "Estado",
    cell: ({ row }) => {
      if (isCancelled(row.original)) {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
            Cancelada
          </span>
        );
      }
      if (isApproved(row.original)) {
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
    header: "Saldo acumulado",
    cell: ({ row }) => {
      const balance = row.original.runningBalance;
      const balanceClass = balance >= 0 ? "text-gray-700" : "text-red-500";

      return (
        <div className={`font-semibold ${balanceClass}`}>
          {balance}
        </div>
      );
    },
  },
  {
    id: "accion",
    header: "Acción",
    cell: ({ row }) => (
      <div className="flex flex-col items-start gap-1">
        <CancelRequestButton
          requestId={row.original.id ?? ""}
          ownerId={row.original.user_id ?? ""}
          isPending={!isApproved(row.original) && !isCancelled(row.original)}
          resource="compensatorio"
        />
        <SuperAdminForceCancelButton
          requestId={row.original.id ?? ""}
          isCancelled={isCancelled(row.original)}
          resource="compensatorio"
        />
      </div>
    ),
  },
]
