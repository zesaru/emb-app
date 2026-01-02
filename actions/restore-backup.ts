"use server";

import { createClient } from "@/utils/supabase/server";
import { backupService } from "@/lib/backup/backup-service";
import { emailNotifier } from "@/lib/backup/email-notifier";
import { RestoreResult } from "@/lib/backup/backup-types";

export const dynamic = 'force-dynamic';

/**
 * Restores a backup from local or cloud storage.
 * Only accessible to admin users.
 *
 * @param {string} backupId - The ID of the backup to restore
 * @returns {Promise<RestoreResult>} Result of the restore operation
 */
export const restoreBackup = async (backupId: string): Promise<RestoreResult> => {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      restoredAt: new Date(),
      tablesAffected: [],
      error: "Usuario no autenticado"
    };
  }

  // Get user details to check admin status
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("admin")
    .eq("id", user.id)
    .single();

  if (userError || !userData || userData.admin !== "admin") {
    return {
      success: false,
      restoredAt: new Date(),
      tablesAffected: [],
      error: "No autorizado: Se requieren privilegios de administrador"
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
