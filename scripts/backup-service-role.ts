#!/usr/bin/env tsx
/**
 * Crea un backup de datos (users, compensatorys, vacations, attendances)
 * usando el service role key de Supabase (REST API), sin necesitar
 * `supabase login` ni una conexión directa a Postgres.
 *
 * Uso:
 *   export $(grep -v '^#' .env | xargs) && tsx scripts/backup-service-role.ts
 *
 * Guarda el archivo en ./backups/backup-<timestamp>.json con el mismo
 * formato que usa lib/backup/backup-service.ts (compatible con
 * scripts/backup-to-sql.ts y con el restore de la app).
 */

import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TABLES_TO_BACKUP = ['users', 'compensatorys', 'vacations', 'attendances'] as const;

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Backup de ${SUPABASE_URL}\n`);

  const backup = {
    version: '2.0',
    timestamp: new Date().toISOString(),
    schema: {} as Record<string, unknown>,
    data: {} as Record<string, unknown[]>,
  };

  for (const table of TABLES_TO_BACKUP) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.error(`✗ Error exportando ${table}: ${error.message}`);
      process.exit(1);
    }
    backup.data[table] = data ?? [];
    console.log(`  ✓ ${table}: ${data?.length ?? 0} filas`);
  }

  const backupsDir = path.join(process.cwd(), 'backups');
  await fs.mkdir(backupsDir, { recursive: true });

  const filename = `backup-${Date.now()}.json`;
  const filepath = path.join(backupsDir, filename);
  await fs.writeFile(filepath, JSON.stringify(backup, null, 2), 'utf-8');

  console.log(`\n✓ Backup completado: ${filepath}`);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
