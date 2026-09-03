# Plan por fases: grants de vacaciones conformes a la normativa japonesa

## Objetivo

Convertir el motor de `vacation_grants` en la fuente verificable de los días de
vacaciones de personal administrativo activo, aplicando las reglas japonesas de
antigüedad, jornada y asistencia sin alterar saldos existentes sin una
reconciliación aprobada.

> Este plan implementa la política laboral que la Embajada defina. La
> interpretación definitiva de la legislación y de los contratos debe ser
> confirmada por asesoría laboral competente antes de la fase de producción.

## Fase 0 — Política laboral aprobada

Definir por escrito, antes de automatizar:

- Alcance: administrativos activos; diplomáticos quedan fuera salvo decisión
  explícita.
- Regla estándar y proporcional según los días/horas de jornada.
- Método para medir el 80% de asistencia y ausencias que computan como
  asistencia.
- Fecha exacta de otorgamiento y tratamiento de fines de semana/feriados.
- Vigencia de dos años, tratamiento de fracciones y obligación anual de cinco
  días cuando corresponda.
- Excepciones: contratos especiales, fecha de ingreso corregida y grants
  manuales.

**Salida:** completada el 2026-09-03. Política confirmada por Administración.

## Fase 1 — Auditoría de datos, sin escrituras

Construir un reporte de cada administrativo activo con:

- Fecha de ingreso, condición diplomática, estado activo y modalidad de grant.
- Jornada semanal, asistencia disponible y elegibilidad.
- Hitos legales que ya vencieron.
- Grants existentes, saldo legacy y diferencia entre ambos sistemas.

Clasificar cada persona como `lista`, `requiere datos`, `requiere reconciliación`
o `excepción manual`.

**Salida:** ningún usuario automático carece de fecha de ingreso o jornada;
las excepciones quedan asignadas a modalidad manual.

**Resultado de auditoría y completitud de datos (2026-09-03):** 7
administrativos activos revisados. Se registró la jornada estándar de cinco
días y 40 horas semanales, confirmada por Administración, para
`noyanagi@embperujapan.org`, `auemise@embperujapan.org`,
`rmasujima@embperujapan.org` y `llopez@embperujapan.org`; la escritura se
verificó después de aplicarse. La cuenta temporal `review-temp@…` queda fuera
del proceso automático y no fue modificada. `cmurillo@embperujapan.org`
requiere reconciliación histórica controlada antes de cualquier emisión. La
siguiente acción es iniciar la Fase 2, sin habilitar aún emisiones automáticas.

## Fase 2 — Reconciliación histórica controlada

Para cada persona elegible:

1. Confirmar saldo y grants históricos reales.
2. Registrar un grant de corte manual, con fecha, saldo, fuente y nota
   administrativa auditables, cuando el historial anterior no pueda
   reconstruirse de forma fiable.
3. Registrar los grants legales faltantes solo tras aprobación administrativa.
4. Comparar el saldo resultante con el saldo actualmente reconocido.

No se descontarán ni sumarán días por inferencia automática durante esta fase.

**Salida:** cada usuario tiene una fuente de saldo explicable; las diferencias
son cero o poseen una excepción aprobada.

**Caso conciliado — `cmurillo@embperujapan.org` (2026-09-03):**
fecha de ingreso `2007-12-14`, jornada estándar y modalidad automática. Tiene
un grant manual de corte de 25 días, fechado el `2026-04-01`, del que quedan 15
días tras diez días de consumo auditado, y un grant estándar de 20 días
otorgado correctamente el `2026-06-14`; el saldo trazable vigente es por tanto
35 días. El campo legacy conserva 25 días y no debe usarse para sustituir el
saldo de grants. No se crearán los 18 hitos históricos omitidos: la mayoría
habría vencido y el corte manual ya representa el saldo heredado. Administración
confirmó que el saldo vigente es de 35 días; el saldo inicial de corte y el
grant del 14 de junio son la fuente de verdad, sin modificar días.

**Casos pendientes de conciliación individual (2026-09-03):**

| Persona | Hecho verificable | Tratamiento seguro |
| --- | --- | --- |
| `rmasujima@embperujapan.org` | Tenía 10 días de corte, sin consumo; su primer hito legal fue el `2026-03-16`. | **Completado:** grant alineado al `2026-03-16`, expira el `2028-03-16`; conserva 10 días. |
| `auemise@embperujapan.org` | Tiene 22 días trazables en un grant de corte que expira el `2026-10-01`; el saldo agrupa períodos históricos con expiraciones potencialmente distintas. | Saldo vigente confirmado por Administración: **22 días**. Conservarlos hasta contrastar la asignación de sus períodos; no adelantar vencimientos ni crear grants por inferencia. |
| `noyanagi@embperujapan.org` | Tiene 9 días de corte, pero hay 9 días de vacaciones aprobadas y dos hitos legales previos (`2024-10-01`, `2025-10-01`) sin consumo trazado en grants. | Saldo vigente confirmado por Administración: **9 días**. Mantenerlo; documentar el consumo histórico antes de desagregar o emitir días. |
| `llopez@embperujapan.org` | No tiene grants ni saldo legacy; registra 11 días aprobados. Sus hitos legales son 10 días (`2025-01-01`) y 11 días (`2026-01-01`). | Saldo vigente confirmado por Administración: **0 días**. Mantenerlo; no crear historial de grants ni añadir días sin evidencia de la fuente de consumo. |

