# Asignación automática por aniversario

## Funcionamiento

- `/api/cron/vacation-grants` se programa a diario a las 01:00 UTC
  (10:00 en Tokio). La comparación de fechas usa `Asia/Tokyo`.
- El primer aniversario corresponde al ingreso más seis meses. Los siguientes
  se calculan desde el ingreso original, sumando doce meses por período para
  conservar el día correcto en fines de mes y años bisiestos.
- Los días se calculan con las tablas estándar o proporcionales existentes,
  según antigüedad y jornada. Cada nueva bolsa vence dos años después de su
  fecha de otorgamiento, incluso si se registra con retraso.
- Los grants existentes no se editan: se conservan sus consumos, saldos y
  vencimientos conciliados. No se calcula el vencimiento desde el día en que
  se ejecuta el cron ni desde un corte manual.
- Se recuperan aniversarios pendientes en orden después del último grant legal.
  Si la recuperación exige inferir derechos que ya vencieron, el usuario queda
  bloqueado para conciliación, sin emitir una bolsa parcial.
- Sin grant legal previo, un corte manual o saldo legacy positivo requiere
  conciliación. Los perfiles nuevos sin saldo previo pueden recibir su primer
  grant. Los perfiles manuales, inactivos y diplomáticos quedan excluidos.
- Se conserva la política transitoria de asistencia ya aprobada: `false`
  bloquea y `null` usa esa política. La nota del grant distingue la asistencia
  confirmada de la revisión pendiente; no afirma que se haya medido el 80%.

## Integridad y errores

El cron valida `CRON_SECRET` antes de crear el cliente privilegiado. Lee todas
las páginas de usuarios e historial antes de escribir; una lectura fallida
devuelve HTTP 500. La respuesta contiene contadores y motivos agregados,
sin nombres, correos ni errores internos de base de datos.

La protección concurrente utiliza el índice único existente de la migración
`20260903012645_prevent_duplicate_legal_vacation_grants`. Un conflicto `23505`
se cuenta como duplicado. Otros errores de escritura detienen la secuencia
del usuario y producen HTTP 500; una ejecución posterior retoma desde el
último otorgamiento registrado. Nunca se usa un upsert que pueda reponer
días ya consumidos.

## Verificación sin escrituras

El mismo endpoint admite `?dryRun=true`, con idéntica autorización. Informa
`wouldIssue`, `skipped`, `blocked` y `reasons`; no inserta ni actualiza filas.
No ejecutar una solicitud normal como comprobación: la llamada normal emite
los grants pendientes.

Las pruebas unitarias usan un cliente simulado y cubren fechas de Tokio,
aniversarios, vigencia, tablas de días, duplicados, reintentos, paginación,
errores, exclusiones y conciliaciones. No necesitan modificar Supabase.

## Activación

La nueva frecuencia requiere desplegar este cambio en Vercel. Comprobar que
`CRON_SECRET` está configurado en producción y verificar primero el dry run.
No hay nueva migración ni variables de entorno.

La habilitación individual se controla con `users.grant_mode`. Antes de pasar
un perfil de manual a automático, confirmar el corte histórico y al menos
el grant legal vigente. Respaldar el entorno según `AGENTS.md`; conservar
la evidencia de cualquier excepción de cobertura expresamente autorizada.

Los saldos históricos de Uemise y Oyanagi fueron conciliados por Administración
en esta sesión. Sus fechas de vencimiento históricas se conservan como datos
aprobados y no deben deducirse de las fechas de creación de sus cortes manuales.
