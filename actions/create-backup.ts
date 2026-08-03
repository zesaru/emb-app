"use server";

import { backupService } from "@/lib/backup/backup-service";
import { emailNotifier } from "@/lib/backup/email-notifier";
import { BackupResult } from "@/lib/backup/backup-types";
import { requireCurrentUserSuperAdminAndActive } from "@/lib/auth/admin-check";

/**
 * Creates a backup of the database.
 * Only accessible to admin users.
 *
 * @returns {Promise<BackupResult>} Result of the backup operation
 */
export const createBackup = async (): Promise<BackupResult> => {
  try {
    await requireCurrentUserSuperAdminAndActive();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "No autorizado",
      duration: 0
    };
  }

  // Create backup
  const result = await backupService.createBackup();

  // Send notification
  if (result.success) {
    await emailNotifier.notifyBackupSuccess(result);
  } else {
    await emailNotifier.notifyBackupFailure(result.error || "Error desconocido", result.duration);
  }

  return result;
};
