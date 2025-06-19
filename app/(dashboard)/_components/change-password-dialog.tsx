'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Icons } from '@/components/animatespin'
import { AlertCircle, Check, Eye, EyeOff, Key } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { changePasswordSchema } from '@/lib/validation'
import { changePasswordAction } from '@/actions/auth-change-password'
import { toast } from 'react-toastify'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import * as z from 'zod'

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

interface PasswordStrength {
  score: number
  feedback: string[]
  color: string
}

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const newPassword = form.watch('newPassword')

  const getPasswordStrength = (password: string): PasswordStrength => {
    if (!password) return { score: 0, feedback: [], color: 'bg-gray-300' }

    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      longLength: password.length >= 12,
    }

    const score = Object.values(checks).filter(Boolean).length
    const feedback: string[] = []

    if (!checks.length) feedback.push('Al menos 8 caracteres')
    if (!checks.lowercase) feedback.push('Minúsculas (a-z)')
    if (!checks.uppercase) feedback.push('Mayúsculas (A-Z)')
    if (!checks.numbers) feedback.push('Números (0-9)')
    if (!checks.special) feedback.push('Caracteres especiales (!@#$...)')
    if (checks.longLength) feedback.push('Longitud excelente')

    let color = 'bg-red-500'
    if (score >= 5) color = 'bg-green-500'
    else if (score >= 4) color = 'bg-yellow-500'
    else if (score >= 2) color = 'bg-orange-500'

    return { score, feedback, color }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  const onSubmit = async (data: ChangePasswordFormData) => {
    setLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('currentPassword', data.currentPassword)
      formData.append('newPassword', data.newPassword)
      formData.append('confirmPassword', data.confirmPassword)

      const result = await changePasswordAction(formData)

      if (result.success) {
        toast.success('Contraseña actualizada correctamente')
        setOpen(false)
        form.reset()
      } else if (result.rateLimited) {
        toast.error('Demasiados intentos. Intenta nuevamente más tarde.')
      } else if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, errors]) => {
          form.setError(field as keyof ChangePasswordFormData, {
            message: errors[0]
          })
        })
      } else {
        toast.error(result.error || 'Error al cambiar la contraseña')
      }
    } catch (error) {
      toast.error('Error inesperado. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm text-left">
          <Key className="mr-2 h-4 w-4" />
          <span>Cambiar Contraseña</span>
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Cambiar Contraseña
          </DialogTitle>
          <DialogDescription>
            Cambia tu contraseña para mantener tu cuenta segura. Una contraseña fuerte debe tener al menos 8 caracteres y contener una mezcla de letras, números y símbolos.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Contraseña Actual */}
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña Actual</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="Ingresa tu contraseña actual"
                        {...field}
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        disabled={loading}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nueva Contraseña */}
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Ingresa tu nueva contraseña"
                        {...field}
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        disabled={loading}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                  
                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Fortaleza:</span>
                        <Progress 
                          value={(passwordStrength.score / 6) * 100} 
                          className="flex-1 h-2"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {['Al menos 8 caracteres', 'Minúsculas (a-z)', 'Mayúsculas (A-Z)', 'Números (0-9)', 'Caracteres especiales', 'Longitud > 12'].map((requirement, index) => {
                          const isValid = [
                            newPassword.length >= 8,
                            /[a-z]/.test(newPassword),
                            /[A-Z]/.test(newPassword),
                            /\d/.test(newPassword),
                            /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
                            newPassword.length >= 12
                          ][index]
                          
                          return (
                            <div key={requirement} className={`flex items-center gap-1 ${isValid ? 'text-green-600' : 'text-gray-500'}`}>
                              <Check className={`h-3 w-3 ${isValid ? 'text-green-600' : 'text-gray-300'}`} />
                              <span>{requirement}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* Confirmar Contraseña */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirma tu nueva contraseña"
                        {...field}
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {passwordStrength.score < 4 && newPassword && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Tu contraseña podría ser más segura. Considera agregar más tipos de caracteres.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading || passwordStrength.score < 3}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Cambiando...
                  </>
                ) : (
                  'Cambiar Contraseña'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}