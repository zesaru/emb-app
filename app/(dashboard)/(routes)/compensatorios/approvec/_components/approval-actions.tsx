"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Check, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { CompensatorysWithUser } from "@/types/collections"
import UpdateCompensatorio from "@/actions/updateCompensatorio"

interface ApprovalActionsProps {
  compensatory: CompensatorysWithUser[]
}

export function ApprovalActions({ compensatory }: ApprovalActionsProps) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const record = compensatory?.[0]

  // Si ya está aprobado, no mostrar botones
  const isApproved = record?.final_approve_request === "true" || record?.approve_request === "true"

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      // Preparar datos con todos los campos requeridos
      const compensatoryData: CompensatorysWithUser = [{
        ...record!,
        approve_request: "true",
        approved_date: new Date().toISOString(),
        approved_by: "", // Se llenará en el server action
      }]

      const result = await UpdateCompensatorio(compensatoryData)

      if (result.success) {
        toast.success("Solicitud aprobada correctamente")
        setTimeout(() => router.push("/compensatorios"), 2000)
      } else {
        toast.error(result.error || "Error al aprobar la solicitud")
      }
    } catch (error) {
      toast.error("Error al procesar la aprobación")
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    try {
      // Para rechazar, actualizamos directamente
      const response = await fetch("/api/reject-compensatory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record?.id }),
      })

      if (response.ok) {
        toast.success("Solicitud rechazada")
        setTimeout(() => router.push("/compensatorios"), 2000)
      } else {
        const error = await response.json()
        toast.error(error.message || "Error al rechazar la solicitud")
      }
    } catch (error) {
      // Si no hay endpoint API, rechazar localmente y mostrar mensaje
      toast.info("Función de rechazo: Contacte al desarrollador para implementar el endpoint")
      setIsRejecting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones</CardTitle>
        <CardDescription>
          {isApproved ? "Esta solicitud ya ha sido procesada" : "Aprobar o rechazar esta solicitud"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isApproved && (
          <>
            {/* Botón Aprobar */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full" variant="default" disabled={isApproving || isRejecting}>
                  {isApproving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Aprobar
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Aprobar solicitud?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Confirmar que deseas aprobar esta solicitud de {record?.hours || 0} horas compensatorias
                    para {record?.user1?.name || "el usuario"}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isApproving}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Confirmar aprobación
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Botón Rechazar */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full" variant="destructive" disabled={isApproving || isRejecting}>
                  {isRejecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Rechazar
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Rechazar solicitud?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Confirmar que deseas rechazar esta solicitud. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isRejecting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReject}
                    disabled={isRejecting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Confirmar rechazo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {isApproved && (
          <Button
            className="w-full"
            variant="outline"
            onClick={() => router.push("/compensatorios")}
          >
            Volver a la lista
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
