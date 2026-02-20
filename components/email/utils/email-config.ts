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

export function getSystemEmail(): string {
  return process.env.EMBPERUJAPAN_EMAIL || 'sistema@embperujapan.org';
}

export function isEmailTestMode(): boolean {
  return process.env.EMAIL_TEST_MODE === 'true';
}

function normalizeRecipients(recipients: string | string[] | undefined | null): string[] {
  if (!recipients) return [];
  const values = Array.isArray(recipients) ? recipients : [recipients];
  return values
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}

function dedupeRecipients(recipients: string[]): string[] {
  const seen: Record<string, string> = {};
  const deduped: string[] = [];

  for (const recipient of recipients) {
    const normalized = recipient.toLowerCase();
    if (seen[normalized]) continue;
    seen[normalized] = recipient;
    deduped.push(recipient);
  }

  return deduped;
}

/**
 * Resolves recipients for normal and test email modes.
 * In test mode, only the test user (or context user) and system email are used.
 */
export function resolveEmailRecipients(
  recipients: string | string[],
  contextUserEmail?: string | null
): string | string[] {
  const baseRecipients = dedupeRecipients(normalizeRecipients(recipients));

  if (!isEmailTestMode()) {
    if (baseRecipients.length <= 1) {
      return baseRecipients[0] || '';
    }
    return baseRecipients;
  }

  const explicitTestUser = process.env.EMAIL_TEST_USER?.trim();
  const targetUser = explicitTestUser || contextUserEmail?.trim() || '';
  const testRecipients = dedupeRecipients(
    normalizeRecipients([targetUser, getSystemEmail()])
  );

  if (testRecipients.length <= 1) {
    return testRecipients[0] || '';
  }
  return testRecipients;
}

/**
 * Build an absolute URL for a given path
 */
export function buildUrl(path: string): string {
  const baseUrl = config.urls.baseUrl;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
