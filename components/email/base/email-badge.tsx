/**
 * Email badge component for status indicators
 * Used to highlight states like approved, pending, etc.
 */

import { Text } from '@react-email/components';
import * as React from 'react';
import { colors, borderRadius } from '../utils/email-constants';

interface EmailBadgeProps {
  children: React.ReactNode;
  variant: 'success' | 'warning' | 'error' | 'info';
}

export const EmailBadge: React.FC<Readonly<EmailBadgeProps>> = ({
  children,
  variant,
}) => {
  const style = badgeStyles[variant];

  return (
    <Text style={badgeBaseStyle}>
      <span style={style}>{children}</span>
    </Text>
  );
};

const badgeBaseStyle = {
  display: 'inline-block',
  margin: '8px 0',
};

const badgeStyles = {
  success: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: borderRadius.full,
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: colors.successGreen,
    color: colors.successText,
  },
  warning: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: borderRadius.full,
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: colors.warningYellow,
    color: colors.warningText,
  },
  error: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: borderRadius.full,
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: colors.errorRed,
    color: colors.errorText,
  },
  info: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: borderRadius.full,
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: colors.infoBlue,
    color: colors.infoText,
  },
};
