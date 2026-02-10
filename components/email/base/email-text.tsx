/**
 * Typography components for emails
 * Provides consistent text styling
 */

import { Heading, Text, Hr } from '@react-email/components';
import * as React from 'react';
import { colors } from '../utils/email-constants';

interface EmailHeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3;
}

export const EmailHeading: React.FC<Readonly<EmailHeadingProps>> = ({
  children,
  level = 2,
}) => {
  const style = level === 1 ? h1Style : level === 2 ? h2Style : h3Style;

  return <Heading style={style}>{children}</Heading>;
};

interface EmailParagraphProps {
  children: React.ReactNode;
}

export const EmailParagraph: React.FC<Readonly<EmailParagraphProps>> = ({
  children,
}) => {
  return <Text style={paragraphStyle}>{children}</Text>;
};

interface EmailLabelProps {
  children: React.ReactNode;
}

export const EmailLabel: React.FC<Readonly<EmailLabelProps>> = ({ children }) => {
  return (
    <Text style={labelStyle}>
      <strong>{children}</strong>
    </Text>
  );
};

interface EmailSeparatorProps {
  margin?: string;
}

export const EmailSeparator: React.FC<Readonly<EmailSeparatorProps>> = ({
  margin = '24px 0',
}) => {
  return <Hr style={{ ...separatorStyle, margin }} />;
};

// Styles
const h1Style = {
  color: colors.textDark,
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  padding: '0',
  textAlign: 'left' as const,
};

const h2Style = {
  color: colors.textDark,
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
  padding: '0',
  textAlign: 'left' as const,
};

const h3Style = {
  color: colors.textDark,
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 8px 0',
  padding: '0',
  textAlign: 'left' as const,
};

const paragraphStyle = {
  color: colors.textDark,
  fontSize: '16px',
  lineHeight: '26px',
  margin: '12px 0',
  textAlign: 'left' as const,
};

const labelStyle = {
  color: colors.textDark,
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
  display: 'block' as const,
};

const separatorStyle = {
  border: 'none',
  borderTop: `1px solid ${colors.border}`,
};
