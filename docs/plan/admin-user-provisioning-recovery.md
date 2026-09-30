# Plan: recuperación de altas de usuarios e invitaciones

## Avance de implementación (30 de septiembre de 2026)

- **Fase 6, correo propio de invitación (publicada).** El commit `c1fffdf` publicó la vista previa de React Email enviada al correo del administrador mediante `send-email`; la app confirmó el envío, pero no se verificó el buzón. Los commits `2a6fd34` y `e30420d` publicaron el flujo real: genera el enlace de Supabase Auth con `generateLink({ type: "invite" })` para la cuenta ya creada y lo envía mediante la misma Function. Una prueba con Supabase local confirmó que el enlace reutiliza el ID de Auth y redirige a `/auth/complete-invite`. Como `generateLink` establece `auth.users.invited_at` antes de entregar el correo, las invitaciones nuevas usan `public.users.invitation_sent_at` como constancia de envío. Si falla la generación, no se intenta la entrega; si falla la Function, el perfil sigue pendiente y la interfaz advierte que el resultado del correo es incierto. Pasaron 219 pruebas unitarias, `pnpm build` y la prueba integrada local. Vercel marcó el despliegue de `e30420d` como correcto; `/login` y `/auth/complete-invite` respondieron HTTP 200 y `/admin/users` sin sesión redirigió a `/login`. Falta verificar una invitación real desde la interfaz en producción y su recepción en el buzón. Los mensajes de Auth ajenos a este flujo siguen sujetos a la configuración SMTP de Supabase.
- **Prueba integrada aislada de la fase 6.** `pnpm test:invitation:local` obtiene las credenciales del proyecto Supabase local y exige una URL de loopback. Crea una cuenta temporal, simula una falla del transporte sin enviar correo, verifica que el perfil sigue pendiente e inactivo, envejece la reserva de envío, reanuda por el mismo ID y comprueba el único HTML renderizado, el perfil `ready` y la redirección real del enlace a `/auth/complete-invite`; al final elimina la cuenta temporal. Esta prueba pasó el 30 de septiembre de 2026. La app iniciada con `scripts/dev-local-emb.sh` y los dos smoke tests sin sesión también pasaron. La app normal en `localhost:3000`, cuando se inicia con `.env.local`, puede apuntar a Supabase remoto: para pruebas aisladas debe arrancarse con ese script. La entrega real por Microsoft 365 y el alta por interfaz siguen pendientes de verificación.
- **Fases 1 y 2 implementadas en local.** La acción distingue `created`, `incomplete` y `failed`; las cuentas nuevas empiezan con perfil `pending` e inactivo. La migración añade una política restrictiva para impedir que un usuario provisional lea o modifique datos protegidos y bloquea los cambios de rol privilegiado hechos por un admin común mediante la API de datos.
- **Fases 3 y 4 implementadas en local.** Auth crea la cuenta sin mandar la invitación; el perfil se guarda antes de llamar a `inviteUserByEmail`. Una reserva atómica evita envíos simultáneos y los reintentos se hacen por `userId`, sin crear otra cuenta. La interfaz muestra las cuentas pendientes y ofrece completar el alta. Si la entrega es incierta, el resultado indica que el correo pudo haberse enviado. El enlace usa `/auth/complete-invite` y llega a la bienvenida.
- **Fase 5, verificación y despliegue.** La prueba de aceptación con Supabase local confirmó la creación provisional, el enlace permitido, la sesión, `/welcome` y el perfil `ready` con invitación aceptada. También pasaron las pruebas locales de RLS, rol privilegiado, compatibilidad de `is_active = NULL` y reserva concurrente. Pasaron `pnpm test --run` (203 tests), `pnpm build` y el smoke E2E sin sesión (2 tests). `pnpm exec tsc --noEmit` conserva siete errores previos en tres archivos de tests; el setup E2E autenticado requiere credenciales válidas del entorno local. Las seis migraciones y el código se desplegaron el 30 de septiembre de 2026; queda observar las primeras altas reales.

**Condiciones de producción, cumplidas:** se aplicaron primero las migraciones, se configuró `NEXT_PUBLIC_APP_URL=https://emb-app.vercel.app` para producción en Vercel y se añadió `https://emb-app.vercel.app/auth/complete-invite` a las URL permitidas de Supabase Auth. Se actualizó la versión de Node de Vercel a 24 antes de publicar el commit `11f4caa`. La configuración local de `supabase/config.toml` no modifica la del proyecto remoto. Si falta `NEXT_PUBLIC_APP_URL`, el alta por invitación falla antes de crear la cuenta.

