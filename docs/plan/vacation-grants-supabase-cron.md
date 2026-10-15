# Migración de vacaciones a Supabase Cron

## Objetivo

Ejecutar las asignaciones diarias dentro de PostgreSQL, con fecha de Tokio,
sin llamadas HTTP ni claves del cron de Vercel para este proceso. Conservar
las bolsas y vencimientos conciliados de cada trabajador.

## Plan de ejecución

1. Inspeccionar producción en solo lectura: extensión `pg_cron`, permisos,
   esquema privado, historial de migraciones y tareas existentes.
2. Crear funciones privadas para aniversarios, tabla de días, planificación
   y emisión transaccional. Mantener simulación y registro de ejecuciones.
   Revocar acceso público y no exponer una RPC que permita emitir días a clientes.
3. Probar con datos ficticios la equivalencia con las reglas TypeScript,
   fechas de Tokio, duplicados, concurrencia, fallos, excepciones manuales y
   preservación de consumos y vencimientos. Las 12 comprobaciones PostgreSQL
   pasaron en un contenedor temporal nuevo con PostgreSQL 16; la fixture se
   revirtió al terminar.
4. Crear y verificar un respaldo actualizado del entorno de producción.
   Confirmar cobertura o una excepción expresa antes de modificar el esquema.
5. Aplicar la migración de funciones. Comparar una simulación SQL con el motor
   vigente y verificar que Uemise y Oyanagi no tengan asignaciones duplicadas.
6. Publicar la aplicación sin el endpoint escritor de Vercel y retirar
   únicamente esa entrada de `vercel.json`. Conservar los otros cron existentes.
7. Activar `vacation-grants-daily` a las `01:00 UTC` (`10:00 Asia/Tokyo`),
   comprobar su ejecución nativa y verificar que los saldos existentes
   permanezcan intactos.

## Reglas que deben conservarse

- Primer otorgamiento a los seis meses del ingreso; siguientes aniversarios
  derivados del ingreso original, sin desplazamiento por años bisiestos.
- Días estándar/proporcionales según la jornada y antigüedad vigentes.
- Dos años de vigencia desde cada otorgamiento, no desde su registro.
- No editar saldos, consumos, fechas ni vencimientos históricos.
- Respetar modalidad manual, inactivos, diplomáticos y asistencia negativa.
- Conservar la política transitoria aprobada para asistencia pendiente y
  registrarla explícitamente en las notas de las nuevas asignaciones.
- Bloquear cortes y huecos históricos que requieran conciliación.
- Repetir una ejecución no debe sumar nuevamente días.

## Reversión

Desactivar el job de Supabase antes de restaurar la programación en Vercel.
No borrar asignaciones emitidas, consumos ni auditorías como parte de la
reversión. Las funciones privadas pueden conservarse deshabilitadas.

## Estado

- Inspección inicial: producción `vgtqgwjjtbkqiwhbplqi`, PostgreSQL 15.8;
  `pg_cron` 1.6 disponible, aún sin habilitar; esquema `private` existente.
- Las migraciones aplicadas coinciden con el historial anterior a este cambio.
- Las 12 comprobaciones de `scripts/test-vacation-grants-postgres.mts` pasaron
  con PostgreSQL 16 y fixtures ficticias. Incluyen paridad con TypeScript,
  límites de fecha, reversión ante fallos, idempotencia, concurrencia y permisos.
- Producción `vgtqgwjjtbkqiwhbplqi`: respaldo verificado en
  `/private/tmp/emb-production-backup-PI6oTk`; las migraciones quedaron
  instaladas dentro de una transacción, con datos de negocio idénticos y
  simulación `wouldIssue: 0`. El job `vacation-grants-daily` existe todavía
  inactivo. La simulación identificó 1 perfil bloqueado por fecha incompleta;
  no se le asignan días.
- El respaldo cubre PostgreSQL/Auth, roles y dos objetos de Storage, pero no
  Edge Functions ni configuración del proyecto: la API administrativa devuelve
  403. Se registró la excepción específica para esta migración en el directorio
  privado del respaldo.
- Pendiente: publicar y comprobar el endpoint Vercel retirado, activar el job
  Supabase, verificar su primera ejecución y confirmar CI/despliegue.
