"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import superAdminForceCancelCompensatorio from "@/actions/super-admin-force-cancel-compensatorio"
import superAdminForceCancelVacation from "@/actions/super-admin-force-cancel-vacation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"

interface SuperAdminForceCancelButtonProps {
  requestId: string
  isCancelled: boolean
  resource: "vacation" | "compensatorio"
}

export function SuperAdminForceCancelButton({
  requestId,
  isCancelled,
  resource,
}: SuperAdminForceCancelButtonProps) {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [open, setOpen] = useState(false)
  const [isSubmitting, startTransition] = useTransition()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return
      const { data } = await supabase.from("users").select("role").eq("id", user.id).single()
      if (mounted) setIsSuperAdmin(String(data?.role || "").toLowerCase() === "super_admin")
    })()
    return () => {
      mounted = false
    }
  }, [])

  if (!isSuperAdmin || isCancelled) {
    return null
  }

  const handleConfirm = () => {
    startTransition(async () => {
      const action = resource === "vacation" ? superAdminForceCancelVacation : superAdminForceCancelCompensatorio
      const response = await action(requestId)

      if (response?.success) {
        toast.success("Solicitud eliminada.")
        setOpen(false)
      } else {
        toast.error(response?.error || "No se pudo eliminar la solicitud.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          Forzar eliminación
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Forzar eliminación de esta solicitud?</DialogTitle>
          <DialogDescription>
            Esta acción es exclusiva de super administrador y funciona incluso si la
            solicitud ya fue aprobada. Quedará marcada como cancelada, no podrá
            revertirse desde la UI, y si estaba aprobada su saldo consumido se
            restaura automáticamente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Volver
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Eliminando..." : "Sí, forzar eliminación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
