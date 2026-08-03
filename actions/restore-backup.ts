"use server";

import { backupService } from "@/lib/backup/backup-service";
import { emailNotifier } from "@/lib/backup/email-notifier";
import { RestoreResult } from "@/lib/backup/backup-types";
import { requireCurrentUserSuperAdminAndActive } from "@/lib/auth/admin-check";

/**
 * Restores a backup from local or cloud storage.
 * Only accessible to admin users.
 *
 * @param {string} backupId - The ID of the backup to restore
 * @returns {Promise<RestoreResult>} Result of the restore operation
 */
export const restoreBackup = async (backupId: string): Promise<RestoreResult> => {
  try {
    await requireCurrentUserSuperAdminAndActive();
  } catch (error) {
    return {
      success: false,
      restoredAt: new Date(),
      tablesAffected: [],
      error: error instanceof Error ? error.message : "No autorizado"
    };
  }

  // Restore backup
  const result = await backupService.restoreBackup(backupId);

  // Send notification
  if (result.success) {
    await emailNotifier.notifyRestoreSuccess(result.tablesAffected);
  } else {
    await emailNotifier.notifyRestoreFailure(result.error || "Error desconocido");
  }

  return result;
};
