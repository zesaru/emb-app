/**
 * Email card component for content grouping
 * Provides visual separation and hierarchy
 */

import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { colors, borderRadius } from '../utils/email-constants';

interface EmailCardProps {
  children: React.ReactNode;
  padding?: string;
}

export const EmailCard: React.FC<Readonly<EmailCardProps>> = ({
  children,
  padding = '24px',
}) => {
  return (
    <Section style={cardStyle}>
      <div style={{ padding }}>{children}</div>
    </Section>
  );
};

const cardStyle = {
  border: `1px solid ${colors.border}`,
  borderRadius: borderRadius.lg,
  backgroundColor: '#f9f9f9',
  marginTop: '24px',
  marginBottom: '24px',
};
