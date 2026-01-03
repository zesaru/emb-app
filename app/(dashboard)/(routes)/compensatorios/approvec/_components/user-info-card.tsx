"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, CalendarClock } from "lucide-react"
import { CompensatorysWithUser } from "@/types/collections"

interface UserInfoCardProps {
  compensatory: CompensatorysWithUser[]
}

export function UserInfoCard({ compensatory }: UserInfoCardProps) {
  const record = compensatory?.[0]
  const user = record?.user1

  if (!record || !user) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          Información del Solicitante
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nombre */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-sky-500/10 flex items-center justify-center">
            <User className="h-5 w-5 text-sky-500" />
          </div>
          <div>
            <p className="font-medium text-sm">{user.name || "Usuario"}</p>
            <p className="text-xs text-muted-foreground">{user.role || "Empleado"}</p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center gap-3 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{user.email || ""}</span>
        </div>

        <div className="border-t pt-4 space-y-3">
          {/* Balance Compensatorios */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Compensatorios</span>
            <span className="font-semibold text-sky-600">
              {user.num_compensatorys || "0"}
            </span>
          </div>

          {/* Balance Vacaciones */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Vacaciones</span>
            <span className="font-semibold text-green-600">
              {user.num_vacations || "0"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
