# Supabase RLS Auditor - Instrucciones

## Verificar que RLS está activado

```sql
-- Verificar estado de RLS en todas las tablas
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Resultado esperado: rowsecurity = true para todas las tablas
```

## Verificar políticas existentes

```sql
-- Ver todas las políticas RLS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Activar RLS si está desactivado

```sql
ALTER TABLE compensatorys ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

## Patrones de políticas RLS

### Política SELECT para usuarios propios

```sql
CREATE POLICY "users_can_view_own_data"
ON users FOR SELECT
USING (auth.uid() = id);
```

### Política SELECT para admin

```sql
CREATE POLICY "admins_can_view_all"
ON compensatorys FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.admin = 'admin'
  )
);
```

### Política INSERT para datos propios

```sql
CREATE POLICY "users_can_insert_own"
ON compensatorys FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Política UPDATE para aprobación (admin)

```sql
CREATE POLICY "admins_can_approve"
ON compensatorys FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.admin = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.admin = 'admin'
  )
);
```

## Debug de RLS

```sql
-- Verificar qué usuario está autenticado
SELECT auth.uid();

-- Verificar las claims del JWT actual
SELECT * FROM auth.jwt();

-- Probar query con usuario específico
SET LOCAL jwt.claims.sub = 'user-uuid';
SELECT * FROM compensatorys;
```
