'use client'

import { useState, useEffect } from 'react'
import { Monitor, Smartphone, Tablet, Globe, Clock, MapPin, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

interface DeviceSession {
  id: string
  deviceName: string
  ipAddress: string
  lastUsedAt: Date
  createdAt: Date
  isCurrent: boolean
}

export default function ActiveSessions() {
  const [sessions, setSessions] = useState<DeviceSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulated data - in real implementation, fetch from API
    const mockSessions: DeviceSession[] = [
      {
        id: '1',
        deviceName: 'Windows PC',
        ipAddress: '192.168.1.100',
        lastUsedAt: new Date(),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        isCurrent: true
      },
      {
        id: '2',
        deviceName: 'iPhone',
        ipAddress: '192.168.1.105',
        lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        isCurrent: false
      },
      {
        id: '3',
        deviceName: 'Chrome Browser',
        ipAddress: '10.0.0.50',
        lastUsedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        isCurrent: false
      }
    ]
    
    setTimeout(() => {
      setSessions(mockSessions)
      setLoading(false)
    }, 1000)
  }, [])

  const getDeviceIcon = (deviceName: string) => {
    if (deviceName.toLowerCase().includes('iphone') || deviceName.toLowerCase().includes('android')) {
      return <Smartphone className="h-5 w-5" />
    } else if (deviceName.toLowerCase().includes('ipad') || deviceName.toLowerCase().includes('tablet')) {
      return <Tablet className="h-5 w-5" />
    } else {
      return <Monitor className="h-5 w-5" />
    }
  }

  const formatLastUsed = (date: Date) => {
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMinutes < 1) return 'Ahora mismo'
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`
    if (diffInHours < 24) return `Hace ${diffInHours} horas`
    return `Hace ${diffInDays} días`
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      // In real implementation, call API to revoke session
      setSessions(sessions.filter(s => s.id !== sessionId))
      toast.success('Sesión cerrada exitosamente')
    } catch (error) {
      toast.error('Error al cerrar sesión del dispositivo')
    }
  }

  const handleRevokeAllSessions = async () => {
    try {
      // In real implementation, call API to revoke all sessions except current
      setSessions(sessions.filter(s => s.isCurrent))
      toast.success('Todas las sesiones remotas han sido cerradas')
    } catch (error) {
      toast.error('Error al cerrar las sesiones')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sesiones Activas</CardTitle>
          <CardDescription>Cargando dispositivos conectados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Sesiones Activas
            </CardTitle>
            <CardDescription>
              Dispositivos donde has iniciado sesión recientemente
            </CardDescription>
          </div>
          {sessions.filter(s => !s.isCurrent).length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Cerrar Todas
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cerrar Todas las Sesiones</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto cerrará sesión en todos los dispositivos excepto el actual. 
                    Tendrás que volver a iniciar sesión en esos dispositivos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleRevokeAllSessions}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Cerrar Todas
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.map((session) => (
            <div 
              key={session.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                session.isCurrent ? 'bg-green-50 border-green-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  session.isCurrent ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {getDeviceIcon(session.deviceName)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{session.deviceName}</h4>
                    {session.isCurrent && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        Actual
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {session.ipAddress}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatLastUsed(session.lastUsedAt)}
                    </div>
                  </div>
                </div>
              </div>
              
              {!session.isCurrent && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cerrar Sesión del Dispositivo</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Estás seguro que deseas cerrar sesión en "{session.deviceName}"? 
                        Tendrás que volver a iniciar sesión en ese dispositivo.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleRevokeSession(session.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Cerrar Sesión
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay sesiones activas</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}