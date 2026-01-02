# Supabase SSR Orchestrator

Este proyecto usa Next.js 13+ App Router con Supabase SSR (`@supabase/ssr`).

## Clientes Disponibles

1. **Server Client** - `@/utils/supabase/server`
   - Para: Server Components, Server Actions, Route Handlers
   - Usa: `createServerClient()` con cookies de next/headers
   - NO usar en Client Components

2. **Browser Client** - `@/utils/supabase/client`
   - Para: Client Components (con 'use client')
   - Usa: `createBrowserClient()`
   - NO usar en Server Components

3. **Middleware Helper** - `@/utils/supabase/middleware`
   - Para: middleware.ts exclusivamente
   - Usa: `updateSession(request)`

4. **Legacy** - `@/lib/supabase`
   - OBSOLETO: Singleton browser client
   - No usar en código nuevo

## Regla de Oro

**NUNCA mezclar clientes**: Si el archivo tiene `'use client'`, usa `@/utils/supabase/client`. Si no, usa `@/utils/supabase/server`.

---

## Linter de Importación

Antes de escribir código con Supabase, verifica el tipo de archivo:

### Si el archivo comienza con `'use client'`:
```typescript
// ✅ CORRECTO
import { createClient } from '@/utils/supabase/client'

// ❌ INCORRECTO - causará error de hidratación
import { createClient } from '@/utils/supabase/server'
import { createServerClient } from '@supabase/ssr'
```

### Si el archivo NO tiene `'use client'` (Server Component):
```typescript
// ✅ CORRECTO
import { createClient } from '@/utils/supabase/server'

// ❌ INCORRECTO - no funcionará en el servidor
import { createClient } from '@/utils/supabase/client'
```

### Para Server Actions (`'use server'`):
```typescript
// ✅ CORRECTO - usa server client
import { createClient } from '@/utils/supabase/server'
```

### Para middleware.ts:
```typescript
// ✅ CORRECTO
import { updateSession } from '@/utils/supabase/middleware'
```

## Errores Comunes a Evitar

1. **Error de hidratación**: Usar `@/utils/supabase/server` en un Client Component
2. **Cookies no disponibles**: Usar `@/utils/supabase/client` en un Server Component
3. **Sesión expirada**: No usar `updateSession()` en middleware.ts
4. **Imports obsoletos**: `@supabase/auth-helpers-nextjs` fue reemplazado por `@supabase/ssr`

---

## Esquema de Base de Datos

### Tablas Principales

#### users - Usuarios del sistema
```typescript
{
  id: string              // UUID (auth.uid())
  email: string           // Email del usuario
  name: string | null     // Nombre completo
  admin: string | null    // 'admin' o null
  role: string | null     // Rol del usuario
  num_compensatorys: number | null  // Horas compensatorias acumuladas
  num_vacations: number | null      // Días de vacaciones disponibles
  created_at: string
}
```

#### compensatorys - Tiempo compensatorio
```typescript
{
  id: string                        // UUID
  user_id: string                   // FK → users.id
  event_name: string | null         // Nombre del evento
  hours: number | null              // Horas trabajadas
  event_date: string | null         // Fecha del evento
  t_time_start: string | null       // Hora inicio (solicitud)
  t_time_finish: string | null      // Hora fin (solicitud)
  compensated_hours: number | null  // Horas compensadas
  compensated_hours_day: string | null
  approve_request: boolean | null   // Aprobado registro
  approved_by: string | null        // FK → users.id
  approved_date: string | null
  final_approve_request: boolean | null  // Aprobado descanso
  approved_by_compensated: string | null // FK → users.id
  created_at: string
}
```

#### vacations - Solicitudes de vacaciones
```typescript
{
  id: string                  // UUID
  id_user: string             // FK → users.id
  start: string | null        // Fecha inicio
  finish: string | null       // Fecha fin
  days: number | null         // Días solicitados
  request_date: string | null
  period: number | null
  approve_request: boolean | null
  approvedby: string | null   // FK → users.id
  approved_date: string | null
  created_at: string
}
```

#### attendances - Registro de asistencia
```typescript
{
  id: number                  // Serial
  user_id: string | null      // FK → users.id
  date: string | null
  name: string | null
  register: number | null     // 0=entrada, 1=salida
  ai: number | null
  created_at: string
}
```

### Funciones RPC Disponibles

```typescript
// Vacaciones pendientes de aprobación
list_unapproved_vacations(): Promise<VacationsWithUser[]>

// Compensatorios pendientes de aprobación (registro)
list_unapproved_compensatorys(): Promise<CompensatorysWithUser[]>

// Compensatorios pendientes de aprobación (descanso/horas)
list_hours_unapproved_compensatorys(): Promise<CompensatorysWithUser[]>

// Conteo de registros pendientes
count_unapproved_records(): Promise<{unapproved_count, final_approve_request_count}[]>

// Acumular horas compensatorias (usado al aprobar registro)
accumulate_compensatory_hours(hours: number, user_id: string): Promise<void>

// Compensatorios por usuario
get_compensatorys_for_user(user_id: string): Promise<Compensatorys[]>

// Horas de entrada/salida
listar_horas_entrada_salida(): Promise<AttendanceRecord[]>

// Insertar vacaciones (con lógica de validación)
insertar_vacaciones(p_start, p_finish, p_days, p_id_user): Promise<Vacations[]>

// Insertar compensatory request (con lógica de validación)
insert_compensatory_rest(p_user_id, p_t_time_start, p_t_time_finish, p_compensated_hours_day, p_compensated_hours): Promise<Compensatorys[]>

// Restar horas compensatorias (usado al aprobar descanso)
subtract_compensatory_hours(hours: number, user_id: string): Promise<void>

// Listar vacaciones y compensatorios no aprobados por usuario
listar_vacaciones_compensatorios_no_aprobados_por_usuario(): Promise<any[]>
```

---

## Consultas Tipadas

Al escribir consultas, usa los tipos de `Database`:

```typescript
import { createClient } from '@/utils/supabase/server'
import type { Database } from '@/types/database'

type Compensatory = Database['public']['Tables']['compensatorys']['Row']
type CompensatoryInsert = Database['public']['Tables']['compensatorys']['Insert']

const supabase = createClient()
const { data } = await supabase
  .from('compensatorys')
  .select('*, user1:users!user_id(*)')
  .eq('approve_request', false)

// data está tipado como Compensatory[] | null
```

---

## Directiva para Server Actions

Agregar `export const dynamic = 'force-dynamic'` a Server Components/Actions que consultan Supabase para prevenir problemas de caché:

```typescript
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

async function getData() {
  const supabase = createClient()
  // ...
}
```
