/**
 * Pending Approvals Reminder Email
 * Daily friendly-reminder sent to active admins/super_admins listing
 * compensatorio/vacation requests still waiting for approval.
 */

import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../../base/email-layout';
import { EmailButton } from '../../base/email-button';
import { EmailCard } from '../../base/email-card';
import { EmailHeading } from '../../base/email-text';
import { EmailLabel } from '../../base/email-text';
import { EmailBadge } from '../../base/email-badge';

export interface PendingApprovalItemSummary {
  name: string;
  detail: string;
}

export interface PendingApprovalsCategory {
  label: string;
  count: number;
  items: PendingApprovalItemSummary[];
}

interface PendingApprovalsReminderProps {
  categories: PendingApprovalsCategory[];
  totalCount: number;
  dashboardUrl: string;
}

const MAX_ITEMS_SHOWN = 5;

export const PendingApprovalsReminder: React.FC<
  Readonly<PendingApprovalsReminderProps>
> = ({ categories, totalCount, dashboardUrl }) => {
  return (
    <EmailLayout previewText={`Tienes ${totalCount} solicitud(es) pendiente(s) de aprobar`}>
      <EmailHeading level={1}>
        Tienes {totalCount} solicitud{totalCount === 1 ? '' : 'es'} pendiente
        {totalCount === 1 ? '' : 's'} de aprobar
      </EmailHeading>

      <Text style={{ ...textStyle, marginBottom: '16px' }}>Hola,</Text>

      <Text style={textStyle}>
        Este es un recordatorio de las solicitudes que siguen esperando tu aprobación.
      </Text>

      {categories
        .filter((category) => category.count > 0)
        .map((category) => (
          <EmailCard key={category.label}>
            <EmailLabel>{category.label}</EmailLabel>
            <EmailBadge variant="warning">
              {category.count} pendiente{category.count === 1 ? '' : 's'}
            </EmailBadge>

            {category.items.slice(0, MAX_ITEMS_SHOWN).map((item, index) => (
              <Text key={index} style={valueText}>
                {item.name} — {item.detail}
              </Text>
            ))}

            {category.count > MAX_ITEMS_SHOWN && (
              <Text style={valueText}>
                ...y {category.count - MAX_ITEMS_SHOWN} más
              </Text>
            )}
          </EmailCard>
        ))}

      <EmailButton href={dashboardUrl}>Revisar solicitudes pendientes</EmailButton>
    </EmailLayout>
  );
};

export default PendingApprovalsReminder;

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
