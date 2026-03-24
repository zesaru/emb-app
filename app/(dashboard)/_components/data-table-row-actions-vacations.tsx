"use client"

import { Row } from "@tanstack/react-table"
import { useContext, useTransition } from "react"
import { toast } from "sonner"

import updateApproveVacations from "@/actions/updateVacations"
import { VacationsWithUser } from "@/types/collections"

import { VacationsApprovalContext } from "./data-table-vacaciones"

interface DataTableRowActionsProps {
  row: Row<VacationsWithUser>
}

type VacationApprovalRow = VacationsWithUser & {
  email?: string | null
  num_vacations?: number | null
  user_id?: string | null
}

export function DataTableRowActions({
  row,
}: DataTableRowActionsProps) {
  const [isPending, startTransition] = useTransition()
  const approvalContext = useContext(VacationsApprovalContext)
  const isApproving = approvalContext?.isApproving ?? false
  const setIsApproving = approvalContext?.setIsApproving

  const handleClick = () => {
    if (isApproving) {
      return
    }

    startTransition(async () => {
      setIsApproving?.(true)

      try {
        // Soporta tanto el shape del RPC list_unapproved_vacations como joins legacy.
        const data = row.original as VacationApprovalRow
        const userEmail =
          data.email ??
          data.user1?.email ??
          data.users?.[0]?.email ??
          ""
        const userVacations = Number(
          data.num_vacations ??
          data.user1?.num_vacations ??
          data.users?.[0]?.num_vacations ??
          0
        )
        const userId = data.user_id ?? data.id_user ?? ""

        const vacationInput = {
          id: data.id ?? "",
          user_id: userId,
          email: userEmail || "no-email",
          num_vacations: userVacations,
          days: Number(data.days ?? 0),
        }

        const response = await updateApproveVacations(vacationInput)
        if (response?.success) {
          toast.success("Vacaciones aprobadas correctamente.")
        } else if (response?.error) {
          toast.error(`Error: ${response.error}`)
        } else {
          toast.error("No se pudo completar la aprobacion.")
        }
      } finally {
        setIsApproving?.(false)
      }
    })
  }

  return (
    <div className="flex flex-row space-x-2">
      <button
        onClick={handleClick}
        type="button"
        disabled={isPending || isApproving}
        className="text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br disabled:cursor-not-allowed disabled:opacity-60 focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-4 py-2 text-center mr-1 mb-1"
      >
        {isPending || isApproving ? "Aprobando..." : "Aprobar"}
      </button>
    </div>
  )
}
