/**
 * Email configuration constants
 */

export const config = {
  // Sender information
  from: {
    name: 'EMB - Embajada del Perú en Japón',
    email: 'noreply@embassyofperuinjapan.org',
  },

  // Fallback sender (for testing or if domain not verified)
  fromFallback: {
    name: 'EMB',
    email: 'team@peruinjapan.com',
  },

  // URLs
  urls: {
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://emb-app.vercel.app',
    dashboard: '/',
    calendar: '/calendar',
    compensatorios: '/compensatorios',
    vacations: '/vacaciones',
  },

  // Company info
  company: {
    name: 'Embajada del Perú en Japón',
    shortName: 'EMB',
    address: 'Tokio, Japón',
  },

  // Email preferences
  preferences: {
    timezone: 'Asia/Tokyo',
    locale: 'es',
  },
};

/**
 * Get the from email address
 * Uses the verified domain if available, otherwise falls back to test domain
 */
export function getFromEmail() {
  // Use fallback if RESEND_API_KEY is in test mode
  if (process.env.RESEND_API_KEY?.startsWith('re_')) {
    return `${config.fromFallback.name} <${config.fromFallback.email}>`;
  }

  return `${config.from.name} <${config.from.email}>`;
}

/**
 * Build an absolute URL for a given path
 */
export function buildUrl(path: string): string {
  const baseUrl = config.urls.baseUrl;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
