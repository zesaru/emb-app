#!/usr/bin/env tsx
/**
 * Restaura un backup COMPLETO (datos + autenticación)
 *
 * Uso:
 *   tsx scripts/restore-full.ts ./backups/backup-xxx.json
 *
 * ADVERTENCIA: Para restaurar usuarios autenticados, necesitará
 * que los usuarios restablezcan sus contraseñas (los hashes no se migran)
 */

import fs from 'fs/promises';
import path from 'path';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Client } = pg;

const SUPABASE_LOCAL_URL = 'postgresql://postgres:postgres@localhost:54322/postgres';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

interface ColumnInfo {
  name: string;
  type: string;
}

interface TableBackup {
  schema: string;
  columns: ColumnInfo[];
  data: any[];
}

interface BackupData {
  version: string;
  timestamp: string;
  tables: Record<string, TableBackup>;
}

function escapeString(value: string): string {
  return value.replace(/'/g, "''");
}

function valueToSql(value: any, dataType: string): string {
  if (value === null || value === undefined || value === '') {
    return 'NULL';
  }

  // Tipos UUID
  if (dataType === 'uuid' && typeof value === 'string') {
    return `'${value}'::UUID`;
  }

  // Booleanos
  if (dataType === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  // Números
  if (dataType === 'integer' || dataType === 'bigint' || dataType === 'numeric') {
    return String(value);
  }

  // Timestamps
  if (dataType === 'timestamp with time zone' || dataType === 'timestamptz') {
    return `'${value}'::timestamptz`;
  }

  if (dataType === 'timestamp') {
    return `'${value}'::timestamp`;
  }

  // JSON
  if (dataType === 'jsonb' || dataType === 'json') {
    if (typeof value === 'object') {
      return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
    }
    return `'${value}'::jsonb`;
  }

  // Texto por defecto
  return `'${escapeString(String(value))}'`;
}

async function restoreAuthUsers(client: pg.Client, data: any[]) {
  console.log('\n  ⚠️  Tabla auth.users no se puede restaurar directamente');
  console.log('  Los passwords están encriptados con bcrypt específico de Supabase');
  console.log('  Creando usuarios con contraseña temporal...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  for (const row of data) {
    const { id, email, phone, email_confirmed_at, phone_confirmed_at, raw_user_meta_data, raw_app_meta_data } = row;

    try {
      // Crear usuario usando signup API
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: 'password123', // Contraseña temporal
        options: {
          data: raw_user_meta_data || {},
        }
      });

      if (error) {
        console.log(`    ⚠️  Usuario ${email} ya existe o hubo error: ${error.message}`);
        continue;
      }

      // Actualizar auth.users con los IDs correctos
      await client.query(`
        UPDATE auth.users
        SET id = $1::uuid,
            phone = $2,
            email_confirmed_at = $3,
            phone_confirmed_at = $4,
            raw_app_meta_data = $5
        WHERE id = $6::uuid
      `, [
        id,
        phone || null,
        email_confirmed_at || null,
        phone_confirmed_at || null,
        raw_app_meta_data ? JSON.stringify(raw_app_meta_data) : null,
        data.user?.id,
      ]);

      console.log(`    ✓ Usuario ${email} restaurado con ID ${id}`);

    } catch (error) {
      console.log(`    ✗ Error restaurando ${email}: ${error}`);
    }
  }
}

async function restoreTable(client: pg.Client, tableName: string, backup: TableBackup) {
  const { schema, columns, data } = backup;
  const fullTableName = `"${schema}"."${tableName}"`;

  console.log(`  Restaurando: ${schema}.${tableName} (${data.length} filas)`);

  try {
    // Para tablas auth, no drop (son manejadas por Supabase)
    if (schema !== 'auth') {
      await client.query(`DROP TABLE IF EXISTS ${fullTableName} CASCADE`);
    }

    // Crear tabla (solo para esquema public, auth ya existe)
    if (schema === 'public') {
      const columnDefs = columns.map(col => {
        return `"${col.name}" ${col.type.toUpperCase()}`;
      }).join(', ');

      await client.query(`CREATE TABLE ${fullTableName} (${columnDefs})`);
    }

    // Insertar datos
    if (data.length > 0) {
      const columnNames = columns.map(c => `"${c.name}"`).join(', ');

      for (const row of data) {
        const values = columns.map(col => {
          const value = row[col.name];
          return valueToSql(value, col.type);
        });

        await client.query(`INSERT INTO ${fullTableName} (${columnNames}) VALUES (${values.join(', ')})`);
      }
    }

    console.log(`    ✓ ${data.length} filas insertadas`);

  } catch (error: any) {
    console.log(`    ⚠️  Error: ${error.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Uso: tsx scripts/restore-full.ts <backup-file.json>');
    console.log('Ejemplo: tsx scripts/restore-full.ts ./backups/backup-1234567890.json\n');
    process.exit(1);
  }

  const backupPath = args[0];

  // Verificar archivo
  try {
    await fs.access(backupPath);
  } catch {
    console.error(`✗ Error: No existe el archivo ${backupPath}`);
    process.exit(1);
  }

  const content = await fs.readFile(backupPath, 'utf-8');
  const backup: BackupData = JSON.parse(content);

  console.log(`🔄 Restaurando backup: ${backupPath}`);
  console.log(`  Versión: ${backup.version}`);
  console.log(`  Timestamp: ${backup.timestamp}`);
  console.log(`  Tablas: ${Object.keys(backup.tables).length}\n`);

  const client = new Client({ connectionString: SUPABASE_LOCAL_URL });

  try {
    await client.connect();
    console.log('✓ Conectado a Supabase Local\n');

    const startTime = Date.now();

    // Primero restaurar usuarios de auth (si existen)
    const authUsers = backup.tables['auth.users'];
    if (authUsers && authUsers.data.length > 0) {
      await restoreAuthUsers(client, authUsers.data);

      // Esperar un poco para que se procesen
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Luego restaurar tablas públicas
    const publicTables = ['users', 'compensatorys', 'vacations', 'attendances'];

    for (const tableName of publicTables) {
      const key = `public.${tableName}`;
      if (backup.tables[key]) {
        await restoreTable(client, tableName, backup.tables[key]);
      }
    }

    // Finalmente restaurar otras tablas de auth
    const authTables = ['identities', 'sessions'];
    for (const tableName of authTables) {
      const key = `auth.${tableName}`;
      if (backup.tables[key]) {
        await restoreTable(client, tableName, backup.tables[key]);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✓ Restauración completada en ${duration}s\n`);
    console.log('⚠️  IMPORTANTE: Los usuarios tienen contraseña temporal: password123');
    console.log('                Deben cambiarla después del primer login\n');

  } catch (error) {
    console.error('\n✗ Error durante la restauración:');
    console.error(`  ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
