#!/usr/bin/env tsx
/**
 * Crea un backup COMPLETO de Supabase (datos + autenticación)
 *
 * Uso:
 *   tsx scripts/backup-full.ts
 *
 * Guarda:
 *   - Tablas públicas (users, compensatorys, vacations, attendances)
 *   - Tablas de autenticación (auth.users, auth.identities)
 *
 * El archivo se guarda en ./backups/backup-<timestamp>.json
 */

import fs from 'fs/promises';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

// Configuración de conexión
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';

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
  database_url: string;  // Para saber de dónde vino
  tables: Record<string, TableBackup>;
}

// Columnas sensibles que NO respaldaremos de auth
const SENSITIVE_COLUMNS = new Set([
  'encrypted_password',
  'confirmation_token',
  'recovery_token',
  'email_change_token_current',
  'email_change_token_new',
  'phone_change_token',
  'reauthentication_token',
]);

// Tablas a respaldar
const TABLES_TO_BACKUP = [
  // Tablas públicas
  { schema: 'public', table: 'users' },
  { schema: 'public', table: 'compensatorys' },
  { schema: 'public', table: 'vacations' },
  { schema: 'public', table: 'attendances' },

  // Tablas de autenticación
  { schema: 'auth', table: 'users', excludeColumns: ['encrypted_password', 'confirmation_token', 'recovery_token'] },
  { schema: 'auth', table: 'identities' },
  { schema: 'auth', table: 'sessions' },
];

async function getTableColumns(client: pg.Client, schema: string, table: string, excludeColumns: string[] = []): Promise<ColumnInfo[]> {
  const query = `
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = $2
    ORDER BY ordinal_position;
  `;

  const result = await client.query(query, [schema, table]);

  return result.rows
    .filter(row => !excludeColumns.includes(row.column_name))
    .map(row => ({
      name: row.column_name,
      type: row.data_type,
    }));
}

async function backupTable(client: pg.Client, schema: string, table: string, excludeColumns: string[] = []): Promise<TableBackup> {
  console.log(`  Backupeando: ${schema}.${table}`);

  // Obtener columnas
  const columns = await getTableColumns(client, schema, table, excludeColumns);
  const columnList = columns.map(c => c.name).join(', ');

  // Obtener datos
  const dataQuery = `SELECT ${columnList} FROM "${schema}"."${table}"`;
  const result = await client.query(dataQuery);

  console.log(`    ✓ ${result.rows.length} filas`);

  return {
    schema,
    columns,
    data: result.rows,
  };
}

async function main() {
  console.log('🔄 Iniciando backup completo de Supabase...\n');

  const client = new Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✓ Conectado a la base de datos\n');

    const backup: BackupData = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      database_url: DB_URL.replace(/:[^:@]+@/, ':****@'), // Ocultar password
      tables: {},
    };

    // Backupear cada tabla
    for (const { schema, table, excludeColumns = [] } of TABLES_TO_BACKUP) {
      const tableBackup = await backupTable(client, schema, table, excludeColumns);
      const key = `${schema}.${table}`;
      backup.tables[key] = tableBackup;
    }

    // Crear directorio de backups
    const backupsDir = path.join(process.cwd(), 'backups');
    await fs.mkdir(backupsDir, { recursive: true });

    // Guardar archivo
    const filename = `backup-${Date.now()}.json`;
    const filepath = path.join(backupsDir, filename);
    await fs.writeFile(filepath, JSON.stringify(backup, null, 2), 'utf-8');

    // Estadísticas
    const totalRows = Object.values(backup.tables).reduce((sum, t) => sum + t.data.length, 0);

    console.log('\n✓ Backup completado!\n');
    console.log(`  Archivo: ${filepath}`);
    console.log(`  Tamaño: ${(JSON.stringify(backup).length / 1024).toFixed(2)} KB`);
    console.log(`  Tablas: ${Object.keys(backup.tables).length}`);
    console.log(`  Total filas: ${totalRows}`);
    console.log('\nPara restaurar:');
    console.log(`  tsx scripts/restore-full.ts ${filename}`);

  } catch (error) {
    console.error('\n✗ Error durante el backup:');
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
