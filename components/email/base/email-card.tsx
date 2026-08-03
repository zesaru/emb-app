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
  // Fondo blanco + borde fino en vez de relleno gris: mismo patrón que usan
  // las plantillas de referencia de react.email (Vercel Invite, GitHub
  // Access Token) para notificaciones utilitarias -- se ve más limpio y
  // "nativo" de cliente de correo que una tarjeta con fondo sólido.
  border: `1px solid ${colors.border}`,
  borderRadius: borderRadius.lg,
  backgroundColor: colors.white,
  marginTop: '24px',
  marginBottom: '24px',
};
