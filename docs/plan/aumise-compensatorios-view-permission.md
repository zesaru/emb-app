# Plan: permiso de consulta de compensatorios para Aumise

## Objetivo

Permitir que `aumise@embperujapan.org` consulte los compensatorios de todos los usuarios desde `/compensatorios`, sin convertirla en administradora y sin habilitar acciones administrativas.

## Situación actual

- `/compensatorios` muestra todos los registros únicamente cuando `isAdmin(user.id)` es verdadero.
- `isAdmin` depende de `users.admin = 'admin'`.
- La vista de detalle también usa la misma comprobación para permitir consultar el saldo de otra persona.
- Las acciones de aprobar, cancelar, modificar saldos, administrar usuarios, reportes y backups tienen controles administrativos independientes.

## Diseño propuesto

Crear una tabla de permisos explícitos, en lugar de reutilizar `users.admin` o `users.role`:

```sql
user_permissions (
  user_id uuid references public.users(id) on delete cascade,
  permission text not null,
  primary key (user_id, permission)
)
```

Permiso inicial:

```text
compensatorys.view_all
```

Agregar una migración idempotente que asigne únicamente ese permiso al usuario cuyo email sea `aumise@embperujapan.org`. No debe modificar `admin`, `role` ni `is_active`.

## Cambios de aplicación

1. Crear un helper de servidor `canViewAllCompensatorys(userId)` que compruebe la tabla de permisos.
2. Cambiar la página `/compensatorios` para usar ese permiso y filtrar los registros en el servidor:
   - usuarios normales: solo sus propios registros;
   - Aumise: todos los registros, únicamente en modo lectura.
3. Cambiar la ruta `/compensatorios/[id]` para permitirle consultar el detalle de cualquier usuario.
4. Mantener las acciones de aprobación, cancelación y actualización protegidas por `requireCurrentUserAdmin`; el permiso nuevo no debe satisfacer ninguna de esas comprobaciones.
5. Revisar los botones y enlaces de la tabla para que Aumise no vea controles de escritura.

## RLS y seguridad

- Añadir RLS para que la lectura detallada dependa de `auth.uid()` o de la existencia del permiso `compensatorys.view_all`.
- Usar `security definer` solo en una función ubicada fuera del esquema expuesto, o encapsular la comprobación de forma que no genere recursión de RLS sobre `users`.
- No usar `user_metadata` ni claims editables del JWT para autorización.
- Revisar el calendario: si necesita mostrar eventos resumidos de todo el equipo, conservar un RPC o vista de solo los campos necesarios, sin abrir todos los campos sensibles de `compensatorys`.
- Aplicar la misma regla a la relación `user1:users` para no filtrar información innecesaria.

## Verificación

- Usuario normal: ve únicamente sus compensatorios.
- Aumise: ve los compensatorios de todos, puede abrir detalles, pero no puede aprobar, cancelar ni editar.
- Admin actual: conserva el comportamiento existente.
- Super admin: conserva sus capacidades actuales.
- Usuario no autenticado: continúa siendo redirigido a `/login`.
- Ejecutar pruebas unitarias y una prueba E2E con los tres perfiles.
- Validar en Supabase que la fila de permiso existe y que las políticas RLS permiten exactamente los casos anteriores.

## Estado de implementación

- [x] Crear tabla y permiso explícito `compensatorys.view_all`.
- [x] Asignar el permiso únicamente a `aumise@embperujapan.org` mediante migración idempotente.
- [x] Ajustar listado y detalle de compensatorios.
- [x] Mantener las acciones de escritura bajo controles administrativos existentes.
- [x] Mantener el calendario mediante una proyección de solo lectura en servidor.
- [x] Ejecutar pruebas unitarias y compilación de producción.
- [ ] Aplicar la migración en Supabase y validar con la cuenta real de Aumise.

## Orden de implementación

1. Crear tabla, políticas y helper de permiso.
2. Asignar el permiso a Aumise mediante migración idempotente.
3. Ajustar las páginas y consultas de compensatorios.
4. Ocultar y bloquear acciones de escritura.
5. Ejecutar pruebas y validar en producción con la cuenta de Aumise.
