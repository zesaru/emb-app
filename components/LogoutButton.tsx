'use client'

import { useState, useTransition } from 'react'
import { LogOut, Loader2, Monitor, Smartphone } from 'lucide-react'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
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
import { simpleLogout } from '@/actions/simple-logout'
import { checkSession } from '@/actions/check-session'
import { debugCookies } from '@/actions/debug-cookies'

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
  const router = useRouter()

  const handleLogout = async () => {
    startTransition(async () => {
      try {
        toast.info('Cerrando sesión...')
        
        // Check session before logout
        console.log('Checking session before logout...')
        const sessionBefore = await checkSession()
        console.log('Session before logout:', sessionBefore)
        
        // Debug cookies before logout
        console.log('=== COOKIES BEFORE LOGOUT ===')
        const cookiesBefore = await debugCookies()
        console.log('Cookies before logout:', cookiesBefore)
        
        // Perform logout
        const result = await simpleLogout()
        console.log('Logout result:', result)
        
        // Clear client-side storage and cookies
        console.log('Clearing client-side storage...')
        try {
          // Clear localStorage
          localStorage.clear()
          sessionStorage.clear()
          
          // Clear client-side cookies
          document.cookie.split(";").forEach((c) => {
            const eqPos = c.indexOf("=")
            const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
            if (name.startsWith('sb-') || name.includes('supabase')) {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
              console.log(`Cleared client cookie: ${name}`)
            }
          })
          
          console.log('Client-side storage cleared')
        } catch (err) {
          console.error('Error clearing client storage:', err)
        }
        
        // Check session after logout
        console.log('Checking session after logout...')
        const sessionAfter = await checkSession()
        console.log('Session after logout:', sessionAfter)
        
        // Debug cookies after logout
        console.log('=== COOKIES AFTER LOGOUT ===')
        const cookiesAfter = await debugCookies()
        console.log('Cookies after logout:', cookiesAfter)
        
        if (result.success) {
          toast.success('Sesión cerrada exitosamente')
          console.log('Logout successful, redirecting...')
        } else {
          console.error('Logout failed:', result.error)
          toast.error('Error al cerrar sesión')
        }
        
        // Always redirect regardless of logout result
        setTimeout(() => {
          console.log('Forcing redirect to /login')
          window.location.href = '/login'
        }, 500)
        
      } catch (error) {
        console.error('Logout error:', error)
        toast.error('Error al cerrar sesión')
        
        // Force redirect
        setTimeout(() => {
          window.location.href = '/login'
        }, 500)
      }
    })
  }

  const handleDirectLogout = () => {
    startTransition(async () => {
      try {
        toast.info('Cerrando sesión...')
        
        const result = await simpleLogout()
        
        // Clear client-side storage and cookies
        try {
          localStorage.clear()
          sessionStorage.clear()
          
          document.cookie.split(";").forEach((c) => {
            const eqPos = c.indexOf("=")
            const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
            if (name.startsWith('sb-') || name.includes('supabase')) {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
            }
          })
        } catch (err) {
          console.error('Error clearing client storage:', err)
        }
        
        if (result.success) {
          toast.success('Sesión cerrada exitosamente')
        } else {
          console.error('Logout error:', result.error)
          toast.error('Error al cerrar sesión')
        }
        
        // Always redirect regardless of logout result
        window.location.href = '/login'
      } catch (error) {
        console.error('Logout error:', error)
        toast.error('Error al cerrar sesión')
        
        // Force redirect
        window.location.href = '/login'
      }
    })
  }

  if (variant === 'dropdown') {
    return (
      <div className="flex items-center gap-2 w-full">
        {showConfirmation ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="cursor-pointer flex items-center gap-2 text-sm w-full text-left hover:bg-accent hover:text-accent-foreground rounded-sm px-2 py-1.5 transition-colors">
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Cerrar Sesión
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <LogOut className="h-5 w-5" />
                  )}
                  {isPending ? 'Cerrando Sesión...' : 'Confirmar Cierre de Sesión'}
                </AlertDialogTitle>
                <AlertDialogDescription className={isPending ? "text-blue-600" : ""}>
                  {isPending ? (
                    "Cerrando sesión, por favor espera..."
                  ) : (
                    "¿Estás seguro que deseas cerrar sesión?"
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>
                  Cancelar
                </AlertDialogCancel>
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
          <button 
            onClick={handleDirectLogout}
            className="cursor-pointer flex items-center gap-2 text-sm w-full hover:text-red-600 transition-colors text-left px-2 py-1.5 rounded-sm hover:bg-accent"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Cerrar Sesión
          </button>
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
