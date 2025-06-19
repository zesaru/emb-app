import { Suspense } from 'react'
import { redirectIfAuthenticated } from '@/lib/auth'
import LoginPageClient from './_components/LoginPageClient'

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Cargando...</p>
      </div>
    </div>
  )
}

export default async function Login() {
  // Redirect to dashboard if already authenticated
  await redirectIfAuthenticated()

  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageClient />
    </Suspense>
  )
}
