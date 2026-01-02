import { BackupMetadata } from './backup-types';
import { storageManager } from './storage-manager';

export async function applyRetentionPolicy(
  backups: BackupMetadata[],
  retentionDays: number
): Promise<string[]> {
  const now = new Date();
  const deletedIds: string[] = [];

  for (const backup of backups) {
    const ageInDays = (now.getTime() - backup.createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (ageInDays > retentionDays) {
      // Delete from local storage if present
      if (backup.storageLocation.includes('local')) {
        try {
          await storageManager.deleteLocalBackup(backup.filename);
        } catch (error) {
          console.error(`Failed to delete local backup ${backup.filename}:`, error);
        }
      }

      // Delete from cloud storage if present
      if (backup.storageLocation.includes('cloud')) {
        try {
          await storageManager.deleteCloudBackup(backup.filename);
        } catch (error) {
          console.error(`Failed to delete cloud backup ${backup.filename}:`, error);
        }
      }

      deletedIds.push(backup.id);
    }
  }

  return deletedIds;
}

export function calculateRetentionPolicy(
  backups: BackupMetadata[],
  retentionDays: number
): {
  toDelete: BackupMetadata[];
  toKeep: BackupMetadata[];
  spaceToRecover: number;
} {
  const now = new Date();
  const toDelete: BackupMetadata[] = [];
  const toKeep: BackupMetadata[] = [];
  let spaceToRecover = 0;

  for (const backup of backups) {
    const ageInDays = (now.getTime() - backup.createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (ageInDays > retentionDays) {
      toDelete.push(backup);
      spaceToRecover += backup.size;
    } else {
      toKeep.push(backup);
    }
  }

  return {
    toDelete,
    toKeep,
    spaceToRecover
  };
}
