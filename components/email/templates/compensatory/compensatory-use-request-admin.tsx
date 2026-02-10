/**
 * Compensatory Use Request Email to Admin
 * Sent when an employee requests to use compensatory hours for time off
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

interface CompensatoryUseRequestAdminProps {
  userName: string;
  userEmail: string;
  hours: number;
  reasonDate: string;
  approvalUrl: string;
}

export const CompensatoryUseRequestAdmin: React.FC<
  Readonly<CompensatoryUseRequestAdminProps>
> = ({ userName, userEmail, hours, reasonDate, approvalUrl }) => {
  return (
    <EmailLayout previewText="Solicitud de Uso de Horas Compensatorias">
      <EmailHeading level={1}>Solicitud de Uso de Horas Compensatorias</EmailHeading>

      <Text style={{ ...textStyle, marginBottom: '16px' }}>
        Hola,
      </Text>

      <Text style={textStyle}>
        El empleado <strong>{userName}</strong> ({userEmail}) solicita usar horas
        compensatorias para tomar un descanso.
      </Text>

      <EmailCard>
        <EmailLabel>Nombre del empleado</EmailLabel>
        <Text style={valueText}>{userName}</Text>

        <EmailLabel>Email</EmailLabel>
        <Text style={valueText}>{userEmail}</Text>

        <EmailLabel>Fecha solicitada</EmailLabel>
        <Text style={valueText}>{formatDate(reasonDate)}</Text>

        <EmailLabel>Horas a usar</EmailLabel>
        <EmailBadge variant="warning">{formatHours(hours)}</EmailBadge>
      </EmailCard>

      <Text style={textStyle}>
        Por favor, revise la solicitud y apruébela si corresponde.
      </Text>

      <EmailButton href={approvalUrl}>Revisar y Aprobar Solicitud</EmailButton>
    </EmailLayout>
  );
};

export default CompensatoryUseRequestAdmin;

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
