'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function MessagesInner() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')
  return (
    <>
      {error && (
        <p className="mt-4 p-4 bg-neutral-900 text-neutral-300 text-center">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 p-4 bg-neutral-900 text-neutral-300 text-center">
          {message}
        </p>
      )}
    </>
  )
}

export default function Messages() {
  return (
    <Suspense fallback={<p className="mt-4 text-center">Cargando...</p>}>
      <MessagesInner />
    </Suspense>
  )
}
