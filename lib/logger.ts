/**
 * Logger estructurado para la aplicación
 * Filtra datos sensibles y proporciona contexto útil
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Campos sensibles que deben ser filtrados de los logs
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'session',
  'credit',
  'ssn',
  'email',
];

/**
 * Filtra datos sensibles de un objeto
 */
function filterSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(filterSensitiveData);
  }

  const filtered: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some(field => lowerKey.includes(field));

    if (isSensitive) {
      filtered[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      filtered[key] = filterSensitiveData(value);
    } else {
      filtered[key] = value;
    }
  }
  return filtered;
}

/**
 * Formatea el mensaje de log con timestamp y nivel
 */
function formatMessage(level: LogLevel, message: string, meta?: any): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(filterSensitiveData(meta))}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

/**
 * Logger seguro para producción
 */
export const logger = {
  /**
   * Log de información general
   */
  info: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'production') {
      // En producción, enviar a servicio de logging (ej. Sentry, CloudWatch)
      console.log(formatMessage('info', message, meta));
    } else {
      console.log(formatMessage('info', message, meta));
    }
  },

  /**
   * Log de advertencia
   */
  warn: (message: string, meta?: any) => {
    console.warn(formatMessage('warn', message, meta));
  },

  /**
   * Log de error - NO incluye datos sensibles
   */
  error: (message: string, error?: any) => {
    const errorMeta = error
      ? {
          message: error.message,
          name: error.name,
          // No incluir stack trace en producción por seguridad
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        }
      : undefined;

    console.error(formatMessage('error', message, errorMeta));
  },

  /**
   * Log de debug - solo en desarrollo
   */
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message, meta));
    }
  },
};

/**
 * Logger simplificado para server actions
 * No expone información interna en las respuestas
 */
export function logServerError(error: unknown, context: string): string {
  const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

  // Log interno sin datos sensibles
  logger.error(context, { error: errorMessage });

  // Retornar mensaje genérico para el usuario
  return 'Error procesando la solicitud';
}
