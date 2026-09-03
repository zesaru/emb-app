# Borrador de política operativa — grants de vacaciones

**Estado:** confirmado por Administración el 2026-09-03.

## Alcance

- Aplica al personal administrativo activo.
- El personal diplomático queda fuera del motor automático y se mantiene bajo
  administración manual, salvo una decisión posterior documentada.
- Un usuario inactivo no recibe nuevos grants automáticos.

## Regla de antigüedad y días otorgados

Para empleados con jornada estándar (cinco o más días semanales, o 30 o más
horas semanales), el sistema aplica estos hitos desde la fecha de ingreso:

| Antigüedad continua | Días |
| --- | ---: |
| 6 meses | 10 |
| 1 año 6 meses | 11 |
| 2 años 6 meses | 12 |
| 3 años 6 meses | 14 |
| 4 años 6 meses | 16 |
| 5 años 6 meses | 18 |
| 6 años 6 meses o más | 20 |

Para jornadas de hasta cuatro días semanales y menos de 30 horas semanales se
aplica la tabla proporcional japonesa según los días de trabajo contratados.

Fuente de referencia: [Ministerio de Salud, Trabajo y Bienestar de Japón](https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/faq/kijyunhou_6_00001.html).

## Fecha de otorgamiento

- El grant nace en el aniversario legal exacto derivado de `hire_date`.
- La tarea automática debe ejecutarse diariamente y registrar cualquier
  otorgamiento emitido después de esa fecha.
- Un grant manual no desplaza los futuros aniversarios legales.

## Asistencia — política transitoria confirmada

La ley exige al menos 80% de asistencia en el período aplicable. Como el
sistema todavía no calcula esa tasa, durante la transición:

- Hasta que se implemente el cálculo real, Administración confirma la
  presunción transitoria de que todos cumplen el requisito de asistencia.
- `attendance_eligible = false` sigue bloqueando la emisión cuando exista una
  exclusión expresa.
- `attendance_eligible = null` permite la emisión automática durante esta
  transición. Esta presunción debe eliminarse en la Fase 4, cuando haya datos
  de asistencia verificables.

## Vigencia, consumo y cancelación

- Cada grant expira dos años después de su otorgamiento, conforme a la política
  interna que se validará con asesoría laboral.
- Las vacaciones aprobadas consumen primero el grant que expira antes.
- Al cancelar una vacación aprobada, los días vuelven al mismo grant del que
  fueron consumidos.

## Excepciones manuales

Un grant manual se permite únicamente para:

- Corrección documentada de fecha de ingreso.
- Migración o conciliación de saldo histórico.
- Contrato o jornada excepcional.
- Decisión administrativa sustentada.

Debe guardar fecha, días, saldo, justificación, administrador responsable y
no debe alterar el aniversario legal automático salvo que la política laboral
lo autorice expresamente.

## Obligación de seguimiento

Cuando una persona recibe 10 o más días legales, Administración revisará el
uso anual mínimo aplicable y recibirá alertas antes del vencimiento. La
configuración exacta de esa alerta se implementará en la Fase 7.

## Decisiones pendientes de confirmación

1. Confirmado: los diplomáticos quedan excluidos del motor automático.
2. Confirmado: durante la transición se presume cumplimiento de asistencia,
   excepto cuando exista una exclusión explícita.
3. Confirmado: el grant se registra en la fecha legal exacta, incluso si cae
   en feriado o fin de semana.
4. Confirmado: los grants tienen vigencia de dos años y la primera versión usa
   únicamente días completos.
