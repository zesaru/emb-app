/**
 * Email design constants for the EMB application
 * Maintains consistent branding across all email templates
 */

export const colors = {
  primary: '#1c1c1c',           // Negro/gris oscuro
  accentBlue: '#3b82f6',        // Azul del logo
  accentPurple: '#8b5cf6',      // Púrpura del logo
  successGreen: '#d1fae5',      // Fondo éxito
  successText: '#065f46',       // Texto éxito
  errorRed: '#fecaca',          // Fondo error
  errorText: '#991b1b',         // Texto error
  warningYellow: '#fef3c7',     // Fondo warning
  warningText: '#92400e',       // Texto warning
  infoBlue: '#dbeafe',          // Fondo info
  infoText: '#1e40af',          // Texto info
  background: '#f6f9fc',        // Fondo página
  white: '#ffffff',
  textDark: '#333333',
  textMuted: '#8898aa',
  border: '#e8e8e8',
};

export const fonts = {
  primary:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  mono: 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

export const borderRadius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  full: '9999px',
};

export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
};
