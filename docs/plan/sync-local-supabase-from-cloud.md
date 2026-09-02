# Plan: clonar datos de producción (Supabase Cloud) a Supabase Local (Docker)

## Contexto

El objetivo es que el Supabase local (corriendo en Docker vía `supabase start`) tenga los datos reales de producción, para poder probar features contra data realista en vez de datos falsos/sembrados. Alcance confirmado:
- Solo las **4 tablas de negocio** (`users`, `compensatorys`, `vacations`, `attendances`), no todo el schema completo.
- **Sí clonar `auth.users`**, para poder loguearse localmente como cualquier empleado real (con una contraseña temporal compartida, ya que los hashes bcrypt de Supabase no se pueden migrar).

**Hallazgo clave de la exploración**: el repo ya tiene scripts para esto, pero ninguno cubre exactamente el caso pedido:
- `scripts/backup-service-role.ts` (sin trackear en git, creado en una sesión anterior) — ya hace backup de las 4 tablas de negocio desde la nube usando `SUPABASE_SERVICE_ROLE_KEY` vía REST API (`supabase-js`), sin necesitar la contraseña de Postgres ni acceso de "owner" del proyecto (que no tenemos — `supabase projects list` no muestra este proyecto bajo la cuenta CLI logueada). Es la ruta de menor fricción para el backup. **No incluye `auth.users`.**
- `scripts/restore-to-local.ts` y `scripts/restore-full.ts` — restauran recreando las tablas con `DROP TABLE ... CASCADE` + `CREATE TABLE` con columnas simplificadas. Esto **destruye** las políticas RLS, FKs y defaults que las 21 migraciones del repo ya definen localmente, y arriesga romper las RPCs (`list_unapproved_compensatorys`, `restore_backup`, etc.) por mismatch de tipos — el mismo tipo de bug que ya vimos en producción (`20260731010000_fix_compensatorio_queue_select_star.sql`). **No se deben reutilizar tal cual.**
- `restore-full.ts` sí tiene un patrón ya probado para clonar `auth.users` sin los hashes de password: `supabase.auth.signUp()` con password temporal + `UPDATE auth.users SET id = <id original>` para preservar el UUID (necesario porque `public.users.id` debe ser igual a `auth.uid()` — confirmado en `supabase/migrations/20260527002614_enable_rls_for_public_grant_and_outbox_tables.sql`, que usa `where users.id = auth.uid()` en varias políticas RLS). Reutilizamos esta idea, pero con `supabase.auth.admin.createUser({ id, email, password, email_confirm: true })` (Admin API), que en versiones recientes de `supabase-js` permite fijar el `id` directamente al crear — más limpio que el signUp+UPDATE.

Por eso el plan usa un script de restore **nuevo**, hecho a medida, que hace `TRUNCATE` + `INSERT` contra el schema que las migraciones ya crearon (en vez de recrear tablas), preservando RLS/FKs/RPCs intactos.

## 1. Preparar Supabase local con el schema al día

```bash
supabase start
```

Esto levanta los contenedores Docker (Postgres, Auth/GoTrue, Studio, etc.) y aplica automáticamente las 21 migraciones de `supabase/migrations/` + `supabase/seed.sql`. Si los contenedores ya existían de una corrida vieja y se quiere un estado 100% limpio antes de restaurar, usar `supabase db reset` en su lugar (recrea la DB desde cero + reaplica migraciones + seed).

Al terminar, `supabase status` imprime `API URL`, `anon key` y `service_role key` **locales** — se necesitan para el script de restore de auth.

## 2. Extender el backup para incluir `auth.users`

Modificar `scripts/backup-service-role.ts` (agregar, no reescribir la lógica existente de las 4 tablas) para además llamar a `supabase.auth.admin.listUsers()` (paginado) usando el mismo cliente `service_role` ya creado, y guardar el resultado como `backup.authUsers` en el mismo JSON de salida (`backups/backup-<timestamp>.json`). Solo se guardan campos no sensibles: `id`, `email`, `phone`, `email_confirmed_at`, `user_metadata`, `app_metadata` — nunca hashes de password (la Admin API de todos modos nunca los expone).

