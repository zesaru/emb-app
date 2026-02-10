/**
 * Backup Failure Email Template
 * Sent when a database backup fails
 */

import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../../base/email-layout';
import { EmailCard } from '../../base/email-card';
import { EmailHeading } from '../../base/email-text';
import { EmailLabel } from '../../base/email-text';
import { EmailBadge } from '../../base/email-badge';
import { formatDateTime } from '../../utils/formatters';
import { colors } from '../../utils/email-constants';

interface BackupFailureProps {
  backupDate: string;
  error?: string;
  backupType?: 'full' | 'incremental';
}

export const BackupFailure: React.FC<Readonly<BackupFailureProps>> = ({
  backupDate,
  error,
  backupType = 'full',
}) => {
  return (
    <EmailLayout previewText="Error en el Proceso de Backup">
      <EmailHeading level={1}>✗ Error en Backup</EmailHeading>

      <Text style={{ ...textStyle, marginBottom: '16px' }}>Hola,</Text>

      <Text style={textStyle}>
        Se ha producido un error durante el proceso de backup.
      </Text>

      <EmailCard padding="16px">
        <EmailLabel>Tipo de backup</EmailLabel>
        <Text style={valueText}>
          {backupType === 'full' ? 'Backup completo' : 'Backup incremental'}
        </Text>

        <EmailLabel>Fecha</EmailLabel>
        <Text style={valueText}>{formatDateTime(backupDate)}</Text>

        <Text style={{ ...valueText, marginTop: '16px' }}>
          <strong>Estado:</strong>
        </Text>
        <EmailBadge variant="error">Fallido</EmailBadge>

        {error && (
          <>
            <Text style={{ ...valueText, marginTop: '16px' }}>
              <strong>Error:</strong>
            </Text>
            <Text style={errorTextStyle}>{error}</Text>
          </>
        )}
      </EmailCard>

      <Text style={textStyle}>
        Por favor, revisa los logs del sistema para obtener más detalles sobre el
        error y toma las acciones necesarias.
      </Text>
    </EmailLayout>
  );
};

export default BackupFailure;

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

const errorTextStyle = {
  color: colors.errorText,
  fontSize: '13px',
  lineHeight: '18px',
  margin: '8px 0',
  padding: '12px',
  backgroundColor: '#fee2e2',
  borderRadius: '4px',
  fontFamily: 'ui-monospace, monospace',
  whiteSpace: 'pre-wrap' as const,
};
