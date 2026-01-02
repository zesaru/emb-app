# Supabase RLS Auditor - Ejemplos

## Ejemplo 1: Auditoría completa de tabla compensatorys

```
Usuario: Audita las políticas RLS de compensatorys
Claude:
Ejecutando análisis RLS de compensatorys...

✓ RLS está habilitado
✓ Política "users_can_select_own" encontrada
✓ Política "users_can_insert_own" encontrada
✓ Política "admins_can_update" encontrada
✓ Política "admins_can_delete" encontrada

⚠️  Problema detectado:
La política "users_can_insert_own" no tiene WITH CHECK,
lo que permite insertar con cualquier user_id.

Solución sugerida:
ALTER POLICY "users_can_insert_own" ON compensatorys
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

## Ejemplo 2: Ejecutar pruebas de penetración RLS

```
Usuario: Ejecuta pruebas RLS
Claude:
Ejecutando tsx scripts/test-rls.ts compensatorys...

Testing INSERT con user_id diferente...
❌ FALLO: Se permitió insertar con user_id de otro usuario
   Query: INSERT INTO compensatorys (user_id, hours) VALUES ('OTHER', 8)
   Resultado: Éxito (DEBERÍA FALLAR)

Testing SELECT de otros usuarios...
✅ PASS: No se pueden ver datos de otros usuarios

Testing UPDATE por usuario no admin...
❌ FALLO: Usuario no admin pudo actualizar registro

Resumen: 2/3 tests pasaron
```

## Ejemplo 3: Auditoría de todas las tablas

```
Usuario: Audita todas las políticas RLS del proyecto
Claude:
=== AUDITORÍA RLS COMPLETA ===

Tabla: users
  ✓ RLS habilitado
  ✓ 4 políticas encontradas
  ⚠️  Falta política DELETE para usuarios propios

Tabla: compensatorys
  ✓ RLS habilitado
  ✓ 5 políticas encontradas
  ✓ Todas las operaciones protegidas

Tabla: vacations
  ✓ RLS habilitado
  ✓ 4 políticas encontradas
  ✓ Todas las operaciones protegidas

Tabla: attendances
  ✓ RLS habilitado
  ✓ 2 políticas encontradas
  ❌ Faltan políticas INSERT y UPDATE para admin

=== RECOMENDACIONES ===
1. Agregar política DELETE en users para que usuarios
   puedan eliminar su propia cuenta
2. Completar políticas de attendances con INSERT/UPDATE para admin
```

## Ejemplo 4: Verificación SQL manual

```sql
-- Verificar que un usuario no puede ver datos de otros
BEGIN;
SET LOCAL jwt.claims.sub = '550e8400-e29b-41d4-a716-446655440000';

SELECT * FROM compensatorys WHERE user_id != '550e8400-e29b-41d4-a716-446655440000';
-- Esperado: 0 filas

SELECT * FROM compensatorys WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
-- Esperado: filas del usuario

ROLLBACK;

-- Verificar que admin puede ver todo
BEGIN;
SET LOCAL role TO postgres;
-- Crear contexto de admin
SET LOCAL request.jwt.claim.role = 'admin';

SELECT COUNT(*) FROM compensatorys;
-- Esperado: todas las filas

ROLLBACK;
```