**Verificación remota:** Vercel marcó la publicación como `Ready`; `/login` y `/auth/complete-invite` devolvieron HTTP 200 y `/admin/users` sin sesión redirigió a `/login`. El historial remoto contiene las seis migraciones y la tabla `public.users` conservó 19 perfiles. Una consulta de solo lectura con rol `authenticated` confirmó que un usuario activo puede leer su propio perfil y un UUID sin cuenta no puede leer datos. No se enviaron invitaciones de prueba desde producción.

**Respaldo remoto previo (30 de septiembre de 2026):** `backups/remote-predeploy-2026-09-30T07-46-41-797Z.dump` contiene el volcado PostgreSQL de esquemas y datos; `backups/remote-predeploy-2026-09-30T07-46-41-797Z-roles.sql` contiene definiciones de roles sin sus contraseñas. `backups/remote-predeploy-2026-09-30T07-46-41-797Z.sha256` guarda los checksums. Se verificó la lectura completa del archivo con `pg_restore`, la presencia de los esquemas Auth, public, Storage, Realtime y migraciones, y la cobertura de todas las tablas remotas con datos (la única sin entrada de datos, `realtime.messages`, tenía cero filas). Los tres archivos son locales, tienen permisos restringidos y están excluidos de Git. El volcado de la base contiene metadatos de Storage, no los bytes de sus objetos externos.

## Objetivo y estado actual

Al crear un usuario desde `/admin/users`, `createAdminUser` llama primero a Supabase Auth (`inviteUserByEmail` o `createUser`) y después hace `upsert` del perfil en `public.users`. El trigger `on_auth_users_insert` ya inserta una fila mínima con `id` y `email`. Si falla el `upsert`, la acción devuelve un error, pero la cuenta existe y, en modo invitación, Supabase puede haber enviado el correo. Reintentar el formulario como un alta nueva puede fallar por email duplicado o enviar otra invitación.

La fila mínima tiene `is_active = NULL`; los guardas actuales interpretan `NULL` como activo. Por eso no basta con mostrar un error: también hay que impedir que una cuenta incompleta acceda a la app. El trabajo debe cubrir las dos modalidades (`invite` y `temporary_password`), respetar la regla de que solo un superadmin concede el rol `admin` y no borrar cuentas existentes mediante una compensación basada solo en el email.

## Decisión técnica previa

Preferencia: preparar una cuenta sin enviar el correo, completar y verificar su perfil, y enviar la invitación al final. Antes de elegir la implementación, comprobar **en Supabase local** que el SDK y la configuración actuales permiten crear la cuenta sin correo y generar/entregar una invitación válida para esa cuenta. `inviteUserByEmail` envía el correo durante la llamada; `generateLink({ type: 'invite' })` genera un enlace para entrega propia, pero su compatibilidad con una cuenta previamente creada debe probarse aquí, no suponerse. No cambiar el proveedor ni el contenido del correo hasta verificar el contrato y el enlace de bienvenida.

Si esa secuencia no funciona con Supabase local, mantener `inviteUserByEmail` y aplicar recuperación explícita: registrar el ID devuelto por Auth, marcar la operación como incompleta, bloquear la cuenta y ofrecer una reparación idempotente del perfil **sin volver a invitar**. En ese caso, el error debe decir que el correo pudo haberse enviado. No hacer `deleteUser` automático después de enviar un correo: el mensaje no se puede retirar y la cuenta podría haber aceptado la invitación.

## Ciclo de trabajo

En cada fase: escribir primero el test que expresa la conducta deseada y observar que falla (**rojo**); hacer el cambio mínimo para que pase (**verde**); refactorizar sin cambiar la conducta; ejecutar el test de la fase y los tests del flujo anteriores. No avanzar con un fallo sin explicar. Las pruebas unitarias simulan Auth, perfil y entrega de correo; los E2E usan Supabase local y el buzón de pruebas, nunca destinatarios reales.

### Fase 1 — Caracterizar el fallo y fijar el contrato

1. Añadir tests en `test/unit/actions/admin-create-user.test.ts` para: error de Auth; Auth exitoso con error de perfil; Auth exitoso sin ID; error/timeout después de un `upsert` cuyo resultado es desconocido; reintento con la misma dirección; y ambas modalidades de alta. No modificar aún la producción para hacerlos pasar.
2. Definir un resultado estructurado de la acción: `created`, `incomplete` o `failed`, con `userId` solo cuando Auth lo haya confirmado. La UI debe diferenciar “no se creó la cuenta” de “cuenta creada, perfil pendiente”. Los errores internos no deben exponer credenciales ni detalles sensibles.
3. Test de aceptación: una segunda petición con el mismo email no crea una segunda cuenta ni declara éxito sin un perfil completo. Mantener las pruebas actuales de autorización para `role: 'admin'`.

