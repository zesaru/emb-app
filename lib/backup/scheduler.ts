import * as cron from "node-cron";

let backupTask: cron.ScheduledTask | null = null;

/**
 * Inicia el cron job para backups automáticos
 * Se ejecuta todos los días a las 2:00 AM
 */
export function startBackupScheduler(): void {
  // Evitar iniciar múltiples veces
  if (backupTask) {
    console.log("[Backup Scheduler] Ya está corriendo");
    return;
  }

  // Cron expression: 0 2 * * * (todos los días a las 2:00 AM)
  backupTask = cron.schedule(
    "0 2 * * *",
    async () => {
      console.log("[Backup Scheduler] Iniciando backup automático...", new Date().toISOString());

      try {
        // Importar dinámicamente para evitar problemas en el cliente
        const { backupService } = await import("./backup-service");
        const { emailNotifier } = await import("./email-notifier");

        const result = await backupService.createBackup();

        if (result.success) {
          console.log("[Backup Scheduler] Backup completado exitosamente");
          await emailNotifier.notifyBackupSuccess(result);
        } else {
          console.error("[Backup Scheduler] Backup falló:", result.error);
          await emailNotifier.notifyBackupFailure(result.error || "Error desconocido", result.duration);
        }
      } catch (error) {
        console.error("[Backup Scheduler] Error durante backup:", error);
      }
    },
    {
      timezone: "America/Lima",
    }
  );

  console.log("[Backup Scheduler] Iniciado - Próximo backup: 2:00 AM (hora Perú)");
}

/**
 * Detiene el cron job de backups
 */
export function stopBackupScheduler(): void {
  if (backupTask) {
    backupTask.stop();
    backupTask = null;
    console.log("[Backup Scheduler] Detenido");
  }
}

/**
 * Ejecuta un backup inmediatamente (para testing)
 */
export async function runBackupNow(): Promise<void> {
  console.log("[Backup Scheduler] Ejecutando backup manual...");

  try {
    const { backupService } = await import("./backup-service");
    const { emailNotifier } = await import("./email-notifier");

    const result = await backupService.createBackup();

    if (result.success) {
      console.log("[Backup Scheduler] Backup completado");
      await emailNotifier.notifyBackupSuccess(result);
    } else {
      console.error("[Backup Scheduler] Backup falló:", result.error);
      await emailNotifier.notifyBackupFailure(result.error || "Error desconocido", result.duration);
    }
  } catch (error) {
    console.error("[Backup Scheduler] Error:", error);
  }
}
