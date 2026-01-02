#!/usr/bin/env tsx
/**
 * Convierte un backup JSON a SQL para importar en Supabase Local
 *
 * Uso:
 *   tsx scripts/backup-to-sql.ts ./backups/backup-xxx.json > backup.sql
 */

import fs from 'fs/promises';
import path from 'path';

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
  'jsonb': 'JSONB',
  'array': 'TEXT[]'
};

function convertType(tsType: string): string {
  return typeMapping[tsType] || 'TEXT';
}

function escapeString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
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

  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }

  if (Array.isArray(value)) {
    return `'${JSON.stringify(value)}'::jsonb`;
  }

  if (typeof value === 'object') {
    return `'${JSON.stringify(value)}'::jsonb`;
  }

  return `'${value}'`;
}

function generateCreateTable(tableName: string, schema: TableSchema): string {
  const columns = schema.columns
    .map(col => {
      const sqlType = convertType(col.type);
      const nullable = col.nullable ? '' : ' NOT NULL';
      return `    ${col.name} ${sqlType}${nullable}`;
    })
    .join(',\n');

  return `-- Table: ${tableName}
DROP TABLE IF EXISTS public.${tableName} CASCADE;
CREATE TABLE public.${tableName} (
${columns}
);

ALTER TABLE public.${tableName} OWNER TO postgres;
`;
}

function generateInsert(tableName: string, rows: any[]): string {
  if (!rows || rows.length === 0) {
    return `-- No data for table ${tableName}\n`;
  }

  const columns = Object.keys(rows[0]);
  const columnList = columns.join(', ');

  const values = rows
    .map(row => {
      const values = columns.map(col => valueToSql(row[col]));
      return `  (${values.join(', ')})`;
    })
    .join(',\n');

  return `-- Data for table ${tableName}
INSERT INTO public.${tableName} (${columnList})
VALUES
${values};
`;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Uso: tsx scripts/backup-to-sql.ts <backup-file.json>');
    console.error('Ejemplo: tsx scripts/backup-to-sql.ts ./backups/backup-1767329074390.json');
    process.exit(1);
  }

  const backupPath = args[0];

  console.error(`Leyendo backup: ${backupPath}`);

  const content = await fs.readFile(backupPath, 'utf-8');
  const backup: BackupData = JSON.parse(content);

  console.error(`Backup versión ${backup.version} de ${backup.timestamp}`);
  console.error(`Tablas: ${Object.keys(backup.data).join(', ')}`);

  let sql = `-- Backup SQL generado desde ${backupPath}\n`;
  sql += `-- Fecha: ${new Date().toISOString()}\n`;
  sql += `-- Versión backup: ${backup.version}\n\n`;
  sql += `BEGIN;\n\n`;

  // Generar CREATE TABLE e INSERT para cada tabla
  for (const tableName of Object.keys(backup.data)) {
    const schema = backup.schema[tableName];
    const data = backup.data[tableName];

    if (schema && schema.columns.length > 0) {
      sql += generateCreateTable(tableName, schema);
      sql += '\n';
    }

    sql += generateInsert(tableName, data);
    sql += '\n\n';
  }

  sql += `COMMIT;\n`;
  sql += `\n-- Restauración completada\n`;
  sql += `-- Tablas restauradas: ${Object.keys(backup.data).join(', ')}\n`;
  sql += `-- Total filas: ${Object.values(backup.data).reduce((sum, rows) => sum + rows.length, 0)}\n`;

  console.log(sql);
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
