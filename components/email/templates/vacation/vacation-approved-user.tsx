/**
 * Vacation Approved Email to User
 * Sent when admin approves a vacation request
 */

import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../../base/email-layout';
import { EmailButton } from '../../base/email-button';
import { EmailCard } from '../../base/email-card';
import { EmailHeading } from '../../base/email-text';
import { EmailLabel } from '../../base/email-text';
import { EmailBadge } from '../../base/email-badge';
import { formatDateRange, formatDays, formatDateTime } from '../../utils/formatters';
import { buildUrl } from '../../utils/email-config';

interface VacationApprovedUserProps {
  userName: string;
  startDate: string;
  finishDate: string;
  days: number;
  approvedDate: string;
  newVacationBalance: number;
  calendarUrl: string;
}

export const VacationApprovedUser: React.FC<
  Readonly<VacationApprovedUserProps>
> = ({
  userName,
  startDate,
  finishDate,
  days,
  approvedDate,
  newVacationBalance,
  calendarUrl,
}) => {
  return (
    <EmailLayout previewText="¡Tu Solicitud de Vacaciones Ha Sido Aprobada!">
      <EmailHeading level={1}>¡Tu Solicitud de Vacaciones Ha Sido Aprobada!</EmailHeading>

      <Text style={greetingStyle}>Hola, {userName},</Text>

      <Text style={textStyle}>
        Tu solicitud de vacaciones ha sido aprobada exitosamente.
      </Text>

      <EmailCard>
        <EmailLabel>Período de vacaciones</EmailLabel>
        <Text style={valueText}>{formatDateRange(startDate, finishDate)}</Text>

        <EmailLabel>Días aprobados</EmailLabel>
        <EmailBadge variant="success">{formatDays(days)}</EmailBadge>

        <Text style={{ ...valueText, marginTop: '16px' }}>
          <strong>Estado:</strong>{' '}
          <span style={successTextInline}>Aprobado</span>
        </Text>

        <Text style={highlightText}>
          Días de vacaciones restantes: <strong>{formatDays(newVacationBalance)}</strong>
        </Text>

        <Text style={smallText}>
          Fecha de aprobación: {formatDateTime(approvedDate)}
        </Text>
      </EmailCard>

      <Text style={textStyle}>
        Disfruta tus vacaciones. Por favor, asegúrate de completar las tareas
        pendientes antes de tu ausencia.
      </Text>

      <EmailButton href={calendarUrl}>Ver en Calendario</EmailButton>
    </EmailLayout>
  );
};

export default VacationApprovedUser;

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
