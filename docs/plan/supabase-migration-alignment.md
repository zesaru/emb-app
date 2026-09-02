# Plan ejecutable para alinear las migraciones de Supabase

Fecha de auditoría: 2026-09-02  
Alcance: `public`, el trigger de alta en `auth.users` y el historial `supabase_migrations.schema_migrations`.  
Estado de esta auditoría: solo lectura. No se modificó el esquema ni el historial remoto.

## Resultado ejecutivo

La base de producción usa PostgreSQL 15.8 y `supabase/config.toml` usa PostgreSQL 15, por lo que la versión mayor está correctamente alineada.

El problema principal no es una ausencia general de tablas: es una divergencia entre los nombres/versiones de los archivos locales y los registros remotos.

| Grupo | Cantidad | Diagnóstico | Tratamiento |
| --- | ---: | --- | --- |
| Migraciones locales | 24 | Cadena imperativa | Conservar el SQL y normalizar versiones |
| Migraciones remotas | 19 | Todas tienen equivalente funcional local | No volver a ejecutar su SQL |
| Versiones antiguas de 12 dígitos | 8 remotas, 9 locales | Formato no canónico; la CLI 2.110.0 no las empareja | Renombrar a 14 dígitos y reparar solo el historial |
| Mismo SQL/nombre con timestamp distinto | 8 | La CLI las interpreta como remotas faltantes y locales pendientes | Renombrar los archivos locales al timestamp remoto |
| Coincidencia exacta de versión | 3 | Alineadas | No modificar |
| Efectos presentes pero sin registro remoto | 5 archivos locales | Baseline, RPC inicial, permisos y seguimiento de invitaciones | Verificar objetos y marcar las versiones canónicas como aplicadas |
| Objetos remotos sin migración local | 2 | `public.keepalive_pings` y `auth.on_auth_users_insert` | Crear una migración de recuperación y marcarla como aplicada tras verificar equivalencia |

El `db push --dry-run` actual falla antes de calcular pendientes y propone marcar ocho versiones remotas como `reverted`. Esa sugerencia no debe ejecutarse de forma masiva: esas ocho migraciones sí están aplicadas y tienen equivalentes locales.

## Evidencia y hallazgos

### 1. Mapeos de timestamp que deben resolverse renombrando archivos

El contenido remoto coincide con el archivo local correspondiente. En cinco casos se verificó igualdad exacta por MD5; en los tres archivos de cancelación la diferencia observada corresponde a comentarios añadidos al archivo local, mientras que el SQL efectivo coincide.

| Archivo local actual | Versión remota canónica |
| --- | --- |
| `20260527002614_enable_rls_for_public_grant_and_outbox_tables.sql` | `20260730065855_enable_rls_for_public_grant_and_outbox_tables.sql` |
| `20260707120000_fix_rls_privilege_escalation.sql` | `20260730065923_fix_rls_privilege_escalation.sql` |
| `20260707120100_fix_approve_vacation_with_grants.sql` | `20260730065942_fix_approve_vacation_with_grants.sql` |
| `20260707120200_add_restore_backup_table_rpc.sql` | `20260730070002_add_restore_backup_table_rpc.sql` |
| `20260731000000_add_cancel_own_request.sql` | `20260731033036_add_cancel_own_request.sql` |
| `20260731010000_fix_compensatorio_queue_select_star.sql` | `20260731035701_fix_compensatorio_queue_select_star.sql` |
| `20260731020000_add_admin_cancel_compensatorio.sql` | `20260731040953_add_admin_cancel_compensatorio.sql` |
| `20260803000000_add_super_admin_role.sql` | `20260803005432_add_super_admin_role.sql` |

No se debe cambiar el historial remoto para estos ocho casos. El repositorio debe adoptar las versiones que producción ya registró.

### 2. Versiones de 12 dígitos

Supabase espera el patrón `<timestamp>_<nombre>.sql`; para este repositorio se estandarizará `YYYYMMDDHHMMSS`. Los archivos antiguos se normalizarán agregando segundos `00`:

| Versión antigua | Versión canónica |
| --- | --- |
| `202603240001` | `20260324000100` |
| `202603240002` | `20260324000200` |
| `202603240003` | `20260324000300` |
| `202603250001` | `20260325000100` |
| `202603260001` | `20260326000100` |
| `202603260002` | `20260326000200` |
| `202603260003` | `20260326000300` |
| `202603260004` | `20260326000400` |
| `202603260005` | `20260326000500` |

