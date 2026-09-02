# Plan: filtros y reporte mensual de compensatorios

## Objetivo

Facilitar la revisión de compensatorios para Aumise y administradores cuando existen muchos registros, permitiendo filtrar por mes, rango de fechas y usuario, y generar un resumen mensual separado por usuario.

## Alcance funcional

### Filtros

Agregar en `/compensatorios`:

- Mes y año.
- Rango de fechas: desde/hasta.
- Usuario por nombre o correo.
- Estado: todos, aprobados o pendientes.
- Botón para limpiar filtros.

Los filtros deben poder combinarse. Si se selecciona un mes, el rango será el primer y último día de ese mes. El filtro por rango de fechas tendrá prioridad si se completan ambas opciones.

### Reporte mensual

Cuando se seleccione un mes, mostrar una vista de resumen agrupada por usuario con una fila por cada usuario:

| Usuario | Horas registradas | Horas aprobadas | Horas utilizadas | Saldo del mes |
|---|---:|---:|---:|---:|

El reporte debe mostrar también totales generales del mes y permitir volver a la lista detallada.

Las horas deben calcularse por usuario, no mezclarse entre empleados:

- `Horas registradas`: suma de `hours` del periodo.
- `Horas aprobadas`: suma de `hours` aprobadas del periodo.
- `Horas utilizadas`: suma de `compensated_hours` del periodo.
- `Saldo del mes`: horas aprobadas menos horas utilizadas.

Las filas sin nombre deben mostrar el correo del usuario como respaldo.

## Diseño técnico

1. Crear un componente de filtros reutilizable para el listado.
2. Mantener los filtros en parámetros de URL para que el reporte pueda compartirse o recargarse sin perder el estado:

```text
/compensatorios?month=2026-08&user=auemise&status=approved
```

3. Mover el filtrado principal al servidor para no cargar toda la tabla en el navegador.
4. Respetar el permiso `compensatorys.view_all`:
   - Aumise y administradores pueden filtrar todos los usuarios.
   - Usuarios normales solo pueden filtrar sus propios registros.
5. Crear una consulta o función de agregación mensual que agrupe por `user_id` y una los datos mínimos de `users`.
6. Añadir paginación o carga limitada para la lista detallada.
7. Mantener el enlace al detalle individual de cada usuario.

## Reglas de fechas

- Usar fechas de evento (`event_date`) para horas registradas.
- Usar `compensated_hours_day` para horas utilizadas cuando exista ese dato.
- Definir y documentar el tratamiento de registros con fecha nula.
- Mostrar el mes en la zona horaria operativa de Japón para evitar desplazamientos de fecha.

## Exportación opcional

Dejar preparado el diseño para añadir posteriormente:

- Exportación CSV del detalle filtrado.
- Exportación CSV o PDF del resumen mensual agrupado por usuario.

La exportación debe usar exactamente los mismos filtros visibles en pantalla.

## Seguridad

- No confiar en parámetros de URL para autorizar acceso a otros usuarios.
- Aplicar la autorización en la consulta del servidor y mantener las políticas RLS.
- El permiso `compensatorys.view_all` debe conceder lectura, no aprobación, cancelación ni edición.
- No exponer claves de servicio en componentes cliente.

## Criterios de aceptación

- Aumise puede seleccionar un mes y ver un resumen por usuario.
- El total de cada usuario coincide con sus registros detallados filtrados.
- Puede buscar un usuario por nombre o correo.
- Puede consultar un rango de fechas específico.
- Puede combinar mes, usuario y estado.
- Los usuarios normales nunca ven registros de otros empleados.
- El listado no pierde los filtros al recargar la página.
- La pantalla indica claramente el periodo consultado y el total general.
- Los meses sin registros muestran un estado vacío comprensible.

## Orden de implementación

1. Definir tipos y funciones de filtros/fechas.
2. Implementar filtros en servidor y parámetros de URL.
3. Implementar consulta agrupada mensual.
4. Crear la vista de resumen por usuario.
5. Añadir paginación y estados de carga/vacío.
6. Cubrir cálculos con pruebas unitarias.
7. Validar permisos con pruebas E2E para Aumise, admin y usuario normal.
