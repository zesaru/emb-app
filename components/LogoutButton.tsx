'use client'

import { useState, useTransition } from 'react'
import { LogOut, Loader2, Monitor, Smartphone } from 'lucide-react'
import { toast } from 'react-toastify'
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
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { logoutAndRedirect } from '@/actions/auth-logout'

interface LogoutButtonProps {
  variant?: 'dropdown' | 'button'
  showConfirmation?: boolean
  className?: string
}

export default function LogoutButton({ 
  variant = 'dropdown', 
  showConfirmation = true,
  className = '' 
}: LogoutButtonProps) {
  const [allDevices, setAllDevices] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleLogout = async () => {
    startTransition(async () => {
      try {
        toast.info(allDevices ? 'Cerrando todas las sesiones...' : 'Cerrando sesión...')
        await logoutAndRedirect(allDevices)
      } catch (error) {
        toast.error('Error al cerrar sesión')
        console.error('Logout error:', error)
      }
    })
  }

  const handleDirectLogout = () => {
    startTransition(async () => {
      try {
        await logoutAndRedirect(false)
      } catch (error) {
        toast.error('Error al cerrar sesión')
      }
    })
  }

  if (variant === 'dropdown') {
    return (
      <div className="flex items-center gap-2 w-full">
        {showConfirmation ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <span className="cursor-pointer flex items-center gap-2 text-sm w-full">
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Cerrar Sesión
              </span>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <LogOut className="h-5 w-5" />
                  Confirmar Cierre de Sesión
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>¿Estás seguro que deseas cerrar sesión?</p>
                  
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Checkbox 
                      id="allDevices" 
                      checked={allDevices}
                      onCheckedChange={(checked) => setAllDevices(checked as boolean)}
                    />
                    <Label htmlFor="allDevices" className="text-sm cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        <span>Cerrar sesión en todos los dispositivos</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Esto cerrará sesión en computadoras, tablets y móviles
                      </p>
                    </Label>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleLogout}
                  disabled={isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cerrando...
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <span 
            onClick={handleDirectLogout}
            className="cursor-pointer flex items-center gap-2 text-sm w-full hover:text-red-600 transition-colors"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Cerrar Sesión
          </span>
        )}
      </div>
    )
  }

  // Button variant
  return (
    <Button
      onClick={showConfirmation ? undefined : handleDirectLogout}
      disabled={isPending}
      variant="outline"
      className={`${className}`}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Cerrando...
        </>
      ) : (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </>
      )}
    </Button>
  )
}
