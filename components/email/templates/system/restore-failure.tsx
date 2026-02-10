/**
 * Restore Failure Email Template
 * Sent when a database restore fails
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

interface RestoreFailureProps {
  restoreDate: string;
  backupFile: string;
  error?: string;
}

export const RestoreFailure: React.FC<Readonly<RestoreFailureProps>> = ({
  restoreDate,
  backupFile,
  error,
}) => {
  return (
    <EmailLayout previewText="Error en el Proceso de Restauración">
      <EmailHeading level={1}>✗ Error en Restauración</EmailHeading>

      <Text style={{ ...textStyle, marginBottom: '16px' }}>Hola,</Text>

      <Text style={textStyle}>
        Se ha producido un error durante el proceso de restauración de la base de
        datos.
      </Text>

      <EmailCard padding="16px">
        <EmailLabel>Archivo de backup</EmailLabel>
        <Text style={valueText}>{backupFile}</Text>

        <EmailLabel>Fecha del intento</EmailLabel>
        <Text style={valueText}>{formatDateTime(restoreDate)}</Text>

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
        error y verifica la integridad del archivo de backup.
      </Text>

      <Text style={warningTextStyle}>
        <strong>Importante:</strong> La base de datos puede estar en un estado
        inconsistente. Verifica los datos antes de continuar.
      </Text>
    </EmailLayout>
  );
};

export default RestoreFailure;

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

const warningTextStyle = {
  color: colors.warningText,
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  padding: '12px',
  backgroundColor: colors.warningYellow,
  borderRadius: '6px',
};
