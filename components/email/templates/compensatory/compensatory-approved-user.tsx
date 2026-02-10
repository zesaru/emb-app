/**
 * Compensatory Registration Approved Email to User
 * Sent when admin approves a compensatory hours registration
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

interface CompensatoryApprovedUserProps {
  userName: string;
  eventName: string;
  hours: number;
  eventDate: string;
  approvedDate: string;
  newTotalHours: number;
  dashboardUrl: string;
}

export const CompensatoryApprovedUser: React.FC<
  Readonly<CompensatoryApprovedUserProps>
> = ({
  userName,
  eventName,
  hours,
  eventDate,
  approvedDate,
  newTotalHours,
  dashboardUrl,
}) => {
  return (
    <EmailLayout previewText="¡Tu Solicitud Ha Sido Aprobada!">
      <EmailHeading level={1}>¡Tu Solicitud Ha Sido Aprobada!</EmailHeading>

      <Text style={greetingStyle}>Hola, {userName},</Text>

      <Text style={textStyle}>
        Tu solicitud de registro de horas compensatorias ha sido aprobada exitosamente.
      </Text>

      <EmailCard>
        <EmailLabel>Evento</EmailLabel>
        <Text style={valueText}>{eventName}</Text>

        <EmailLabel>Fecha del evento</EmailLabel>
        <Text style={valueText}>{formatDate(eventDate)}</Text>

        <EmailLabel>Horas registradas</EmailLabel>
        <EmailBadge variant="success">+{formatHours(hours)}</EmailBadge>

        <Text style={{ ...valueText, marginTop: '16px' }}>
          <strong>Estado:</strong>{' '}
          <span style={successTextInline}>Aprobado</span>
        </Text>

        <Text style={highlightText}>
          Total de horas acumuladas: <strong>{formatHours(newTotalHours)}</strong>
        </Text>

        <Text style={smallText}>
          Fecha de aprobación: {formatDateTime(approvedDate)}
        </Text>
      </EmailCard>

      <Text style={textStyle}>
        Ahora puedes usar estas horas compensatorias para solicitar días libres
        cuando lo necesites.
      </Text>

      <EmailButton href={dashboardUrl}>Ver en Dashboard</EmailButton>
    </EmailLayout>
  );
};

export default CompensatoryApprovedUser;

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