Las primeras ocho versiones existen remotamente con el formato antiguo. La novena (`approve_vacation_with_grants`) no figura en el historial, aunque la función y su migración correctiva sí existen en producción.

### 3. Versiones locales cuyos efectos ya existen en producción

Estas migraciones no se deben ejecutar nuevamente en producción:

- `20260323000000_remote_public_schema`: representa el baseline histórico.
- `20260326000500_add_approve_vacation_with_grants_rpc`: la RPC existe y su corrección posterior está registrada.
- `20260810000000_add_compensatory_view_permission`: existen tabla, RLS, policy y permiso objetivo.
- `20260810010000_fix_auemise_compensatory_view_permission`: el permiso objetivo está presente.
- `20260902055224_add_user_invitation_tracking`: existen las cuatro columnas, constraint e índice parcial.

### 4. Drift de esquema no capturado localmente

- `public.keepalive_pings` existe remotamente con `id integer default 1`, `touched_at timestamptz default now()`, PK, `check (id = 1)`, RLS y policies de `SELECT`/`UPDATE` para `anon`. No aparece en las migraciones ni en el código de la app.
- El trigger `auth.on_auth_users_insert`, que ejecuta `public.insert_user_in_public_table_for_each_new_user()` después de insertar en `auth.users`, existe remotamente pero no está en la cadena local. Sin recuperarlo, una base creada desde cero no reproduce el alta de perfiles.
- No hay otros triggers de aplicación en `auth` o `public`.

### 5. Riesgos encontrados que no deben ocultarse con una reparación de historial

- `super_admin_force_cancel_vacation` elimina filas de `vacation_grant_consumptions`, pero no incrementa `vacation_grants.days_remaining`. No existe un trigger que realice esa devolución. El comentario de la migración afirma que el saldo se restaura, pero el SQL no lo hace.
- Los defaults históricos conceden privilegios de tabla muy amplios a `anon` y `authenticated`. RLS evita accesos no autorizados hoy, pero el principio de mínimo privilegio no está aplicado. Por ejemplo, `user_permissions` concede privilegios de escritura a `authenticated`, aunque solo tiene una policy de lectura.
- Varias funciones `SECURITY INVOKER` conservan `EXECUTE` para `PUBLIC`/`anon`. RLS limita sus consultas, pero amplía innecesariamente la superficie del Data API.
- El baseline contiene políticas antiguas con `auth.role()` y grants heredados. Las correcciones posteriores protegen las rutas críticas, pero una fase de hardening debe revisar los objetos restantes.
- Tres archivos ya registrados (`20260730071532`, `20260730071549`, `20260730071657`) contienen comentarios locales que no estaban en el SQL registrado. La semántica coincide, pero desde ahora ningún archivo aplicado debe editarse.

## Fase 0 — Preparación y congelamiento

Objetivo: impedir que otra migración amplíe la divergencia durante la alineación.

1. Terminar o guardar de forma segura el trabajo no relacionado que actualmente está sin commit.
2. Crear una rama dedicada:

   ```bash
   git switch -c chore/align-supabase-migrations
   git status --short
   ```

3. Congelar cambios manuales desde Supabase Studio hasta completar la fase 5.
4. Confirmar que `DATABASE_URL` corresponde al proyecto real sin imprimirla:

   ```bash
   set -a
   source .env.local
   set +a
   npx supabase db query --db-url "$DATABASE_URL" \
     "select current_setting('server_version') as server_version, current_database() as database_name;"
   ```

Criterio de salida: rama limpia/dedicada, PostgreSQL mayor 15 y ventana de mantenimiento acordada.

## Fase 1 — Respaldo verificable

Objetivo: disponer de recuperación antes de tocar `schema_migrations`.

```bash
MIGRATION_AUDIT_DIR="$(mktemp -d)"

npx supabase db dump --db-url "$DATABASE_URL" \
  --schema public \
  --file "$MIGRATION_AUDIT_DIR/public-schema.sql"

npx supabase db dump --db-url "$DATABASE_URL" \
  --schema public \
  --data-only \
  --use-copy \
  --file "$MIGRATION_AUDIT_DIR/public-data.sql"

npx supabase db query --db-url "$DATABASE_URL" \
  "select version, name, statements, rollback from supabase_migrations.schema_migrations order by version;" \
  > "$MIGRATION_AUDIT_DIR/migration-history.json"
```

Los archivos del respaldo deben permanecer fuera del repositorio y almacenarse cifrados. Además, confirmar en Supabase Dashboard que existe un backup administrado utilizable.

