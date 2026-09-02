# Línea base para migrar backend a Supabase

Fecha de referencia: 2026-09-02

## Resultado de Fase 0

- Tests unitarios: 32 archivos, 169 pruebas aprobadas.
- Build de Next.js: aprobado.
- Lint de Supabase producción: sin errores ni warnings.
- Historial de migraciones: 29 migraciones locales y remotas alineadas.
- Repositorio: rama `chore/align-supabase-migrations`, sin cambios pendientes.

## Métricas agregadas de producción

- Colaboradores administrativos activos: 7.
- Grants de vacaciones: 6.
- Consumos de grants: 17.
- Días disponibles en grants: 101.
- Solicitudes de vacaciones pendientes: 2.
- Solicitudes de compensatorios pendientes: 0.

## Backend actual

### Vercel Cron (`vercel.json`)

- `/api/cron/vacation-grants`: generación quincenal de grants.
- `/api/cron/pending-approvals-reminder`: recordatorios laborales.
- `/api/cron`: backup diario.

### API Routes de Next.js

- Backups y restauración: `/api/backup`, `/api/backups`, `/api/restore`.
- Aprobaciones: `/api/compensatorys/approve`, `/api/compensatorys/approve-hour`.
- Correos: `/api/send`.
- Autenticación: `/auth/*`.

### Supabase ya existente

- RPCs para aprobación, cancelación y grants.
- Edge Function `send-email`.
- RLS habilitado en tablas sensibles.

## Criterios para cada fase

1. Probar primero en Supabase local.
2. Comparar el resultado con la implementación actual.
3. Ejecutar tests y build.
4. Desplegar una sola función o cron.
5. Mantener rollback documentado antes de retirar la ruta de Vercel.

La siguiente fase aislada será migrar la generación de grants de vacaciones.
