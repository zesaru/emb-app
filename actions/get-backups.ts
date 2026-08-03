"use server";

import { storageManager } from "@/lib/backup/storage-manager";
import { BackupMetadata } from "@/lib/backup/backup-types";
import { requireCurrentUserSuperAdminAndActive } from "@/lib/auth/admin-check";

/**
 * Lists all available backups from both local and cloud storage.
 * Only accessible to admin users.
 *
 * @returns {Promise<BackupMetadata[]>} Array of backup metadata
 */
export const getBackups = async (): Promise<BackupMetadata[]> => {
  await requireCurrentUserSuperAdminAndActive();

  // Get backups from both local and cloud storage
  const [localBackups, cloudBackups] = await Promise.all([
    storageManager.listLocalBackups(),
    storageManager.listCloudBackups()
  ]);

  // Combine and deduplicate by ID
  const backupMap = new Map<string, BackupMetadata>();

  for (const backup of [...localBackups, ...cloudBackups]) {
    const existing = backupMap.get(backup.id);
    if (existing) {
      // Merge storage locations
      const mergedLocations = Array.from(
        new Set([...existing.storageLocation, ...backup.storageLocation])
      );
      existing.storageLocation = mergedLocations as ('local' | 'cloud')[];
    } else {
      backupMap.set(backup.id, backup);
    }
  }

  // Sort by creation date (newest first)
  return Array.from(backupMap.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
};
