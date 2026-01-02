"use server";

import { createClient } from "@/utils/supabase/server";
import { storageManager } from "@/lib/backup/storage-manager";
import { BackupMetadata } from "@/lib/backup/backup-types";

/**
 * Lists all available backups from both local and cloud storage.
 * Only accessible to admin users.
 *
 * @returns {Promise<BackupMetadata[]>} Array of backup metadata
 */
export const getBackups = async (): Promise<BackupMetadata[]> => {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  // Get user details to check admin status
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("admin")
    .eq("id", user.id)
    .single();

  if (userError || !userData || userData.admin !== "admin") {
    throw new Error("No autorizado: Se requieren privilegios de administrador");
  }

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
