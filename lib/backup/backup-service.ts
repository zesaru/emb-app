import { createClient } from '@/utils/supabase/server';
import { Database } from '@/types/database.type';
import { BackupMetadata, BackupResult, RestoreResult } from './backup-types';
import { storageManager } from './storage-manager';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const TABLES_TO_BACKUP = [
  'users',
  'compensatorys',
  'vacations',
  'attendances'
] as const;

type TableName = typeof TABLES_TO_BACKUP[number];

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

async function calculateChecksum(data: string): Promise<string> {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Schema basado en las columnas reales de la base de datos de producción
 * Extraído de backups reales: users, compensatorys, vacations, attendances
 */
const TABLE_SCHEMAS: Record<string, TableSchema> = {
  users: {
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false },
      { name: 'name', type: 'text', nullable: false },
      { name: 'email', type: 'text', nullable: false },
      { name: 'role', type: 'text', nullable: true },
      { name: 'num_vacations', type: 'integer', nullable: true },
      { name: 'num_compensatorys', type: 'integer', nullable: true },
      { name: 'admin', type: 'text', nullable: true },
      { name: 'is_active', type: 'boolean', nullable: true }
    ]
  },
  compensatorys: {
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false },
      { name: 'user_id', type: 'uuid', nullable: true },
      { name: 'event_date', type: 'text', nullable: true },
      { name: 'event_name', type: 'text', nullable: true },
      { name: 'hours', type: 'integer', nullable: true },
      { name: 'approve_request', type: 'boolean', nullable: true },
      { name: 'approved_by', type: 'uuid', nullable: true },
      { name: 'approved_date', type: 'text', nullable: true },
      { name: 'compensated_hours', type: 'integer', nullable: true },
      { name: 'approved_by_compensated', type: 'uuid', nullable: true },
      { name: 'compensated_hours_day', type: 'text', nullable: true },
      { name: 'final_approve_request', type: 'boolean', nullable: true },
      { name: 't_time_start', type: 'text', nullable: true },
      { name: 't_time_finish', type: 'text', nullable: true }
    ]
  },
  vacations: {
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false },
      { name: 'id_user', type: 'uuid', nullable: true },
      { name: 'start', type: 'text', nullable: true },
      { name: 'finish', type: 'text', nullable: true },
      { name: 'days', type: 'integer', nullable: true },
      { name: 'approve_request', type: 'boolean', nullable: true },
      { name: 'approvedby', type: 'uuid', nullable: true },
      { name: 'approved_date', type: 'text', nullable: true },
      { name: 'final_approve_request', type: 'boolean', nullable: true },
      { name: 'period', type: 'text', nullable: true },
      { name: 'request_date', type: 'text', nullable: true }
    ]
  },
  attendances: {
    columns: [
      { name: 'id', type: 'integer', nullable: false },
      { name: 'created_at', type: 'timestamp with time zone', nullable: false },
      { name: 'date', type: 'text', nullable: true },
      { name: 'name', type: 'text', nullable: true },
      { name: 'user_id', type: 'uuid', nullable: true },
      { name: 'ai', type: 'integer', nullable: true },
      { name: 'register', type: 'integer', nullable: true }
    ]
  }
};

export const backupService = {
  async createBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    const supabase = createClient();

    try {
      const backupData: BackupData = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        schema: {},
        data: {}
      };

      // Export schema and data for each table
      for (const table of TABLES_TO_BACKUP) {
        // Get schema from predefined definitions
        backupData.schema[table] = TABLE_SCHEMAS[table] || { columns: [] };

        // Get data from database
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) {
          throw new Error(`Failed to export table ${table}: ${error.message}`);
        }

        backupData.data[table] = data || [];
      }

      // Convert to JSON
      const jsonData = JSON.stringify(backupData, null, 2);
      const checksum = await calculateChecksum(jsonData);
      const buffer = Buffer.from(jsonData, 'utf-8');

      // Generate metadata
      const metadata: BackupMetadata = {
        id: crypto.randomUUID(),
        filename: `backup-${Date.now()}.json`,
        createdAt: new Date(),
        size: buffer.length,
        type: 'full',
        status: 'completed',
        storageLocation: [],
        checksum,
        tablesCount: TABLES_TO_BACKUP.length
      };

      // Save to local storage
      try {
        await storageManager.saveToLocal(buffer, metadata.filename);
        metadata.storageLocation.push('local');
      } catch (error) {
        console.error('Failed to save to local storage:', error);
      }

      // Save to cloud storage
      try {
        await storageManager.saveToCloud(buffer, metadata.filename);
        metadata.storageLocation.push('cloud');
      } catch (error) {
        console.error('Failed to save to cloud storage:', error);
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        metadata,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  },

  async restoreBackup(backupId: string): Promise<RestoreResult> {
    const supabase = createClient();
    const tablesAffected: string[] = [];

    try {
      // Try to get from local first, then cloud
      let backupContent: string;

      // List backups from both locations
      const localBackups = await storageManager.listLocalBackups();
      const localBackup = localBackups.find(b => b.id === backupId);

      if (localBackup) {
        const fs = await import('fs/promises');
        const buffer = await fs.readFile(`./backups/${localBackup.filename}`);
        backupContent = buffer.toString('utf-8');
      } else {
        // Try cloud storage
        const cloudBackups = await storageManager.listCloudBackups();
        const cloudBackup = cloudBackups.find(b => b.id === backupId);

        if (!cloudBackup) {
          throw new Error('Backup not found');
        }

        const buffer = await storageManager.downloadFromCloud(cloudBackup.filename);
        backupContent = buffer.toString('utf-8');
      }

      // Parse and validate backup data
      const parsed = JSON.parse(backupContent);

      // Handle both old format (direct data) and new format (with schema)
      const backupData: BackupData = parsed.version
        ? parsed as BackupData
        : {
            version: '1.0',
            timestamp: new Date().toISOString(),
            schema: {},
            data: parsed as Record<string, any[]>
          };

      // Restore each table
      for (const table of TABLES_TO_BACKUP) {
        const records = backupData.data[table];
        if (!records) {
          console.warn(`Table ${table} not found in backup`);
          continue;
        }

        if (!Array.isArray(records)) {
          throw new Error(`Invalid data format for table ${table}`);
        }

        // Delete existing data
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (dummy condition)

        if (deleteError && deleteError.code !== 'PGRST116') {
          throw new Error(`Failed to clear table ${table}: ${deleteError.message}`);
        }

        // Insert backup data
        if (records.length > 0) {
          const { error: insertError } = await supabase
            .from(table)
            .insert(records);

          if (insertError) {
            throw new Error(`Failed to restore table ${table}: ${insertError.message}`);
          }
        }

        tablesAffected.push(table);
      }

      return {
        success: true,
        restoredAt: new Date(),
        tablesAffected
      };
    } catch (error) {
      return {
        success: false,
        restoredAt: new Date(),
        tablesAffected,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async listBackups(): Promise<BackupMetadata[]> {
    const [localBackups, cloudBackups] = await Promise.all([
      storageManager.listLocalBackups(),
      storageManager.listCloudBackups()
    ]);

    // Merge and deduplicate by ID
    const backupMap = new Map<string, BackupMetadata>();

    for (const backup of [...localBackups, ...cloudBackups]) {
      const existing = backupMap.get(backup.id);
      if (existing) {
        // Merge storage locations
        existing.storageLocation = Array.from(new Set([...existing.storageLocation, ...backup.storageLocation]));
      } else {
        backupMap.set(backup.id, backup);
      }
    }

    return Array.from(backupMap.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
};
