"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import cancelCompensatorio from "@/actions/cancel-compensatorio"
import cancelVacation from "@/actions/cancel-vacation"
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

interface CancelRequestButtonProps {
  requestId: string
  ownerId: string
  isPending: boolean
  resource: "vacation" | "compensatorio"
}

export function CancelRequestButton({
  requestId,
  ownerId,
  isPending,
  resource,
}: CancelRequestButtonProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [isSubmitting, startTransition] = useTransition()

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setCurrentUserId(data.user?.id ?? null)
    })
    return () => {
      mounted = false
    }
  }, [])

  if (!isPending || !currentUserId || currentUserId !== ownerId) {
    return null
  }

  const handleConfirm = () => {
    startTransition(async () => {
      const action = resource === "vacation" ? cancelVacation : cancelCompensatorio
      const response = await action(requestId)

      if (response?.success) {
        toast.success("Solicitud cancelada.")
        setOpen(false)
      } else {
        toast.error(response?.error || "No se pudo cancelar la solicitud.")
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
          Cancelar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Cancelar esta solicitud?</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. La solicitud quedará marcada como cancelada
            y ya no podrá ser aprobada.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Volver
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Cancelando..." : "Sí, cancelar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
