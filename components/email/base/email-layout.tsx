/**
 * Base email layout component with header and footer
 * Provides consistent structure and branding for all emails
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { colors, fonts, spacing } from '../utils/email-constants';

interface EmailLayoutProps {
  previewText: string;
  children: React.ReactNode;
}

export const EmailLayout: React.FC<Readonly<EmailLayoutProps>> = ({
  previewText,
  children,
}) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Heading style={logoText}>
              <span style={logoAccent}>EMB</span> | Embajada del Perú en Japón
            </Heading>
          </Section>

          {/* Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Este es un mensaje automático, por favor no respondas a este email.
              <br />
              <br />
              © {new Date().getFullYear()} Embajada del Perú en Japón. Todos los derechos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default EmailLayout;

// Styles
const main = {
  backgroundColor: colors.background,
  fontFamily: fonts.primary,
};

const container = {
  backgroundColor: colors.white,
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 40px 24px',
  textAlign: 'center' as const,
  borderBottom: `1px solid ${colors.border}`,
};

const logoText = {
  color: colors.textDark,
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const logoAccent = {
  background: `linear-gradient(135deg, ${colors.accentBlue} 0%, ${colors.accentPurple} 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: '900',
};

const content = {
  padding: '40px',
};

const footerSection = {
  padding: '24px 40px 32px',
  borderTop: `1px solid ${colors.border}`,
};

const footerText = {
  color: colors.textMuted,
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  margin: '0',
};
