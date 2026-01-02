import { Resend } from 'resend';
import { BackupMetadata, BackupResult } from './backup-types';

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
        from: 'Team <team@peruinjapan.com>',
        to,
        subject: `Backup Completado - ${result.metadata.filename}`,
        text: `Se ha completado exitosamente un backup de la base de datos.

Detalles:
- ID: ${result.metadata.id}
- Archivo: ${result.metadata.filename}
- Fecha: ${result.metadata.createdAt.toISOString()}
- Tamaño: ${(result.metadata.size / 1024).toFixed(2)} KB
- Ubicación: ${result.metadata.storageLocation.join(', ')}
- Duración: ${(result.duration / 1000).toFixed(2)} segundos
- Tablas: ${result.metadata.tablesCount}`,
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
        from: 'Team <team@peruinjapan.com>',
        to,
        subject: 'Backup Fallido - EMB App',
        text: `Ha fallado el proceso de backup de la base de datos.

Error: ${error}
Duración del intento: ${(duration / 1000).toFixed(2)} segundos

Por favor revise los logs para más información.`,
      });
    } catch (error) {
      console.error('Failed to send backup failure email:', error);
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
        from: 'Team <team@peruinjapan.com>',
        to,
        subject: 'Restauración Completada - EMB App',
        text: `Se ha completado exitosamente la restauración de la base de datos.

Tablas afectadas:
${tablesAffected.map(table => `- ${table}`).join('\n')}

Fecha de restauración: ${new Date().toISOString()}`,
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
        from: 'Team <team@peruinjapan.com>',
        to,
        subject: 'Restauración Fallida - EMB App',
        text: `Ha fallado el proceso de restauración de la base de datos.

Error: ${error}

Por favor revise los logs para más información.`,
      });
    } catch (error) {
      console.error('Failed to send restore failure email:', error);
    }
  }
};
