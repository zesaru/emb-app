"use server";

import { createClient } from "@/utils/supabase/server";
import { backupService } from "@/lib/backup/backup-service";
import { emailNotifier } from "@/lib/backup/email-notifier";
import { BackupResult } from "@/lib/backup/backup-types";

export const dynamic = 'force-dynamic';

/**
 * Creates a backup of the database.
 * Only accessible to admin users.
 *
 * @returns {Promise<BackupResult>} Result of the backup operation
 */
export const createBackup = async (): Promise<BackupResult> => {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Usuario no autenticado",
      duration: 0
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
      error: "No autorizado: Se requieren privilegios de administrador",
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
