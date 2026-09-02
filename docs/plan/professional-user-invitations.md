# Plan por fases: invitaciones profesionales de usuarios

## Objetivo

Ofrecer una invitación institucional y clara para nuevos usuarios del Portal de Vacaciones y Compensatorios de **EMB**, sin usar logo. El usuario debe crear su contraseña mediante un enlace seguro, llegar a la aplicación correcta y saber dónde pedir ayuda.

## Alcance

- Nombre visible: **EMB — Portal de Vacaciones y Compensatorios**.
- Correo personalizado, sobrio e institucional, sin logotipo.
- Invitaciones y restablecimientos con enlaces que regresen a producción.
- No se modifica la lógica de vacaciones, compensatorios ni roles existentes.

## Fase 1 — Asegurar el enlace y la configuración

**Estado: implementada en código; pendiente validar Redirect URLs en Supabase.**

**Objetivo:** que toda invitación lleve al usuario a la aplicación correcta.

1. Configurar en Supabase el Site URL de producción: `https://emb-app.vercel.app`.
2. Agregar `redirectTo` explícito a `inviteUserByEmail`, apuntando a `/auth/callback`.
3. Verificar que `https://emb-app.vercel.app/auth/callback` esté incluido en las Redirect URLs autorizadas de Supabase.
4. Mantener la URL como variable de entorno (`NEXT_PUBLIC_APP_URL`) y documentarla en `.env.example`.

**Criterio de aceptación:** una invitación de prueba abre el callback de producción y permite definir la contraseña.

## Fase 2 — Plantilla institucional de correo

**Estado: plantilla preparada; pendiente pegarla en Supabase.**

**Objetivo:** sustituir el mensaje genérico por una comunicación de EMB.

Contenido propuesto:

- Asunto: `Invitación al Portal de Vacaciones y Compensatorios — EMB`.
- Saludo con el nombre del colaborador.
- Breve explicación: consultar saldo, solicitar vacaciones y gestionar compensatorios.
- Botón principal: **Crear mi contraseña**.
- Texto de seguridad: el enlace es personal, temporal y no se debe compartir.
- Pie: `EMB — Portal de Vacaciones y Compensatorios` y correo de soporte configurable.

La plantilla no incluirá logo; se utilizarán tipografía limpia, fondo blanco y un acento rojo institucional moderado.

**Criterio de aceptación:** el correo se ve correctamente en móvil y escritorio, y su enlace conserva el token de Supabase intacto.

**Entregable preparado:** [`docs/email-templates/invite-user-emb.html`](../email-templates/invite-user-emb.html). Copiarlo en Supabase Dashboard → Authentication → Email Templates → Invite user. No cambiar `{{ .ConfirmationURL }}`.

## Fase 3 — Envío controlado y trazabilidad

**Estado: implementada; pendiente aplicar la migración.**

**Objetivo:** evitar invitaciones duplicadas o perfiles incompletos.

1. Mostrar al administrador una confirmación antes de enviar la invitación.
2. Registrar en el perfil interno: fecha de invitación y estado (`pendiente`, `aceptada`, `reenviada`).
3. Bloquear o advertir si el correo ya existe en Auth.
4. Si falla la creación del perfil tras crear Auth, mostrar un error accionable para corregirlo sin volver a invitar por accidente.
5. Añadir acción “Reenviar invitación” para usuarios aún pendientes.

**Criterio de aceptación:** el administrador puede distinguir una cuenta activa de una invitación pendiente y reenviar solo cuando corresponde.

## Fase 4 — Experiencia de primera entrada

**Estado: implementada.**

**Objetivo:** que el usuario sepa qué hacer después de crear su contraseña.

1. Después de aceptar la invitación, mostrar una pantalla de bienvenida breve.
2. Explicar las tres acciones principales: revisar saldo, solicitar vacaciones y revisar compensatorios.
3. Incluir acceso directo al panel principal.
4. No solicitar datos laborales adicionales en esta pantalla; los administra EMB.

**Criterio de aceptación:** el primer ingreso termina en el panel con una ruta clara para comenzar.

## Fase 5 — Pruebas y activación

**Estado: pruebas locales completadas; pendiente prueba piloto con correo controlado.**

**Objetivo:** publicar con seguridad y sin correos accidentales.

1. Pruebas unitarias de creación, duplicados, `redirectTo` y reenvío.
2. Prueba end-to-end con una cuenta de prueba y un correo controlado.
3. Revisión manual en Gmail/Outlook y móvil.
4. Verificar configuración de URLs y remitente en Supabase/Resend antes de producción.
5. Activar primero con una invitación piloto aprobada por administración.

**Criterio de aceptación:** invitación recibida, contraseña creada, sesión iniciada y perfil interno visible correctamente.

## Decisiones pendientes

- Correo de soporte que aparecerá en el pie del mensaje.
- Remitente visible, por ejemplo `EMB Administración <no-reply@...>`.
- Duración deseada del enlace de invitación, dentro de los límites configurables de Supabase.
- Si la invitación debe enviarse automáticamente al crear cada usuario o solo tras una confirmación explícita.
