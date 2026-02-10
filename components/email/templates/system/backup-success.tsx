/**
 * Backup Success Email Template
 * Sent when a database backup completes successfully
 */

import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../../base/email-layout';
import { EmailCard } from '../../base/email-card';
import { EmailHeading } from '../../base/email-text';
import { EmailLabel } from '../../base/email-text';
import { EmailBadge } from '../../base/email-badge';
import { formatDateTime } from '../../utils/formatters';

interface BackupSuccessProps {
  backupDate: string;
  backupSize?: string;
  backupType?: 'full' | 'incremental';
}

export const BackupSuccess: React.FC<Readonly<BackupSuccessProps>> = ({
  backupDate,
  backupSize,
  backupType = 'full',
}) => {
  return (
    <EmailLayout previewText="Backup Completado Exitosamente">
      <EmailHeading level={1}>✓ Backup Completado</EmailHeading>

      <Text style={{ ...textStyle, marginBottom: '16px' }}>Hola,</Text>

      <Text style={textStyle}>
        El backup de la base de datos se ha completado exitosamente.
      </Text>

      <EmailCard>
        <EmailLabel>Tipo de backup</EmailLabel>
        <Text style={valueText}>
          {backupType === 'full' ? 'Backup completo' : 'Backup incremental'}
        </Text>

        <EmailLabel>Fecha</EmailLabel>
        <Text style={valueText}>{formatDateTime(backupDate)}</Text>

        {backupSize && (
          <>
            <EmailLabel>Tamaño</EmailLabel>
            <Text style={valueText}>{backupSize}</Text>
          </>
        )}

        <Text style={{ ...valueText, marginTop: '16px' }}>
          <strong>Estado:</strong>
        </Text>
        <EmailBadge variant="success">Completado</EmailBadge>
      </EmailCard>

      <Text style={textStyle}>
        El archivo de backup ha sido almacenado de forma segura y está disponible
        para su restauración si es necesario.
      </Text>
    </EmailLayout>
  );
};

export default BackupSuccess;

const textStyle = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '12px 0',
};

const valueText = {
  color: '#333333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
};