**Salida:** tests rojos reproducibles y contrato de estados revisado.

### Fase 2 — Bloquear cuentas incompletas desde la base de datos

1. Crear una migración nueva: el trigger de alta debe producir un perfil provisional inactivo (`is_active = false`) y un estado explícito de aprovisionamiento. Mantener el comportamiento de usuarios ya existentes mediante una migración aditiva; no reinterpretar sus `NULL` históricos ni cambiar datos reales sin una revisión específica.
2. El paso que completa el perfil debe poner el estado `ready` e `is_active = true` únicamente después de guardar todos los campos y autorizar el rol. Hacerlo en una operación de base de datos que no deje `ready` con campos a medias.
3. Escribir primero tests de base de datos con rol anónimo, usuario provisional, admin y superadmin: el provisional no accede a rutas/datos protegidos; una cuenta lista sí; un admin común no puede completar un perfil con rol privilegiado. Revisar RLS y acceso directo a la API, no solo la acción de Next.js.

**Salida:** ninguna cuenta provisional puede usar la app. El reset local de Supabase y los tests de permisos pasan.

### Fase 3 — Preparar el perfil y enviar o habilitar al final

1. Ejecutar la prueba local de la secuencia de invitación elegida. Para la opción preferida, comprobar que el enlace recibido abre `/auth/callback?next=/welcome`, permite finalizar el acceso y no se envía antes de que el perfil esté listo.
2. Tests primero: perfil fallido implica cero correos; perfil correcto implica un correo; error de entrega implica cuenta identificable, estado pendiente y reenvío posible sin recrear Auth; petición repetida no duplica cuentas ni correos; contraseña temporal no envía invitación y no permite inicio de sesión antes de `ready`.
3. Implementar la menor secuencia necesaria. Si se usa entrega propia, conservar la plantilla de Auth o reproducir su enlace/redirect verificado; no incluir enlaces ni contraseñas en logs. Registrar `invitation_sent_at` solo tras confirmar la entrega. Si el proveedor devuelve un resultado ambiguo, mostrar “entrega por verificar”, no “no enviada”.

**Salida:** el correo solo se envía para perfiles listos, o la alternativa de recuperación explícita queda probada y visible.

### Fase 4 — Recuperación operativa e interfaz

1. Tests primero para listar una cuenta incompleta, reparar el perfil por `userId` y reintentar la entrega sin crear otra cuenta. La reparación vuelve a validar permisos y datos; el rol privilegiado exige superadmin también aquí.
2. Mostrar en `/admin/users` el estado real y una acción contextual: “Completar perfil” o “Reenviar invitación”. No mostrar éxito de alta cuando quedó incompleta. Conservar el formulario tras un error reparable.
3. Cubrir carreras: dos reintentos simultáneos, invitación aceptada antes de la reparación, y fallo entre guardar el perfil y registrar la entrega. Usar estado persistido y transiciones idempotentes; nunca borrar por coincidencia de email.

**Salida:** un admin puede identificar y completar el alta sin intervención manual en Auth.

### Fase 5 — Verificación y despliegue

1. Ejecutar tests enfocados después de cada fase; al final, `pnpm test --run`, `pnpm exec tsc --noEmit`, `pnpm build` y E2E del alta/invitación contra Supabase local. El chequeo de TypeScript ya tiene errores previos en tests de compensatorios y `admin-users`; separar esos fallos de las regresiones nuevas.
2. Probar en local los casos de error inyectado: fallo de Auth, fallo de perfil, fallo de correo, reintento y aceptación del enlace. Confirmar el estado en `auth.users` y `public.users` sin imprimir secretos ni enviar correo externo.
3. Desplegar primero la migración compatible, después el código. Revisar las cuentas incompletas creadas antes del cambio por ID y reparar solo con evidencia de que pertenecen al flujo de alta. Monitorear altas incompletas y errores de entrega; documentar la recuperación manual para una caída del servicio de correo o de Auth.

**Criterio de cierre:** ninguna alta informa éxito con perfil incompleto; ninguna cuenta provisional obtiene acceso; un fallo se puede reparar sin duplicar cuenta o correo; la invitación abre la bienvenida; los permisos de rol se mantienen en la acción y en la base de datos.

## Dependencia de seguridad

La política actual de `public.users` permite a admins activos actualizar columnas de rol directamente. La fase 2 debe incluir el cierre de ese permiso o coordinarse con la migración de seguridad correspondiente antes de afirmar que el alta de administradores está protegida de extremo a extremo.
