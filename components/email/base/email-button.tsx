/**
 * Email button component with variants
 * Used for CTAs in email templates
 */

import { Button, Section } from '@react-email/components';
import * as React from 'react';
import { colors, borderRadius } from '../utils/email-constants';

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const EmailButton: React.FC<Readonly<EmailButtonProps>> = ({
  href,
  children,
  variant = 'primary',
}) => {
  const style = variant === 'primary' ? primaryButtonStyle : secondaryButtonStyle;

  // El botón no debe ocupar todo el ancho ni ir pegado a los bordes del
  // cuerpo del correo -- una Section centrada + ancho automático (según el
  // padding) es el mismo patrón que usan los templates de referencia de
  // react.email (Vercel Invite, GitHub Access Token): un botón-pill
  // centrado, no una barra completa.
  return (
    <Section style={buttonWrapperStyle}>
      <Button href={href} style={style}>
        {children}
      </Button>
    </Section>
  );
};

const buttonWrapperStyle = {
  textAlign: 'center' as const,
  marginTop: '24px',
  marginBottom: '24px',
};

const primaryButtonStyle = {
  // backgroundColor primero: Outlook/M365 (motor de Word) y otros clientes no
  // soportan linear-gradient y descartan la propiedad "background" completa
  // si no la entienden -- sin este fallback sólido, el botón queda sin fondo
  // y el texto blanco se vuelve invisible. El gradient se aplica encima en
  // los clientes que sí lo soportan.
  backgroundColor: colors.accentBlue,
  background: `linear-gradient(135deg, ${colors.accentBlue} 0%, ${colors.accentPurple} 100%)`,
  borderRadius: borderRadius.md,
  color: colors.white,
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  border: 'none',
};

const secondaryButtonStyle = {
  backgroundColor: colors.white,
  borderRadius: borderRadius.md,
  color: colors.textDark,
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  border: `2px solid ${colors.border}`,
};
