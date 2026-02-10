import { Resend } from 'resend';
import { BackupMetadata, BackupResult } from './backup-types';
import { BackupSuccess } from '@/components/email/templates/system/backup-success';
import { BackupFailure } from '@/components/email/templates/system/backup-failure';
import { RestoreSuccess } from '@/components/email/templates/system/restore-success';
import { RestoreFailure } from '@/components/email/templates/system/restore-failure';
import { getFromEmail } from '@/components/email/utils/email-config';
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailNotifier = {
  async notifyBackupSuccess(result: BackupResult): Promise<void> {
    if (!result.metadata) return;

    const to = process.env.EMBPERUJAPAN_EMAIL;

    if (!to) {
      console.warn('No email configured for backup notifications');
      return;
    }

    try {
      await resend.emails.send({
        from: getFromEmail(),
        to,
        subject: `Backup Completado - ${result.metadata.filename}`,
        react: React.createElement(BackupSuccess, {
          backupDate: result.metadata.createdAt.toISOString(),
          backupSize: `${(result.metadata.size / 1024).toFixed(2)} KB`,
          backupType: 'full',
        }),
      });
    } catch (error) {
      console.error('Failed to send backup success email:', error);
    }
  },

  async notifyBackupFailure(error: string, duration: number): Promise<void> {
    const to = process.env.EMBPERUJAPAN_EMAIL;

    if (!to) {
      console.warn('No email configured for backup notifications');
      return;
    }

    try {
      await resend.emails.send({
        from: getFromEmail(),
        to,
        subject: 'Backup Fallido - EMB App',
        react: React.createElement(BackupFailure, {
          backupDate: new Date().toISOString(),
          error: error,
          backupType: 'full',
        }),
      });
    } catch (emailError) {
      console.error('Failed to send backup failure email:', emailError);
    }
  },

  async notifyRestoreSuccess(tablesAffected: string[]): Promise<void> {
    const to = process.env.EMBPERUJAPAN_EMAIL;

    if (!to) {
      console.warn('No email configured for backup notifications');
      return;
    }

    try {
      await resend.emails.send({
        from: getFromEmail(),
        to,
        subject: 'Restauración Completada - EMB App',
        react: React.createElement(RestoreSuccess, {
          restoreDate: new Date().toISOString(),
          backupFile: 'backup-restored',
          recordsRestored: tablesAffected.length,
        }),
      });
    } catch (error) {
      console.error('Failed to send restore success email:', error);
    }
  },

  async notifyRestoreFailure(error: string): Promise<void> {
    const to = process.env.EMBPERUJAPAN_EMAIL;

    if (!to) {
      console.warn('No email configured for backup notifications');
      return;
    }

    try {
      await resend.emails.send({
        from: getFromEmail(),
        to,
        subject: 'Restauración Fallida - EMB App',
        react: React.createElement(RestoreFailure, {
          restoreDate: new Date().toISOString(),
          backupFile: 'backup-file',
          error: error,
        }),
      });
    } catch (emailError) {
      console.error('Failed to send restore failure email:', emailError);
    }
  }
};
