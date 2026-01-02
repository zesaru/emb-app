#!/usr/bin/env tsx
/**
 * Restaura un backup JSON directamente a Supabase Local
 *
 * Uso:
 *   tsx scripts/restore-to-local.ts ./backups/backup-xxx.json
 *
 * Requiere:
 *   - Supabase Local corriendo (npm run supabase:start)
 *   - Base de datos en localhost:54321
 */

import fs from 'fs/promises';
import pg from 'pg';

const { Client } = pg;

// Configuración de conexión a Supabase Local
const SUPABASE_LOCAL_URL = 'postgresql://postgres:postgres@localhost:54322/postgres';

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
}

interface TableSchema {
  columns: ColumnInfo[];
}

interface BackupData {
  version: string;
  timestamp: string;
  schema: Record<string, TableSchema>;
  data: Record<string, any[]>;
}

// Mapeo de tipos TypeScript a tipos PostgreSQL
const typeMapping: Record<string, string> = {
  'uuid': 'UUID',
  'text': 'TEXT',
  'integer': 'INTEGER',
  'boolean': 'BOOLEAN',
  'timestamp with time zone': 'TIMESTAMPTZ',
  'timestamp': 'TIMESTAMP',
  'date': 'DATE',
  'number': 'NUMERIC',
  'json': 'JSONB',
  'jsonb': 'JSONB'
};

function convertType(tsType: string): string {
  return typeMapping[tsType] || 'TEXT';
}

function escapeString(value: string): string {
  return value
    .replace(/'/g, "''");
}

function valueToSql(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  const type = typeof value;

  if (type === 'string') {
    return `'${escapeString(value)}'`;
  }

  if (type === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  if (type === 'number') {
    return String(value);
  }

  if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value))) {
    return `'${value}'::timestamptz`;
  }

  if (Array.isArray(value)) {
    return `'${JSON.stringify(value)}'::jsonb`;
  }

  if (typeof value === 'object') {
    return `'${JSON.stringify(value)}'::jsonb`;
  }

  return `'${value}'`;
}

async function restoreTable(client: pg.Client, tableName: string, schema: TableSchema, data: any[]) {
  console.error(`  Procesando tabla: ${tableName} (${data.length} filas)`);

  // 1. Drop table if exists
  try {
    await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
  } catch (error) {
    // Ignorar error si tabla no existe
  }

  // 2. Create table - Usar columnas reales de los datos si el schema está vacío o no coincide
  let columnsToCreate: string[] = [];

  if (data.length > 0) {
    // Usar las columnas reales de los datos
    columnsToCreate = Object.keys(data[0]);
  } else if (schema && schema.columns.length > 0) {
    columnsToCreate = schema.columns.map(col => col.name);
  }

  if (columnsToCreate.length > 0) {
    const columnDefs = columnsToCreate.map(col => `"${col}" TEXT`).join(', ');
    const createTableSql = `CREATE TABLE "${tableName}" (${columnDefs})`;
    await client.query(createTableSql);
  } else {
    await client.query(`CREATE TABLE "${tableName}" (id TEXT)`);
  }

  // 3. Insert data
  if (data.length > 0) {
    const columns = Object.keys(data[0]);
    const columnList = columns.map(c => `"${c}"`).join(', ');

    for (const row of data) {
      const values = columns.map(col => valueToSql(row[col]));
      const insertSql = `INSERT INTO "${tableName}" (${columnList}) VALUES (${values.join(', ')})`;
      await client.query(insertSql);
    }
  }

  console.error(`    ✓ ${tableName}: ${data.length} filas insertadas`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Uso: tsx scripts/restore-to-local.ts <backup-file.json>');
    console.error('Ejemplo: tsx scripts/restore-to-local.ts ./backups/backup-1767329074390.json');
    console.error('');
    console.error('Asegúrate de que Supabase Local esté corriendo:');
    console.error('  npm run supabase:start');
    process.exit(1);
  }

  const backupPath = args[0];

  // Verificar que el archivo existe
  try {
    await fs.access(backupPath);
  } catch {
    console.error(`Error: No existe el archivo ${backupPath}`);
    process.exit(1);
  }

  console.error(`Restaurando backup: ${backupPath}`);
  console.error('');

  const content = await fs.readFile(backupPath, 'utf-8');
  const backup: BackupData = JSON.parse(content);

  // Soporte para formato antiguo (v1.0) sin schema
  const backupData: BackupData = backup.version
    ? backup
    : {
        version: '1.0',
        timestamp: new Date().toISOString(),
        schema: {},
        data: backup as unknown as Record<string, any[]>
      };

  console.error(`Versión: ${backupData.version}`);
  console.error(`Tablas: ${Object.keys(backupData.data).join(', ')}`);
  console.error(`Timestamp: ${backupData.timestamp}`);
  console.error('');

  // Conectar a Supabase Local
  const client = new Client({
    connectionString: SUPABASE_LOCAL_URL,
  });

  try {
    await client.connect();
    console.error('✓ Conectado a Supabase Local');
    console.error('');

    const startTime = Date.now();

    // Restaurar cada tabla
    for (const tableName of Object.keys(backupData.data)) {
      const schema = backupData.schema[tableName];
      const data = backupData.data[tableName];

      await restoreTable(client, tableName, schema || { columns: [] }, data);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.error('');
    console.error(`✓ Restauración completada en ${duration}s`);
    console.error(`  - Tablas: ${Object.keys(backupData.data).length}`);
    console.error(`  - Total filas: ${Object.values(backupData.data).reduce((sum, rows) => sum + rows.length, 0)}`);
    console.error('');
    console.error('Para ver los datos, abre:');
    console.error('  - Supabase Dashboard: http://localhost:54321');
    console.error('  - Database: postgres → Tables');

  } catch (error) {
    console.error('');
    console.error('✗ Error durante la restauración:');
    console.error(`  ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
