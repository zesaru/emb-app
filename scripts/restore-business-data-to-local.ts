#!/usr/bin/env tsx

import fs from "node:fs/promises";
import pg from "pg";

const { Client } = pg;
const TABLES = ["users", "vacations", "compensatorys", "attendances"] as const;
const LOCAL_DATABASE_URL = process.env.LOCAL_DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:55422/postgres";

type Row = Record<string, unknown>;
type Backup = { data: Record<string, Row[]> };

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

async function main() {
  const backupPath = process.argv[2];
  if (!backupPath) throw new Error("Uso: tsx scripts/restore-business-data-to-local.ts <backup.json>");
  const backup = JSON.parse(await fs.readFile(backupPath, "utf8")) as Backup;
  const client = new Client({ connectionString: LOCAL_DATABASE_URL });
  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query(`TRUNCATE ${TABLES.map((table) => `public.${quoteIdentifier(table)}`).join(", ")} RESTART IDENTITY CASCADE`);

    let total = 0;
    for (const table of TABLES) {
      const rows = backup.data[table] ?? [];
      if (rows.length === 0) continue;
      const columns = Object.keys(rows[0]);
      const columnSql = columns.map(quoteIdentifier).join(", ");
      const values: unknown[] = [];
      const placeholders = rows.map((row) => {
        const rowPlaceholders = columns.map((column) => {
          values.push(row[column]);
          return `$${values.length}`;
        });
        return `(${rowPlaceholders.join(", ")})`;
      }).join(", ");
      await client.query(`INSERT INTO public.${quoteIdentifier(table)} (${columnSql}) VALUES ${placeholders}`, values);
      total += rows.length;
      console.log(`${table}: ${rows.length}`);
    }
    await client.query("COMMIT");
    console.log(`total: ${total}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
