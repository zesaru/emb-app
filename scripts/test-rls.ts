/**
 * Script de prueba para políticas RLS de Supabase
 *
 * Uso:
 *   npx tsx scripts/test-rls.ts [tabla]
 *
 * Ejemplo:
 *   npx tsx scripts/test-rls.ts compensatorys
 */

import pg from 'pg'
const { Client } = pg

interface RLSTestResult {
  table: string
  test: string
  passed: boolean
  message: string
}

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'
const OTHER_USER_ID = '00000000-0000-0000-0000-000000000002'

async function testRLS(tableName: string): Promise<RLSTestResult[]> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres',
  })

  await client.connect()
  const results: RLSTestResult[] = []

  try {
    // Test 1: Usuario no puede INSERT datos de otro usuario
    await client.query('BEGIN')
    await client.query(`SET LOCAL jwt.claims.sub = '${TEST_USER_ID}'`)
    try {
      await client.query(
        `INSERT INTO ${tableName} (user_id, hours) VALUES ($1, 8)`,
        [OTHER_USER_ID]
      )
      results.push({
        table: tableName,
        test: 'INSERT other user',
        passed: false,
        message: 'Permitió insertar con user_id de otro usuario',
      })
    } catch (error: any) {
      if (error.code === '42501') { // permission denied
        results.push({
          table: tableName,
          test: 'INSERT other user',
          passed: true,
          message: 'Bloqueó correctamente',
        })
      } else {
        results.push({
          table: tableName,
          test: 'INSERT other user',
          passed: false,
          message: `Error inesperado: ${error.code}`,
        })
      }
    }
    await client.query('ROLLBACK')

    // Test 2: Usuario puede SELECT sus propios datos
    await client.query('BEGIN')
    await client.query(`SET LOCAL jwt.claims.sub = '${TEST_USER_ID}'`)
    try {
      const result = await client.query(
        `SELECT * FROM ${tableName} WHERE user_id = $1`,
        [TEST_USER_ID]
      )
      results.push({
        table: tableName,
        test: 'SELECT own data',
        passed: true,
        message: `Retornó ${result.rowCount} filas`,
      })
    } catch (error: any) {
      results.push({
        table: tableName,
        test: 'SELECT own data',
        passed: false,
        message: error.message,
      })
    }
    await client.query('ROLLBACK')

    // Test 3: Usuario no puede SELECT datos de otros
    await client.query('BEGIN')
    await client.query(`SET LOCAL jwt.claims.sub = '${TEST_USER_ID}'`)
    try {
      const result = await client.query(
        `SELECT * FROM ${tableName} WHERE user_id = $1`,
        [OTHER_USER_ID]
      )
      if (result.rowCount === 0) {
        results.push({
          table: tableName,
          test: 'SELECT other user data',
          passed: true,
          message: 'No retornó datos (correcto)',
        })
      } else {
        results.push({
          table: tableName,
          test: 'SELECT other user data',
          passed: false,
          message: `Retornó ${result.rowCount} filas (debería ser 0)`,
        })
      }
    } catch (error: any) {
      results.push({
        table: tableName,
        test: 'SELECT other user data',
        passed: true,
        message: 'Query falló (correcto para RLS)',
      })
    }
    await client.query('ROLLBACK')

  } finally {
    await client.end()
  }

  return results
}

async function checkRLSEnabled(tableName: string): Promise<boolean> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres',
  })

  await client.connect()
  try {
    const result = await client.query(
      `SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = $1`,
      [tableName]
    )
    return result.rows[0]?.rowsecurity === true
  } finally {
    await client.end()
  }
}

async function main() {
  const tableName = process.argv[2]

  if (!tableName) {
    console.log('Uso: npx tsx scripts/test-rls.ts <tabla>')
    console.log('')
    console.log('Tablas disponibles:')
    console.log('  - compensatorys')
    console.log('  - vacations')
    console.log('  - attendances')
    console.log('  - users')
    process.exit(1)
  }

  console.log(`\n=== Auditando RLS para tabla: ${tableName} ===\n`)

  // Verificar que RLS está habilitado
  const rlsEnabled = await checkRLSEnabled(tableName)
  if (!rlsEnabled) {
    console.log(`❌ RLS NO está habilitado en ${tableName}`)
    console.log(`   Ejecuta: ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`)
    process.exit(1)
  }
  console.log(`✓ RLS está habilitado\n`)

  // Ejecutar pruebas
  const results = await testRLS(tableName)

  // Mostrar resultados
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌'
    console.log(`${icon} ${result.test}: ${result.message}`)
  })

  // Resumen
  const passed = results.filter(r => r.passed).length
  const total = results.length
  console.log(`\n${passed}/${total} pruebas pasaron`)

  process.exit(passed === total ? 0 : 1)
}

main().catch(console.error)
