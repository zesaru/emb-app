/**
 * Compensatory Request Email to Admin
 * Sent when an employee submits a compensatory hours registration
 */

import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../../base/email-layout';
import { EmailButton } from '../../base/email-button';
import { EmailCard } from '../../base/email-card';
import { EmailHeading } from '../../base/email-text';
import { EmailLabel } from '../../base/email-text';
import { EmailBadge } from '../../base/email-badge';
import { formatDate, formatHours } from '../../utils/formatters';
import { buildUrl } from '../../utils/email-config';

interface CompensatoryRequestAdminProps {
  userName: string;
  userEmail: string;
  eventName: string;
  hours: number;
  eventDate: string;
  approvalUrl: string;
}

export const CompensatoryRequestAdmin: React.FC<
  Readonly<CompensatoryRequestAdminProps>
> = ({ userName, userEmail, eventName, hours, eventDate, approvalUrl }) => {
  return (
    <EmailLayout previewText="Nueva Solicitud de Registro Compensatorio">
      <EmailHeading level={1}>Nueva Solicitud de Registro Compensatorio</EmailHeading>

      <Text style={{ ...textStyle, marginBottom: '16px' }}>
        Hola,
      </Text>

      <Text style={textStyle}>
        El empleado <strong>{userName}</strong> ({userEmail}) ha registrado horas
        trabajadas adicionales y solicita su aprobación.
      </Text>

      <EmailCard>
        <EmailLabel>Nombre del empleado</EmailLabel>
        <Text style={valueText}>{userName}</Text>

        <EmailLabel>Email</EmailLabel>
        <Text style={valueText}>{userEmail}</Text>

        <EmailLabel>Evento</EmailLabel>
        <Text style={valueText}>{eventName}</Text>

        <EmailLabel>Fecha del evento</EmailLabel>
        <Text style={valueText}>{formatDate(eventDate)}</Text>

        <EmailLabel>Horas solicitadas</EmailLabel>
        <EmailBadge variant="info">{formatHours(hours)}</EmailBadge>
      </EmailCard>

      <Text style={textStyle}>
        Por favor, revise la solicitud y apruébela si corresponde.
      </Text>

      <EmailButton href={approvalUrl}>Revisar y Aprobar Solicitud</EmailButton>
    </EmailLayout>
  );
};

export default CompensatoryRequestAdmin;

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
