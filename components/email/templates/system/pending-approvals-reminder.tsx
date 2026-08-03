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
import { EmailHeading, EmailSeparator } from '../../base/email-text';

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

const MAX_ITEMS_SHOWN = 3;

export const PendingApprovalsReminder: React.FC<
  Readonly<PendingApprovalsReminderProps>
> = ({ categories, totalCount, dashboardUrl }) => {
  const activeCategories = categories.filter((category) => category.count > 0);

  return (
    <EmailLayout previewText={`Tienes ${totalCount} solicitud(es) pendiente(s) de aprobar`}>
      <EmailHeading level={2}>
        {totalCount} solicitud{totalCount === 1 ? '' : 'es'} pendiente
        {totalCount === 1 ? '' : 's'} de aprobar
      </EmailHeading>

      <EmailCard padding="16px 20px">
        {activeCategories.map((category, categoryIndex) => (
          <React.Fragment key={category.label}>
            {categoryIndex > 0 && <EmailSeparator margin="12px 0" />}

            <Text style={categoryHeaderStyle}>
              {category.label} ({category.count})
            </Text>

            {category.items.slice(0, MAX_ITEMS_SHOWN).map((item, index) => (
              <Text key={index} style={itemStyle}>
                {item.name} — {item.detail}
              </Text>
            ))}

            {category.count > MAX_ITEMS_SHOWN && (
              <Text style={moreStyle}>
                +{category.count - MAX_ITEMS_SHOWN} más
              </Text>
            )}
          </React.Fragment>
        ))}
      </EmailCard>

      <EmailButton href={dashboardUrl}>Revisar solicitudes pendientes</EmailButton>
    </EmailLayout>
  );
};

export default PendingApprovalsReminder;

const categoryHeaderStyle = {
  color: '#333333',
  fontSize: '14px',
  fontWeight: 'bold',
  lineHeight: '20px',
  margin: '0 0 4px 0',
};

const itemStyle = {
  color: '#555555',
  fontSize: '13px',
  lineHeight: '18px',
  margin: '2px 0',
};

const moreStyle = {
  color: '#888888',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '2px 0',
  fontStyle: 'italic' as const,
};
