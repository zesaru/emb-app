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

async function calculateChecksum(data: string): Promise<string> {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export const backupService = {
  async createBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    const supabase = createClient();

    try {
      const backupData: Record<string, any[]> = {};
      let totalRecords = 0;

      // Export all tables
      for (const table of TABLES_TO_BACKUP) {
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) {
          throw new Error(`Failed to export table ${table}: ${error.message}`);
        }

        backupData[table] = data || [];
        totalRecords += data?.length || 0;
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
      let backupData: string;

      try {
        const localBuffer = await storageManager.listLocalBackups();
        const localBackup = localBackup.find(b => b.id === backupId);
        if (localBackup) {
          const fs = await import('fs/promises');
          const buffer = await fs.readFile(localBackup.filename);
          backupData = buffer.toString('utf-8');
        } else {
          throw new Error('Backup not found locally');
        }
      } catch (error) {
        // Try cloud storage
        const cloudBackups = await storageManager.listCloudBackups();
        const cloudBackup = cloudBackups.find(b => b.id === backupId);

        if (!cloudBackup) {
          throw new Error('Backup not found');
        }

        const buffer = await storageManager.downloadFromCloud(cloudBackup.filename);
        backupData = buffer.toString('utf-8');
      }

      // Parse and validate backup data
      const data = JSON.parse(backupData);

      // Restore each table
      for (const table of TABLES_TO_BACKUP) {
        if (!data[table]) {
          console.warn(`Table ${table} not found in backup`);
          continue;
        }

        const records = data[table];
        if (!Array.isArray(records)) {
          throw new Error(`Invalid data format for table ${table}`);
        }

        // Delete existing data
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (this is a dummy condition)

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
        existing.storageLocation = [...new Set([...existing.storageLocation, ...backup.storageLocation])];
      } else {
        backupMap.set(backup.id, backup);
      }
    }

    return Array.from(backupMap.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
};
