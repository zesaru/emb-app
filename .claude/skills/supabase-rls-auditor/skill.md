# Supabase RLS Auditor

Verificador de políticas Row Level Security (RLS) para asegurar que los usuarios solo pueden acceder a sus propios datos.

## Comandos

### audit <tabla>
Audita las políticas RLS de una tabla específica.

```
auditar rls de vacations
auditar rls de compensatorys
auditar rls de users
auditar rls de attendances
```

### audit:all
Audita todas las políticas RLS del proyecto.

### test <tabla>
Ejecuta pruebas de penetración RLS sobre una tabla.

```bash
tsx scripts/test-rls.ts <tabla>
```

### generate
Genera scripts de prueba RLS para todas las tablas.

## Políticas RLS requeridas

### Tabla: users
- **SELECT**: Solo admin puede ver todos, usuarios ven su propio perfil
- **UPDATE**: Solo propio usuario o admin
- **INSERT**: Solo administradores
- **DELETE**: Solo administradores

### Tabla: compensatorys
- **SELECT**: Propio usuario o admin
- **INSERT**: Solo propio usuario
- **UPDATE**: Solo admin (para aprobación)
- **DELETE**: Solo admin

### Tabla: vacations
- **SELECT**: Propio usuario o admin
- **INSERT**: Solo propio usuario
- **UPDATE**: Solo admin (para aprobación)
- **DELETE**: Solo admin

### Tabla: attendances
- **SELECT**: Propio usuario o admin
- **INSERT**: Solo admin
- **UPDATE**: Solo admin
- **DELETE**: Solo admin

## Patrones de prueba

```sql
-- Test básico de RLS
SET LOCAL jwt.claims.sub = 'USER_ID';

-- Debe fallar
INSERT INTO compensatorys (user_id, hours) VALUES ('OTHER_USER_ID', 8);

-- Debe funcionar
INSERT INTO compensatorys (user_id, hours) VALUES ('USER_ID', 8);
```

## Script de prueba

```typescript
// scripts/test-rls.ts
import pg from 'pg'
const { Client } = pg

async function testRLS(tableName: string) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  await client.connect()

  try {
    // Test: Usuario no puede ver datos de otros usuarios
    const testUserId = 'TEST_USER_ID'
    const otherUserId = 'OTHER_USER_ID'

    await client.query('BEGIN')
    await client.query(`SET LOCAL jwt.claims.sub = '${testUserId}'`)

    // Intento de leer datos de otro usuario (debe fallar)
    const result = await client.query(
      `SELECT * FROM ${tableName} WHERE user_id = $1`,
      [otherUserId]
    )

    if (result.rows.length > 0) {
      console.error(`❌ FALLO RLS: ${tableName} permite ver datos de otros usuarios`)
    } else {
      console.log(`✅ PASS: ${tableName} RLS funciona correctamente`)
    }

    await client.query('ROLLBACK')
  } catch (error) {
    console.error(`Error probando RLS en ${tableName}:`, error)
  } finally {
    await client.end()
  }
}

testRLS(process.argv[2])
```