Criterio de salida: dump de esquema, dump de datos, snapshot del historial y backup administrado confirmados.

## Fase 2 — Normalizar el repositorio sin tocar producción

Objetivo: hacer que los archivos locales adopten las versiones remotas válidas y que todas las versiones sean de 14 dígitos.

1. Renombrar con `git mv` los ocho archivos de la tabla de mapeos al timestamp remoto.
2. Renombrar con `git mv` las nueve versiones de 12 dígitos a sus versiones canónicas de 14 dígitos.
3. No cambiar el SQL de los archivos durante los renombres.
4. Añadir una comprobación CI para rechazar nombres que no cumplan:

   ```text
   ^[0-9]{14}_[a-z0-9_]+\.sql$
   ```

5. Documentar los hashes antes/después; un rename debe conservar el hash.

Criterio de salida: 24 archivos con versiones únicas de 14 dígitos y hashes de contenido conservados.

## Fase 3 — Recuperar los objetos no versionados

Objetivo: lograr que una base nueva pueda reproducir también los dos objetos que hoy solo existen remotamente.

1. Crear el archivo mediante la CLI, sin inventar el timestamp:

   ```bash
   npx supabase migration new recover_untracked_remote_objects
   ```

2. Incorporar en esa migración, de forma idempotente:

   - La definición actual de `public.keepalive_pings`.
   - Su PK, constraint, RLS y policies actuales.
   - El trigger `auth.on_auth_users_insert` que llama a la función pública ya creada por el baseline.
   - Los grants explícitos que reflejen exactamente el estado remoto actual.

3. No decidir todavía si `keepalive_pings` debe eliminarse. Primero se recupera el estado real; su eliminación requerirá confirmar qué monitor externo lo usa.
4. Ejecutar la cadena completa en Supabase local:

   ```bash
   npx supabase start
   npx supabase db reset --local --no-seed
   npx supabase migration list --local
   npx supabase db lint --local --schema public --level warning --fail-on error
   ```

5. Probar que insertar un usuario de prueba en Auth crea exactamente un perfil en `public.users` y que un segundo intento no duplica el perfil.

Criterio de salida: reset local desde cero exitoso, trigger probado y lint sin errores.

## Fase 4 — Reparar exclusivamente el historial remoto

Objetivo: hacer coincidir `schema_migrations` con los archivos canónicos sin ejecutar DDL ya presente.

Esta fase modifica únicamente el historial y debe realizarse en una ventana corta, después de completar las fases 0–3.

1. Volver a listar y guardar el estado inmediatamente antes de reparar:

   ```bash
   npx supabase migration list --db-url "$DATABASE_URL"
   ```

2. Marcar como revertidas solamente las ocho versiones antiguas de 12 dígitos:

   ```bash
   npx supabase migration repair --db-url "$DATABASE_URL" --status reverted \
     202603240001 202603240002 202603240003 202603250001 \
     202603260001 202603260002 202603260003 202603260004
   ```

3. Marcar como aplicadas sus ocho versiones canónicas y los cinco archivos cuyos efectos ya fueron verificados. Incluir también el timestamp creado en la fase 3:

   ```bash
   npx supabase migration repair --db-url "$DATABASE_URL" --status applied \
     20260323000000 \
     20260324000100 20260324000200 20260324000300 \
     20260325000100 \
     20260326000100 20260326000200 20260326000300 20260326000400 \
     20260326000500 \
     20260810000000 20260810010000 \
     20260902055224 \
     TIMESTAMP_DE_RECOVER_UNTRACKED_REMOTE_OBJECTS
   ```

4. No marcar como `reverted` las ocho versiones remotas de julio/agosto que la CLI sugirió en el dry-run. Los archivos locales habrán adoptado esos timestamps en la fase 2.

5. Verificar inmediatamente:

   ```bash
   npx supabase migration list --db-url "$DATABASE_URL"
   npx supabase db push --db-url "$DATABASE_URL" --dry-run
   ```

Criterio de salida: cada fila del listado tiene la misma versión en `LOCAL` y `REMOTE`; el dry-run informa que no hay migraciones pendientes.

Reversión de esta fase: usar el snapshot de `migration-history.json` para invertir solo los cambios de estado con `migration repair`. No restaurar el dump de datos, porque esta fase no altera datos ni objetos.

## Fase 5 — Prueba de paridad y regresión

Objetivo: demostrar que el historial alineado reconstruye el estado esperado y no solo produce una lista bonita.

