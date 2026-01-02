# Ejemplos de Uso - Supabase SSR Orchestrator

## Server Component (sin 'use client')

```typescript
// app/(dashboard)/(routes)/compensatorios/page.tsx
import { createClient } from '@/utils/supabase/server'
import { CompensatorysWithUser } from '@/types/collections'

export const dynamic = 'force-dynamic'

export default async function CompensatoriosPage() {
  const supabase = createClient()

  const { data: compensatorys } = await supabase
    .from('compensatorys')
    .select('*, user1:users!user_id(*), user2:users!approved_by(*)')
    .gte('hours', 0)
    .order('event_date', { ascending: false })

  return (
    <div>
      {compensatorys?.map(c => (
        <div key={c.id}>{c.event_name}</div>
      ))}
    </div>
  )
}
```

## Client Component (con 'use client')

```typescript
// components/my-client-component.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export function MyClientComponent() {
  const [data, setData] = useState([])
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('users')
      .select('*')
      .then(({ data }) => setData(data))
  }, [])

  return <div>{/* render data */}</div>
}
```

## Server Action ('use server')

```typescript
// actions/update-compensatorio.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveCompensatory(id: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  await supabase
    .from('compensatorys')
    .update({
      approve_request: true,
      approved_date: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq('id', id)

  revalidatePath('/compensatorios')
  return { success: true }
}
```

## Route Handler (API Route)

```typescript
// app/api/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
```

## Middleware

```typescript
// middleware.ts
import { updateSession } from '@/utils/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Actualiza sesión y maneja redirecciones
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

## Llamada a función RPC

```typescript
// actions/getCompensatoriosNoApproved.ts
import { createClient } from '@/utils/supabase/server'
import { CompensatorysWithUser } from '@/types/collections'

export const dynamic = 'force-dynamic'

export default async function getCompensatoriosNoApproved(): Promise<CompensatorysWithUser[]> {
  const supabase = createClient()

  const { data } = await supabase.rpc('list_unapproved_compensatorys')
  return (data as any) || []
}
```

## Auth en Server Component

```typescript
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // user.id, user.email están disponibles
  return <div>Bienvenido {user.email}</div>
}
```

## Auth en Client Component (con suscripción real-time)

```typescript
'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export function AuthStatus() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Obtener usuario actual
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Escuchar cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return <div>{user ? `Hola ${user.email}` : 'No autenticado'}</div>
}
```

## Insert con relación

```typescript
// actions/add-compensatorios.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export const addPost = async (formData: FormData) => {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const eventName = formData.get('event_name') as string
  const hours = Number(formData.get('hours'))
  const eventDate = formData.get('event_date') as string

  const { data, error } = await supabase
    .from('compensatorys')
    .insert({
      event_name: eventName,
      hours: hours,
      event_date: eventDate,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/compensatorios')
  return { success: true, data }
}
```

## Query con joins

```typescript
// Join simple: compensatorio con su usuario
const { data } = await supabase
  .from('compensatorys')
  .select('*, user1:users!user_id(*)')
  .eq('id', id)

// Join múltiple: compensatorio con usuario que creó y usuario que aprobó
const { data } = await supabase
  .from('compensatorys')
  .select('*, user1:users!user_id(*), user2:users!approved_by(*)')
  .order('event_date', { ascending: false })

// Join en vacations
const { data } = await supabase
  .from('vacations')
  .select('*, user1:users!id_user(*)')
  .gte('days', 0)
```
