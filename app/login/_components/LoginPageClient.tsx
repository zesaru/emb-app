'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import LoginForm from './LoginForm'
import { loginWithCredentials } from '@/actions/auth-login'

export default function LoginPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  const handleLogin = async (data: { email: string; password: string; rememberMe: boolean }) => {
    try {
      await loginWithCredentials(data.email, data.password, data.rememberMe)
      toast.success('Sesión iniciada correctamente')
      router.push('/')
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión')
      throw error
    }
  }

  return (
    <LoginForm 
      onSubmit={handleLogin}
      error={error || undefined}
      message={message || undefined}
    />
  )
}