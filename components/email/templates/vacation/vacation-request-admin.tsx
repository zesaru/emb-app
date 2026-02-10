/**
 * Vacation Request Email to Admin
 * Sent when an employee submits a vacation request
 */

import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../../base/email-layout';
import { EmailButton } from '../../base/email-button';
import { EmailCard } from '../../base/email-card';
import { EmailHeading } from '../../base/email-text';
import { EmailLabel } from '../../base/email-text';
import { EmailBadge } from '../../base/email-badge';
import { formatDateRange, formatDays } from '../../utils/formatters';

interface VacationRequestAdminProps {
  userName: string;
  userEmail: string;
  startDate: string;
  finishDate: string;
  days: number;
  approvalUrl: string;
}

export const VacationRequestAdmin: React.FC<
  Readonly<VacationRequestAdminProps>
> = ({ userName, userEmail, startDate, finishDate, days, approvalUrl }) => {
  return (
    <EmailLayout previewText="Nueva Solicitud de Vacaciones">
      <EmailHeading level={1}>Nueva Solicitud de Vacaciones</EmailHeading>

      <Text style={{ ...textStyle, marginBottom: '16px' }}>
        Hola,
      </Text>

      <Text style={textStyle}>
        El empleado <strong>{userName}</strong> ({userEmail}) ha solicitado días
        de vacaciones.
      </Text>

      <EmailCard>
        <EmailLabel>Nombre del empleado</EmailLabel>
        <Text style={valueText}>{userName}</Text>

        <EmailLabel>Email</EmailLabel>
        <Text style={valueText}>{userEmail}</Text>

        <EmailLabel>Período solicitado</EmailLabel>
        <Text style={valueText}>{formatDateRange(startDate, finishDate)}</Text>

        <EmailLabel>Días solicitados</EmailLabel>
        <EmailBadge variant="info">{formatDays(days)}</EmailBadge>
      </EmailCard>

      <Text style={textStyle}>
        Por favor, revise la solicitud y apruébela si corresponde.
      </Text>

      <EmailButton href={approvalUrl}>Aprobar Solicitud de Vacaciones</EmailButton>
    </EmailLayout>
  );
};

export default VacationRequestAdmin;

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
