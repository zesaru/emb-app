/**
 * Restore Success Email Template
 * Sent when a database restore completes successfully
 */

import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../../base/email-layout';
import { EmailCard } from '../../base/email-card';
import { EmailHeading } from '../../base/email-text';
import { EmailLabel } from '../../base/email-text';
import { EmailBadge } from '../../base/email-badge';
import { formatDateTime } from '../../utils/formatters';

interface RestoreSuccessProps {
  restoreDate: string;
  backupFile: string;
  backupDate?: string;
  recordsRestored?: number;
}

export const RestoreSuccess: React.FC<Readonly<RestoreSuccessProps>> = ({
  restoreDate,
  backupFile,
  backupDate,
  recordsRestored,
}) => {
  return (
    <EmailLayout previewText="Restauración Completada Exitosamente">
      <EmailHeading level={1}>✓ Restauración Completada</EmailHeading>

      <Text style={{ ...textStyle, marginBottom: '16px' }}>Hola,</Text>

      <Text style={textStyle}>
        La restauración de la base de datos se ha completado exitosamente.
      </Text>

      <EmailCard>
        <EmailLabel>Archivo de backup</EmailLabel>
        <Text style={valueText}>{backupFile}</Text>

        {backupDate && (
          <>
            <EmailLabel>Fecha del backup</EmailLabel>
            <Text style={valueText}>{formatDateTime(backupDate)}</Text>
          </>
        )}

        <EmailLabel>Fecha de restauración</EmailLabel>
        <Text style={valueText}>{formatDateTime(restoreDate)}</Text>

        {recordsRestored && (
          <>
            <EmailLabel>Registros restaurados</EmailLabel>
            <Text style={valueText}>{recordsRestored}</Text>
          </>
        )}

        <Text style={{ ...valueText, marginTop: '16px' }}>
          <strong>Estado:</strong>
        </Text>
        <EmailBadge variant="success">Completado</EmailBadge>
      </EmailCard>

      <Text style={textStyle}>
        La base de datos ha sido restaurada correctamente y está lista para usar.
      </Text>
    </EmailLayout>
  );
};

export default RestoreSuccess;

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
