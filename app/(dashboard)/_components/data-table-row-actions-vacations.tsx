"use client"

import { Row } from "@tanstack/react-table"
import { useTransition } from "react";
import updateApproveVacations from "@/actions/updateVacations";
import { toast } from "react-toastify";
import { VacationsWithUser } from "@/types/collections";

interface DataTableRowActionsProps {
  row: Row<VacationsWithUser>
}

export function DataTableRowActions({
    row
}: DataTableRowActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      // Convertir VacationsWithUser al formato esperado por updateVacations
      const data = row.original;
      const userEmail = data.user1?.email ?? data.users?.[0]?.email ?? '';
      const userVacations = data.user1?.num_vacations ?? data.users?.[0]?.num_vacations ?? 0;

      const vacationInput = {
        id: data.id,
        user_id: data.id_user ?? '',
        email: userEmail || 'no-email',
        num_vacations: userVacations,
        days: data.days ?? 0,
      };

      const response = await updateApproveVacations(vacationInput);
      if (response?.success) {
        toast("🦄 Ha sido aprobado el dia de vacaciones!", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      } else if (response?.error) {
        toast(`❌ Error: ${response.error}`, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      }
    });
  }

  return (
    <div className="flex flex-row space-x-2">
      <button onClick={handleClick} type="button" className="text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-4 py-2 text-center mr-1 mb-1">Aprobar</button>
    </div>
  )
}