Ninguna de estas conciliaciones debe aumentar o reducir días sin una fuente
administrativa aprobada. La corrección de fecha de Risa es el único ajuste que
preserva íntegramente el saldo y no exige inferir consumos.

**Protección operativa (2026-09-03):** para impedir que el cron emita hitos
históricos incompletos, `auemise@embperujapan.org`,
`noyanagi@embperujapan.org` y `llopez@embperujapan.org` fueron pasadas a
`grant_mode = manual`. Sus saldos y grants no se modificaron. César permanece
en automático y Risa conserva el comportamiento automático por defecto. Los
tres perfiles manuales solo volverán a automático después de una conciliación
histórica aprobada.

## Fase 3 — Integridad, seguridad y trazabilidad de base de datos

Agregar mediante migraciones revisadas:

- Restricción única para impedir duplicados del mismo hito legal por usuario.
- Operación atómica e idempotente para emitir grants; el cron y un admin no
  pueden duplicarlos en paralelo.
- Auditoría de creación, edición, cancelación y ajuste manual.
- Políticas RLS que permitan a cada usuario consultar solo sus grants y
  consumos; administración conserva permisos explícitos.
- Validación de que una edición no deja `days_remaining` fuera de los límites
  ni invalida consumos existentes.

**Pruebas:** concurrencia, duplicados, RLS, reintentos y reversión de
vacaciones aprobadas.

**Salida:** las restricciones viven en la base de datos, no únicamente en la
interfaz o en acciones de servidor.

**Avance (2026-09-03):** creada localmente la migración
`20260903012645_prevent_duplicate_legal_vacation_grants`. Añade un índice único
parcial para `standard` y `proportional` por usuario, fecha y tramo legal; los
grants manuales de conciliación no quedan bloqueados. La migración se aplicó en
la base local y una inserción duplicada transaccional fue rechazada con `23505`
y revertida. La acción administrativa ahora traduce ese conflicto en un mensaje
claro. Suite completa y compilación aprobadas; los asesores de Supabase no
reportaron hallazgos de seguridad. La migración fue aplicada y verificada en
producción el 2026-09-03. Las advertencias de rendimiento de RLS ya existentes
se tratarán separadamente, pues no cambian permisos ni bloquean esta migración.

## Fase 4 — Asistencia y elegibilidad del 80%

Implementar el cálculo por cada período legal de evaluación:

- Días programados, asistidos y ausencias con su clasificación.
- Resultado reproducible de la tasa de asistencia y evidencia de los datos.
- Cola de revisión para casos incompletos; `null` no debe habilitar emisión
  automática.
- Posibilidad de excepción manual, con motivo, aprobador y vigencia.

Hasta completar esta fase, los grants automáticos se limitan a la política
transitoria aprobada y se marcan como tales.

**Salida:** todo grant automático muestra el período y resultado de
asistencia que lo habilitó.

## Fase 5 — Emisión automática puntual

Sustituir la emisión quincenal por una tarea diaria idempotente:

- Emite el grant en su fecha legal o en la primera ejecución posterior.
- Procesa todos los hitos pendientes en orden; no salta años históricos.
- Respeta usuarios manuales, inactivos, diplomáticos y no elegibles.
- Registra resultado por usuario: emitido, omitido, bloqueado o error.
- Notifica a Administración y al usuario cuando corresponda.

**Pruebas:** aniversario de 6 meses, aniversarios anuales, años bisiestos,
fin de mes, reintentos, ejecución duplicada y empleados con varios hitos
pendientes.

**Salida:** una ejecución repetida no modifica saldos ni crea filas nuevas.

## Fase 6 — Consumo y retiro del saldo legacy

Después de reconciliar a todos los usuarios:

- Usar solo grants activos para aprobar vacaciones.
- Mantener el saldo legacy en modo lectura durante un período de verificación.
- Retirar el fallback de `num_vacations` únicamente por grupo de usuarios ya
  conciliado y aprobado.
- Verificar que cancelar una vacación devuelve exactamente el consumo a los
  grants originales.

**Salida:** cada día aprobado queda vinculado a uno o más consumos de grant;
no hay aprobación que reduzca saldo legacy para usuarios migrados.

## Fase 7 — Seguimiento continuo de cumplimiento

Añadir al dashboard administrativo:

- Próximo grant, expiraciones próximas y saldos por vencer.
- Riesgo de no tomar cinco días dentro del año aplicable.
- Grants bloqueados por asistencia o datos incompletos.
- Exportable de auditoría por usuario y período.

**Salida:** Administración recibe alertas antes de los vencimientos y puede
demostrar el historial de otorgamiento y consumo.

## Despliegue seguro

Cada fase sigue el mismo ciclo:

1. Pruebas unitarias y de integración locales.
2. Revisión de migración, RLS y plan de reversión.
3. Backup verificado de producción.
4. Despliegue pequeño o por usuarios piloto.
5. Verificación de datos y monitoreo antes de pasar a la siguiente fase.

La siguiente acción recomendada es iniciar la **Fase 2** con la conciliación
histórica controlada de los saldos y grants existentes.
