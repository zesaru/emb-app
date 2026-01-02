# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) cuando trabaja con código en este repositorio.

## Descripción del Proyecto

Aplicación de Gestión de Empleados y Reservas (EMB) construida con Next.js 13+ App Router y Supabase para autenticación y base de datos. La aplicación gestiona tiempo compensatorio de empleados (compensatorios), vacaciones y seguimiento de asistencia.

## Comandos Principales

### Desarrollo
```bash
npm run dev                    # Iniciar servidor de desarrollo Next.js en http://localhost:3000
```

### Build y Producción
```bash
npm run build                  # Construir aplicación Next.js para producción
npm start                      # Iniciar servidor de producción
```

### Tipos de Base de Datos
```bash
npm run gen-types              # Generar tipos TypeScript desde el esquema de Supabase
```

## Arquitectura

### Flujo de Autenticación y Autorización
- Usa Supabase Auth con sesiones basadas en cookies vía `@supabase/auth-helpers-nextjs`
- Middleware (`middleware.ts`) refresca la sesión de autenticación en cada petición
- Rutas de autenticación: `/auth/sign-in`, `/auth/sign-out`, `/auth/callback`
- Página de login en `/login` redirige usuarios autenticados al dashboard
- Control de acceso basado en roles: campo `admin` en tabla `users` determina niveles de UI/acceso

### Patrón de Cliente Supabase
**Crítico**: Usar diferentes constructores de cliente según el contexto con `@supabase/ssr`:
- **Server Components/Actions/Route Handlers**: `createClient()` de `@/utils/supabase/server`
- **Client Components**: Usar el `supabase` exportado de `lib/supabase.ts` (usa `createBrowserClient`)
- **Middleware**: Usar la función `updateSession()` de `@/utils/supabase/middleware`

Utilidades de cliente ubicadas en:
- `utils/supabase/server.ts` - Para Server Components, Actions y Route Handlers
- `utils/supabase/client.ts` - Para Client Components (usa `createBrowserClient`)
- `utils/supabase/middleware.ts` - Para Middleware

Agregar `export const dynamic = 'force-dynamic'` a Server Components/Actions que consultan Supabase para prevenir problemas de caché.

### Estructura de Capa de Datos
- **Database Types**: `types/database.type.ts` auto-generado desde el esquema de Supabase
- **Collection Types**: `types/collections.ts` extiende tipos de base de datos con joins (ej. `CompensatorysWithUser`, `VacationsWithUser`)
- **Actions**: Funciones de obtención de datos del lado del servidor en directorio `actions/`
  - Patrón: `get[Resource]` para obtener, `add[Resource]` para crear, `update[Resource]` para modificar
  - Todas las actions usan `createServerComponentClient` y retornan datos tipados
  - Ejemplos: `getUsers.ts`, `getCompensatoriosNoApproved.ts`, `add-vacations.ts`

### Tablas Principales de Base de Datos
- `users`: Registros de empleados con campos `is_active` y `admin`
- `compensatorys`: Registros de tiempo compensatorio (tipo: register, request_hour, request_day)
- `vacations`: Solicitudes de vacaciones
- `attendances`: Seguimiento de asistencia de empleados con hora de entrada/salida

### Estructura de Rutas
- **Rutas de Autenticación**: `/login`, `/reset` (reseteo de contraseña)
- **Layout de Dashboard**: `app/(dashboard)/layout.tsx` con Sidebar + Navbar
- **Rutas de Dashboard**: `app/(dashboard)/(routes)/`
  - `/` - Inicio del dashboard (vista admin muestra colas de aprobación, vista usuario muestra datos personales)
  - `/compensatorios` - Lista de registros compensatorios
  - `/compensatorios/new` - Registrar trabajo compensatorio
  - `/compensatorios/request` - Solicitar tiempo compensatorio libre
  - `/compensatorios/approvec/[id]` - Flujo de aprobación admin
  - `/vacaciones` - Lista de vacaciones
  - `/vacaciones/new` - Solicitar vacaciones
  - `/calendar` - Vista de calendario de vacaciones (FullCalendar)
  - `/attendances` - Registros de asistencia
  - `/report` - Página de reportes

### Patrones de Componentes
- **Data Tables**: Usa `@tanstack/react-table` con definiciones de columnas personalizadas
  - Patrón: `columns.tsx` define columnas, `data-table.tsx` renderiza tabla
  - Row actions: `data-table-row-actions.tsx` para operaciones de editar/eliminar/aprobar
- **Forms**: React Hook Form + validación Zod
- **UI Components**: Primitivos Radix UI en `components/ui/` (estilo shadcn/ui)
- **State Management**: Zustand con middleware persist (`store/index.ts`) para datos de sesión de usuario

### Integración de Email
- Resend para entrega de emails
- Plantillas React Email en `components/email-template.tsx`
- Endpoint de envío: `app/api/send/route.ts`

### Alias de Rutas
- `@/*` mapea a la raíz del proyecto (definido en `tsconfig.json`)
- Usar `@/components`, `@/actions`, `@/lib`, etc. en imports

## Detalles Clave de Implementación

### Vistas Admin vs Usuario
La página raíz del dashboard (`app/(dashboard)/(routes)/(root)/page.tsx`) verifica `user.admin === "admin"` para mostrar:
- Admin: Colas de aprobación para compensatorios, vacaciones, asistencia
- Usuario: Pestañas de datos personales vía componente `Usertabs`

### Manejo de Fechas
- `date-fns` y `date-fns-tz` para operaciones de fecha
- Formateo de fechas con zona horaria en toda la aplicación

### Navegación
Rutas definidas en `app/(dashboard)/_components/sidebar-routes.tsx` con iconos Lucide. Modificar este archivo para agregar/eliminar items de navegación.

## Variables de Entorno
Requeridas en `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
RESEND_API_KEY
```