1. Reconstrucción local desde cero:

   ```bash
   npx supabase db reset --local --no-seed
   ```

2. Comparación de esquema `public` entre migraciones y producción:

   ```bash
   npx supabase db diff \
     --from migrations \
     --to "$DATABASE_URL" \
     --schema public \
     --use-pg-schema
   ```

   La salida esperada es vacía. El trigger en `auth` se valida con una consulta dirigida para evitar comparar todos los objetos administrados internamente por Supabase Auth.

3. Validaciones dirigidas:

   - 12 tablas esperadas, todas con RLS habilitado.
   - 23 funciones públicas esperadas.
   - `search_path=public` en todas las funciones existentes.
   - Ninguna RPC `SECURITY DEFINER` ejecutable por `PUBLIC` o `anon`.
   - Constraints e índices de grants e invitaciones presentes.
   - Policies finales de vacaciones, compensatorios, permisos e invitaciones equivalentes.
   - Trigger `auth.on_auth_users_insert` presente.

4. Pruebas de aplicación:

   ```bash
   pnpm test
   pnpm build
   pnpm test:e2e -- e2e/scenarios/smoke-test.spec.ts
   ```

5. Pruebas específicas de datos en una base de prueba:

   - Crear/invitar usuario y comprobar perfil público.
   - Aprobar vacaciones usando grants.
   - Cancelar solicitudes propias pendientes.
   - Verificar acceso de admin y permiso de lectura de compensatorios.
   - Confirmar estado de invitación pendiente/aceptada.

Criterio de salida: diff vacío, dry-run vacío, reset reproducible y pruebas verdes.

## Fase 6 — Correcciones posteriores en migraciones nuevas

Objetivo: corregir los riesgos descubiertos sin reescribir historia aplicada.

Estas correcciones deben ser archivos nuevos y cada una debe probarse localmente antes de `db push`:

1. Corregir `super_admin_force_cancel_vacation` para bloquear los grants consumidos, sumar `days_used` a cada `vacation_grants.days_remaining` sin superar `days_granted`, eliminar los consumos y cancelar la solicitud dentro de la misma transacción.
2. Aplicar mínimo privilegio a tablas, empezando por `user_permissions` y `dev_email_outbox`; revocar privilegios que las policies no necesitan y conceder explícitamente solo los requeridos.
3. Revisar y restringir `EXECUTE` de las funciones públicas que no son parte de la API de la app.
4. Sustituir las policies restantes basadas en `auth.role()` por policies con `TO service_role` o el patrón apropiado.
5. Confirmar el consumidor de `keepalive_pings`: conservarlo con grants mínimos o eliminarlo con una migración aprobada.
6. Ejecutar Security/Performance Advisors y guardar la evidencia antes/después.

Criterio de salida: pruebas del saldo de vacaciones, matriz de permisos verificada y advisors sin hallazgos críticos nuevos.

## Fase 7 — Prevención permanente en CI

1. Prohibir edición de migraciones ya presentes en la rama principal; solo permitir archivos nuevos o renombres aprobados por esta alineación.
2. Validar nombres de 14 dígitos y versiones únicas.
3. En CI, iniciar Supabase local, ejecutar `db reset`, `db lint`, unit tests y smoke E2E.
4. Antes de desplegar a producción, ejecutar `db push --dry-run` y revisar manualmente la lista.
5. Aplicar cambios de producción solo con `db push`; no usar SQL directo para cambios definitivos.
6. Si se usa SQL directo para investigar, generar después una migración limpia y verificar el historial antes de cerrar la tarea.

## Orden recomendado de commits

1. `chore: normalize supabase migration versions`
2. `fix: recover untracked supabase schema objects`
3. `test: verify reproducible supabase migrations`
4. Reparación remota del historial y evidencia adjunta al PR/deploy.
5. `fix: restore vacation grant balance on force cancel`
6. `security: tighten database privileges`

## Condición final de alineación

La tarea se considera terminada únicamente cuando se cumplen simultáneamente estas condiciones:

- `supabase migration list` no muestra filas solo locales ni solo remotas.
- `supabase db push --dry-run` no propone aplicar ni revertir nada.
- Una base local vacía se reconstruye usando solo el repositorio.
- El diff de `public` entre migraciones y producción está vacío.
- El trigger de Auth y los objetos no públicos requeridos se validan por separado.
- Las pruebas unitarias, build y smoke E2E pasan.
- El historial anterior a la reparación y los respaldos están disponibles fuera de Git.