## 3. Nuevo script: `scripts/restore-business-data-to-local.ts`

Reemplaza (para este caso de uso) a `restore-to-local.ts`/`restore-full.ts`. Flujo:

1. Conectarse a Postgres local (`postgresql://postgres:postgres@localhost:54322/postgres`, vía `pg`, igual que los scripts existentes) y a Auth local (`createClient(LOCAL_URL, LOCAL_SERVICE_ROLE_KEY)`, con `LOCAL_URL`/`LOCAL_SERVICE_ROLE_KEY` tomados de `supabase status` — pasados por env var al ejecutar el script, no hardcodeados).
2. **Recrear usuarios de auth primero** (deben existir antes que `public.users`, por la dependencia lógica `public.users.id = auth.uid()`): por cada entrada en `backup.authUsers`, `supabase.auth.admin.createUser({ id: originalId, email, password: 'ChangeMe123!', email_confirm: true, user_metadata })`. Si el usuario ya existe localmente (re-ejecución del script), capturar el error y continuar (idempotente).
3. **Data-only restore de las 4 tablas de negocio**, en orden seguro por FKs (padres antes que hijos): `users` → `vacations`/`compensatorys` → `attendances`. Para cada tabla:
   - `TRUNCATE public.<tabla> RESTART IDENTITY CASCADE;` (limpia los datos sembrados/de prueba, preservando la estructura creada por las migraciones).
   - Insertar cada fila del backup con los nombres de columna reales, dejando que Postgres valide tipos/constraints/RLS contra el schema real (a diferencia de `restore-full.ts`, que fuerza tipos capturados en el momento del backup).
4. Loggear resumen: cuántos usuarios de auth se crearon/ya existían, cuántas filas por tabla.

Reusar el helper `valueToSql`/casting de `restore-full.ts` como referencia de partida (ya maneja uuid/boolean/timestamptz/jsonb), pero simplificado ya que ahora los tipos se validan contra el schema real en vez de tener que declararlos.

## 4. Comandos de conveniencia (`package.json`)

Agregar dos scripts junto a los `backup:*`/`supabase:*` ya existentes:

```json
"cloud:backup": "tsx scripts/backup-service-role.ts",
"cloud:restore-to-local": "tsx scripts/restore-business-data-to-local.ts"
```

## 5. Flujo de uso final

```bash
npm run supabase:start                 # o: supabase db reset, si ya estaba corriendo
export $(grep -v '^#' .env | xargs)    # trae NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY de prod
npm run cloud:backup                   # genera backups/backup-<ts>.json (datos reales de prod, incluye auth.users)
LOCAL_SUPABASE_URL=http://127.0.0.1:54321 \
LOCAL_SERVICE_ROLE_KEY=<del output de `supabase status`> \
npx tsx scripts/restore-business-data-to-local.ts backups/backup-<ts>.json
```

Nota de seguridad: `npm run cloud:backup` lee de producción (solo lectura) — no hay riesgo de escritura en prod. El script de restore solo escribe en Postgres/Auth **local** (`localhost:54322` / `127.0.0.1:54321`), nunca toca producción.

## Verificación

1. Tras correr el flujo: abrir Supabase Studio local (`http://localhost:54323`) → Table Editor → confirmar que `users`/`compensatorys`/`vacations`/`attendances` tienen las cuentas de filas esperadas (coincidiendo con el conteo que imprime `cloud:backup`).
2. Loguearse en la app corriendo localmente (`npm run dev`, apuntando a `.env.local` con las keys locales) usando el email de un usuario real de producción + la contraseña temporal — confirmar que carga su información real (compensatorios/vacaciones pendientes, etc.).
3. Ejecutar `npx vitest run` para confirmar que nada del código de la app se tocó de forma que rompa los tests existentes (los cambios de este plan son solo scripts nuevos/`package.json`, no tocan `actions/`, `app/`, ni `lib/` de la aplicación).
4. Re-ejecutar `npm run cloud:restore-to-local` una segunda vez con el mismo backup, para confirmar que es idempotente (no falla por usuarios/filas duplicadas).
