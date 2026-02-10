/**
 * Compensatory Use Approved Email to User
 * Sent when admin approves a request to use compensatory hours
 */

import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../../base/email-layout';
import { EmailButton } from '../../base/email-button';
import { EmailCard } from '../../base/email-card';
import { EmailHeading } from '../../base/email-text';
import { EmailLabel } from '../../base/email-text';
import { EmailBadge } from '../../base/email-badge';
import { formatDate, formatHours, formatDateTime } from '../../utils/formatters';
import { buildUrl } from '../../utils/email-config';

interface CompensatoryUseApprovedUserProps {
  userName: string;
  hours: number;
  reasonDate: string;
  approvedDate: string;
  remainingHours: number;
  dashboardUrl: string;
}

export const CompensatoryUseApprovedUser: React.FC<
  Readonly<CompensatoryUseApprovedUserProps>
> = ({
  userName,
  hours,
  reasonDate,
  approvedDate,
  remainingHours,
  dashboardUrl,
}) => {
  return (
    <EmailLayout previewText="¡Tu Solicitud de Descanso Ha Sido Aprobada!">
      <EmailHeading level={1}>¡Tu Solicitud de Descanso Ha Sido Aprobada!</EmailHeading>

      <Text style={greetingStyle}>Hola, {userName},</Text>

      <Text style={textStyle}>
        Tu solicitud de uso de horas compensatorias ha sido aprobada.
      </Text>

      <EmailCard>
        <EmailLabel>Fecha del descanso</EmailLabel>
        <Text style={valueText}>{formatDate(reasonDate)}</Text>

        <EmailLabel>Horas utilizadas</EmailLabel>
        <EmailBadge variant="success">-{formatHours(hours)}</EmailBadge>

        <Text style={{ ...valueText, marginTop: '16px' }}>
          <strong>Estado:</strong>{' '}
          <span style={successTextInline}>Aprobado</span>
        </Text>

        <Text style={highlightText}>
          Horas restantes disponibles: <strong>{formatHours(remainingHours)}</strong>
        </Text>

        <Text style={smallText}>
          Fecha de aprobación: {formatDateTime(approvedDate)}
        </Text>
      </EmailCard>

      <Text style={textStyle}>
        Disfruta tu descanso. No olvides registrar tus actividades cuando retornes.
      </Text>

      <EmailButton href={dashboardUrl}>Ver en Dashboard</EmailButton>
    </EmailLayout>
  );
};

export default CompensatoryUseApprovedUser;

const greetingStyle = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '12px 0',
};

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

const successTextInline = {
  color: '#065f46',
  fontWeight: 'bold',
};

const highlightText = {
  color: '#1c1c1c',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0 8px 0',
  padding: '12px',
  backgroundColor: '#f0f9ff',
  borderRadius: '6px',
  textAlign: 'center' as const,
};

const smallText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '8px 0',
};
