import React from "react";

import { sendOrCaptureEmail } from "@/lib/email/dev-email-outbox";
import { BackupFailure } from "@/components/email/templates/system/backup-failure";
import { BackupSuccess } from "@/components/email/templates/system/backup-success";
import { RestoreFailure } from "@/components/email/templates/system/restore-failure";
import { RestoreSuccess } from "@/components/email/templates/system/restore-success";
import { isEmailDeliveryEnabled } from "@/components/email/utils/email-config";
import { BackupResult } from "./backup-types";

export const emailNotifier = {
  async notifyBackupSuccess(result: BackupResult): Promise<void> {
    if (!result.metadata) return;

    const to = process.env.EMBPERUJAPAN_EMAIL;
    if (!to) {
      console.warn("No email configured for backup notifications");
      return;
    }

    try {
      if (isEmailDeliveryEnabled()) {
        await sendOrCaptureEmail({
          to,
          subject: `Backup Completado - ${result.metadata.filename}`,
          templateName: "BackupSuccess",
          payload: {
            backupDate: result.metadata.createdAt.toISOString(),
            backupSize: `${(result.metadata.size / 1024).toFixed(2)} KB`,
            backupType: "full",
          },
          react: React.createElement(BackupSuccess, {
            backupDate: result.metadata.createdAt.toISOString(),
            backupSize: `${(result.metadata.size / 1024).toFixed(2)} KB`,
            backupType: "full",
          }),
        });
      } else {
        console.info("Email delivery skipped for notifyBackupSuccess");
      }
    } catch (error) {
      console.error("Failed to send backup success email:", error);
    }
  },

  async notifyBackupFailure(error: string, duration?: number): Promise<void> {
    const to = process.env.EMBPERUJAPAN_EMAIL;
    if (!to) {
      console.warn("No email configured for backup notifications");
      return;
    }

    try {
      if (isEmailDeliveryEnabled()) {
        await sendOrCaptureEmail({
          to,
          subject: "Backup Fallido - EMB App",
          templateName: "BackupFailure",
          payload: {
            backupDate: new Date().toISOString(),
            error,
            backupType: "full",
            duration,
          },
          react: React.createElement(BackupFailure, {
            backupDate: new Date().toISOString(),
            error,
            backupType: "full",
          }),
        });
      } else {
        console.info("Email delivery skipped for notifyBackupFailure");
      }
    } catch (emailError) {
      console.error("Failed to send backup failure email:", emailError);
    }
  },

  async notifyRestoreSuccess(tablesAffected: string[]): Promise<void> {
    const to = process.env.EMBPERUJAPAN_EMAIL;
    if (!to) {
      console.warn("No email configured for backup notifications");
      return;
    }

    try {
      if (isEmailDeliveryEnabled()) {
        await sendOrCaptureEmail({
          to,
          subject: "Restauracion Completada - EMB App",
          templateName: "RestoreSuccess",
          payload: {
            restoreDate: new Date().toISOString(),
            backupFile: "backup-restored",
            recordsRestored: tablesAffected.length,
          },
          react: React.createElement(RestoreSuccess, {
            restoreDate: new Date().toISOString(),
            backupFile: "backup-restored",
            recordsRestored: tablesAffected.length,
          }),
        });
      } else {
        console.info("Email delivery skipped for notifyRestoreSuccess");
      }
    } catch (error) {
      console.error("Failed to send restore success email:", error);
    }
  },

  async notifyRestoreFailure(error: string): Promise<void> {
    const to = process.env.EMBPERUJAPAN_EMAIL;
    if (!to) {
      console.warn("No email configured for backup notifications");
      return;
    }

    try {
      if (isEmailDeliveryEnabled()) {
        await sendOrCaptureEmail({
          to,
          subject: "Restauracion Fallida - EMB App",
          templateName: "RestoreFailure",
          payload: {
            restoreDate: new Date().toISOString(),
            backupFile: "backup-file",
            error,
          },
          react: React.createElement(RestoreFailure, {
            restoreDate: new Date().toISOString(),
            backupFile: "backup-file",
            error,
          }),
        });
      } else {
        console.info("Email delivery skipped for notifyRestoreFailure");
      }
    } catch (emailError) {
      console.error("Failed to send restore failure email:", emailError);
    }
  },
};
