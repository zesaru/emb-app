"use client"

import { Badge } from "@/components/ui/badge"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { CompensatorysWithUser } from "@/types/collections"

interface ApprovecHeaderProps {
  compensatory: CompensatorysWithUser[]
}

export function ApprovecHeader({ compensatory }: ApprovecHeaderProps) {
  const record = compensatory?.[0]

  if (!record) {
    return null
  }

  // Determinar estado y color
  const getStatus = () => {
    if (record.final_approve_request === "true") {
      return { label: "Aprobado", variant: "default" as const, className: "bg-green-500 hover:bg-green-600" }
    }
    if (record.approve_request === "true") {
      return { label: "Parcialmente Aprobado", variant: "secondary" as const, className: "bg-yellow-500 hover:bg-yellow-600" }
    }
    return { label: "Pendiente", variant: "outline" as const, className: "bg-gray-200 text-gray-800" }
  }

  const status = getStatus()

  return (
    <div className="flex items-center justify-between">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/compensatorios" className="flex items-center hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/compensatorios" className="hover:text-foreground transition-colors">
          Compensatorios
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Detalle</span>
      </nav>

      {/* Badge de estado */}
      <Badge className={status.className}>
        {status.label}
      </Badge>
    </div>
  )
}
